/// <reference types="vite/client" />
import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
// In-memory Convex test backend. These tests do not use Clerk or a deployment.
test("cleanup respects its total row budget and deletes legacy rows", async () => {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    for (let i = 0; i < 5; i++) await ctx.db.insert("segmentationCache", { imageHash: String(i), mode: "Interior", objects: [], createdAt: 0, expiresAt: 1 });
  });
  expect(await t.mutation(internal.jobs.cleanupExpiredCachesInternal, { limit: 2 })).toEqual({ deleted: 2 });
  expect(await t.run(ctx => ctx.db.query("segmentationCache").collect())).toHaveLength(3);
});
test("legacy and other-owner caches are not visible", async () => {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    await ctx.db.insert("segmentationCache", { ownerId: "alice", imageHash: "hash", mode: "Interior", objects: [], createdAt: Date.now(), expiresAt: Date.now() + 100000 });
    await ctx.db.insert("segmentationCache", { imageHash: "legacy", mode: "Interior", objects: [], createdAt: Date.now(), expiresAt: Date.now() + 100000 });
  });
  const bob = t.withIdentity({ subject: "bob" });
  expect(await bob.query(api.jobs.getCachedSegmentation, { imageHash: "hash", mode: "Interior" })).toBeNull();
  expect(await bob.query(api.jobs.getCachedSegmentation, { imageHash: "legacy", mode: "Interior" })).toBeNull();
});
