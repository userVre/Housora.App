/// <reference types="vite/client" />
import { test, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const serverKey = "test-only-secret";
beforeEach(() => { process.env.WHOP_WEBHOOK_SECRET = serverKey; });
const setup = () => { const t = convexTest(schema, modules); return { t, user: t.withIdentity({ subject: "buyer" }) }; };

test("duplicate fulfillment event grants a credit pack only once", async () => {
  const { t, user } = setup();
  const payment = { serverKey, ownerId: "buyer", eventId: "evt-pack", eventType: "payment.succeeded", paymentId: "pay-pack", offerKey: "credits_50" };
  await t.mutation(api.credits.fulfillWhopServer, payment);
  expect(await t.mutation(api.credits.fulfillWhopServer, payment)).toEqual({ duplicate: true });
  expect(await t.mutation(api.credits.fulfillWhopServer, { ...payment, eventId: "another-delivery" })).toEqual({ duplicate: true });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(50);
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
