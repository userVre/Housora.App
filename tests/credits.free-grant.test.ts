/// <reference types="vite/client" />
import { test, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const serverKey = "test-only-secret";
beforeEach(() => { process.env.WHOP_WEBHOOK_SECRET = serverKey; });
test("new free account receives 12 credits exactly once", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "alice" });
  const before = await user.query(api.credits.getMyBalance, {}); expect(before.subscription).toBe(12); expect(before.total).toBe(12);
  await user.mutation(api.credits.initialize, {}); const after = await user.query(api.credits.getMyBalance, {});
  expect(after.subscription).toBe(12); expect(after.total).toBe(12);
  const hist = await user.query(api.credits.getMyHistory, {}); const welcome = hist.filter((h:any)=>h.type==="welcome_grant"); expect(welcome).toHaveLength(1); expect(welcome[0].subscriptionDelta).toBe(12);
});
test("reinitialization cannot grant credits again", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "bob" });
  await user.mutation(api.credits.initialize, {}); await user.mutation(api.credits.initialize, {}); await user.mutation(api.credits.initialize, {});
  const bal = await user.query(api.credits.getMyBalance, {}); expect(bal.subscription).toBe(12);
  const hist = await user.query(api.credits.getMyHistory, {}); expect(hist.filter((h:any)=>h.type==="welcome_grant")).toHaveLength(1);
});
test("free welcome credit is lifetime-per-user", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "carol" });
  await user.mutation(api.credits.initialize, {});
  await t.mutation(api.credits.consumeServer, { serverKey, ownerId: "carol", eventId: "use1", amount: 4, description: "edit" });
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(8);
  await user.mutation(api.credits.initialize, {}); expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(8);
  const hist = await user.query(api.credits.getMyHistory, {}); expect(hist.filter((h:any)=>h.type==="welcome_grant")).toHaveLength(1);
});
test("paid and purchased balances are never overwritten by repair", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "paidUser" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "evt-sub", eventType: "payment.succeeded", ownerId: "paidUser", offerKey: "creator_monthly", paymentId: "pay-sub" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "evt-pack", eventType: "payment.succeeded", ownerId: "paidUser", offerKey: "credits_150", paymentId: "pay-pack" });
  expect((await user.query(api.credits.getMyBalance, {})).subscription).toBe(120); expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(150);
  await t.mutation(api.credits.repairFreeBalanceServer, { serverKey, ownerId: "paidUser" });
  const after = await user.query(api.credits.getMyBalance, {}); expect(after.subscription).toBe(120); expect(after.purchased).toBe(150);
});
test("duplicate Whop payment cannot grant twice (delivery + payment idempotent)", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "dupUser" });
  const base = { serverKey, eventType: "payment.succeeded" as const, ownerId: "dupUser", offerKey: "credits_50" as const, paymentId: "pay-dup" };
  await t.mutation(api.credits.fulfillWhopServer, { ...base, eventId: "evt-a" });
  expect(await t.mutation(api.credits.fulfillWhopServer, { ...base, eventId: "evt-b" })).toEqual({ duplicate: true });
  expect(await t.mutation(api.credits.fulfillWhopServer, { ...base, eventId: "evt-a" })).toEqual({ duplicate: true });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(50); expect((await user.query(api.credits.getMyBalance, {})).total).toBe(62);
});
test("refunds and disputes reverse only the applicable grant", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "refunder" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "e1", eventType: "payment.succeeded", ownerId: "refunder", offerKey: "credits_50", paymentId: "pay-50" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "e2", eventType: "payment.succeeded", ownerId: "refunder", offerKey: "credits_150", paymentId: "pay-150" });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(200);
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "refund-1", eventType: "refund.created", ownerId: "refunder", paymentId: "pay-50" });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(150);
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "dispute-1", eventType: "dispute.created", ownerId: "refunder", paymentId: "pay-150" });
  expect((await user.query(api.credits.getMyBalance, {})).purchased).toBe(0);
});
test("paid subscriptions 120 and 400 are never capped by repair", async () => {
  const t = convexTest(schema, modules); const creator = t.withIdentity({ subject: "creatorUser" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "c1", eventType: "payment.succeeded", ownerId: "creatorUser", offerKey: "creator_monthly", paymentId: "pay-c" });
  expect((await creator.query(api.credits.getMyBalance, {})).subscription).toBe(120);
  await t.mutation(api.credits.repairFreeBalanceServer, { serverKey, ownerId: "creatorUser" }); expect((await creator.query(api.credits.getMyBalance, {})).subscription).toBe(120);
  const studio = t.withIdentity({ subject: "studioUser" });
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "s1", eventType: "payment.succeeded", ownerId: "studioUser", offerKey: "studio_monthly", paymentId: "pay-s" });
  expect((await studio.query(api.credits.getMyBalance, {})).subscription).toBe(400);
  await t.mutation(api.credits.repairFreeBalanceServer, { serverKey, ownerId: "studioUser" }); expect((await studio.query(api.credits.getMyBalance, {})).subscription).toBe(400);
});
test("repair is idempotent and preserves valid packs when no legacy grant exists", async () => {
  const t = convexTest(schema, modules); const user = t.withIdentity({ subject: "legacyFree" });
  await user.mutation(api.credits.initialize, {});
  await t.mutation(api.credits.fulfillWhopServer, { serverKey, eventId: "evt-valid", eventType: "payment.succeeded", ownerId: "legacyFree", offerKey: "credits_150", paymentId: "pay-valid-150" });
  const before = await user.query(api.credits.getMyBalance, {}); expect(before.subscription).toBe(12); expect(before.purchased).toBe(150);
  const r1 = await t.mutation(api.credits.repairFreeBalanceServer, { serverKey, ownerId: "legacyFree" }); const r2 = await t.mutation(api.credits.repairFreeBalanceServer, { serverKey, ownerId: "legacyFree" });
  expect(r1.repairedGrants).toBe(0); expect(r2.repairedGrants).toBe(0);
  const after = await user.query(api.credits.getMyBalance, {}); expect(after.purchased).toBe(150);
});
