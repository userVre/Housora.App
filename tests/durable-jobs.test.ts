/// <reference types="vite/client" />
import { beforeEach, test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
const serverKey = "test-only-secret";
beforeEach(() => { process.env.WHOP_WEBHOOK_SECRET = serverKey; });
const args = { serverKey, ownerId: "alice", type: "edit" as const, requestId: "one", inputHash: "hash", image: "https://storage.example/image.png", prompt: "Edit sofa" };
test("enqueue reserves once and exposes one owner-scoped job", async () => {
  const t = convexTest(schema, modules);
  const job = await t.mutation(api.jobs.enqueueServer, args);
  await t.mutation(api.jobs.enqueueServer, args);
  expect((await t.withIdentity({ subject: "alice" }).query(api.credits.getMyBalance, {})).total).toBe(8);
  expect(await t.withIdentity({ subject: "alice" }).query(api.jobs.listRecent, {})).toHaveLength(1);
  expect(await t.mutation(internal.jobs.claimInternal, { requestId: job.requestId })).toBe(true);
  expect(await t.mutation(internal.jobs.claimInternal, { requestId: job.requestId })).toBe(false);
  expect(await t.query(api.jobs.getServer, { serverKey, ownerId: "bob", requestId: job.requestId })).toBeNull();
});
test("insufficient balance rolls back job creation", async () => {
  const t = convexTest(schema, modules);
  for (const requestId of ["a", "b", "c"]) await t.mutation(api.jobs.enqueueServer, { ...args, requestId });
  await expect(t.mutation(api.jobs.enqueueServer, { ...args, requestId: "d" })).rejects.toThrow("Not enough credits");
  expect(await t.withIdentity({ subject: "alice" }).query(api.jobs.listRecent, {})).toHaveLength(3);
});
test("watchdog refunds failed work once and prevents late success", async () => {
  const t = convexTest(schema, modules);
  const job = await t.mutation(api.jobs.enqueueServer, args);
  const identity = { requestId: job.requestId, ownerId: "alice", usageEventId: "usage:alice:edit:one" };
  await t.mutation(internal.jobs.claimInternal, { requestId: job.requestId });
  await t.action(internal.durableAi.expire, identity);
  await t.action(internal.durableAi.expire, identity);
  await t.mutation(internal.jobs.completeInternal, { requestId: job.requestId, result: { image: "late" } });
  expect((await t.query(api.jobs.getServer, { serverKey, ownerId: "alice", requestId: job.requestId }))?.status).toBe("failed");
  expect((await t.withIdentity({ subject: "alice" }).query(api.credits.getMyBalance, {})).total).toBe(12);
});
test("watchdog never refunds successfully completed work", async () => {
  const t = convexTest(schema, modules);
  const job = await t.mutation(api.jobs.enqueueServer, args);
  await t.mutation(internal.jobs.claimInternal, { requestId: job.requestId });
  await t.mutation(internal.jobs.completeInternal, { requestId: job.requestId, result: { payloadUrl: "https://storage.example/result" } });
  await t.action(internal.durableAi.expire, { requestId: job.requestId, ownerId: "alice", usageEventId: "usage:alice:edit:one" });
  expect((await t.withIdentity({ subject: "alice" }).query(api.credits.getMyBalance, {})).total).toBe(8);
});
