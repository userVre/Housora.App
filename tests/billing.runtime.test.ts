/// <reference types="vite/client" />
import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const serverKey = "test-only-secret";
beforeEach(() => { process.env.WHOP_WEBHOOK_SECRET = serverKey; });
afterEach(() => { vi.useRealTimers(); });
const setup = () => { const t = convexTest(schema, modules); return { t, user: t.withIdentity({ subject: "buyer" }) }; };

test("duplicate fulfillment event grants a credit pack only once", async () => {
  const { t, user } = setup();
  const payment = { serverKey, ownerId: "buyer", eventId: "evt-pack", eventType: "payment.succeeded", paymentId: "pay-pack", offerKey: "credits_50" };
  await t.mutation(api.credits.fulfillWhopServer, payment);
  expect(await t.mutation(api.credits.fulfillWhopServer, payment)).toEqual({ duplicate: true });
  expect(await t.mutation(api.credits.fulfillWhopServer, { ...payment, eventId: "another-delivery" })).toEqual({ duplicate: true });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(50);
});
test("Tripo server request records reject callers without the internal server key", async () => {
  const { t } = setup();
  await expect(t.mutation(api.tripoRequests.saveServer, {
    serverKey: "wrong-key",
    ownerId: "buyer",
    requestId: "request-id",
    taskId: "task-id",
    usageEventId: "usage-id",
  })).rejects.toThrow("Unauthorized server call");
  await expect(t.query(api.tripoRequests.getByRequestServer, {
    serverKey: "wrong-key",
    ownerId: "buyer",
    requestId: "request-id",
  })).rejects.toThrow("Unauthorized server call");
});
test("failed payment grants no purchased credits", async () => {
  const { t, user } = setup();
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, ownerId: "buyer", eventId: "failed", eventType: "payment.failed", offerKey: "credits_50" });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(0);
});
test("renewal resets monthly allowance without stacking unused credits", async () => {
  const { t, user } = setup();
  const payment = { serverKey, ownerId: "buyer", eventType: "payment.succeeded", offerKey: "creator_monthly", membershipId: "membership" };
  await t.mutation(api.credits.fulfillWhopServer, { ...payment, eventId: "first", paymentId: "pay-first" });
  await t.mutation(api.credits.consumeServer, { serverKey, ownerId: "buyer", eventId: "usage", amount: 4, description: "Edit" });
  await t.mutation(api.credits.fulfillWhopServer, { ...payment, eventId: "renewal", paymentId: "pay-renewal" });
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(120);
});
test("monthly credits never refresh from the clock without a successful renewal payment", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const { t, user } = setup();
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, ownerId: "buyer", eventId: "monthly-payment", eventType: "payment.succeeded", paymentId: "pay-monthly", offerKey: "creator_monthly" });
  await t.mutation(api.credits.consumeServer, { serverKey, ownerId: "buyer", eventId: "monthly-usage", amount: 120, description: "Use allowance" });
  vi.setSystemTime(new Date("2026-02-15T00:00:00Z"));
  await user.mutation(api.credits.initialize, {});
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(0);
});
test("a paid yearly plan refreshes its monthly allowance inside its access window", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const { t, user } = setup();
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, ownerId: "buyer", eventId: "yearly-payment", eventType: "payment.succeeded", paymentId: "pay-yearly", offerKey: "creator_yearly" });
  await t.mutation(api.credits.consumeServer, { serverKey, ownerId: "buyer", eventId: "yearly-usage", amount: 120, description: "Use allowance" });
  vi.setSystemTime(new Date("2026-02-01T00:00:01Z"));
  await user.mutation(api.credits.initialize, {});
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(120);
});
test("expired subscription credits are neither displayed nor spendable", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const { t, user } = setup();
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, ownerId: "buyer", eventId: "expired-payment", eventType: "payment.succeeded", paymentId: "pay-expired", offerKey: "creator_monthly" });
  vi.setSystemTime(new Date("2026-02-10T00:00:00Z"));
  const balance = await user.query(api.credits.getMyBalance, {});
  expect(balance.subscription).toBe(0);
  expect(balance.status).toBe("inactive");
  await expect(t.mutation(api.credits.consumeServer, { serverKey, ownerId: "buyer", eventId: "expired-usage", amount: 1, description: "Expired usage" })).rejects.toThrow("Not enough credits");
});
test("scheduled cancellation keeps paid access until membership deactivation", async () => {
  const { t, user } = setup();
  const payment = { serverKey, ownerId: "buyer", eventType: "payment.succeeded", offerKey: "creator_monthly", membershipId: "membership", eventId: "activation", paymentId: "pay-activation" };
  await t.mutation(api.credits.fulfillWhopServer, payment);
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, ownerId: "buyer", membershipId: "membership", eventId: "cancel-scheduled", eventType: "membership.cancel_at_period_end_changed" });
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(120);
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, membershipId: "membership", eventId: "deactivated", eventType: "membership.deactivated" });
  const ended = await user.query(api.credits.getMyBalance, {});
  expect(ended.subscription).toBe(0);
  expect(ended.status).toBe("inactive");
});
test("duplicate credit requests and refunds have one effect", async () => {
  const { t, user } = setup();
  const usage = { serverKey, ownerId: "buyer", eventId: "usage:buyer:one", amount: 4, description: "Edit" };
  await t.mutation(api.credits.consumeServer, usage);
  expect((await t.mutation(api.credits.consumeServer, usage)).duplicate).toBe(true);
  const refund = { serverKey, ownerId: "buyer", usageEventId: usage.eventId, description: "Failed" };
  await t.mutation(api.credits.refundUsageEventServer, refund);
  await t.mutation(api.credits.refundUsageEventServer, refund);
  expect((await user.query(api.credits.getMyBalance, {})).total).toBe(12);
});
