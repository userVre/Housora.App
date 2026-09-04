import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./helpers";
import { internal } from "./_generated/api";
import { cleanupCaches } from "./cacheCleanup";
import { consumeInTransaction } from "./credits";

async function owner(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

function requireServerKey(key: string) {
  const expected = process.env.WHOP_WEBHOOK_SECRET;
  if (!expected || key !== expected) throw new Error("Unauthorized server call.");
}

// --- Cache helpers ---

export const getCachedSegmentation = query({
  args: { imageHash: v.string(), mode: v.string() },
  handler: async (ctx, { imageHash, mode }) => {
    const ownerId = await owner(ctx);
    const row = await ctx.db
      .query("segmentationCache")
      .withIndex("by_owner_hash_mode", (q) => q.eq("ownerId", ownerId).eq("imageHash", imageHash).eq("mode", mode))
      .unique();
    if (!row || row.expiresAt < Date.now()) return null;
    return row;
  },
});

export const getCachedSegmentationServer = query({
  args: { serverKey: v.string(), ownerId: v.string(), imageHash: v.string(), mode: v.string() },
  handler: async (ctx, { serverKey: s, ownerId, imageHash, mode }) => {
    requireServerKey(s);
    const row = await ctx.db
      .query("segmentationCache")
      .withIndex("by_owner_hash_mode", (q) => q.eq("ownerId", ownerId).eq("imageHash", imageHash).eq("mode", mode))
      .unique();
    if (!row || row.expiresAt < Date.now()) return null;
    return row;
  },
});

export const saveSegmentationCacheServer = mutation({
  args: {
    serverKey: v.string(),
    ownerId: v.string(),
    imageHash: v.string(),
    mode: v.string(),
    objects: v.any(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const now = Date.now();
    const existing = await ctx.db
      .query("segmentationCache")
      .withIndex("by_owner_hash_mode", (q) => q.eq("ownerId", args.ownerId).eq("imageHash", args.imageHash).eq("mode", args.mode))
      .unique();
    if (existing) {
      const oldBlob = typeof existing.objects?.storageId === "string" ? ctx.db.system.normalizeId("_storage", existing.objects.storageId) : null;
      if (oldBlob && oldBlob !== args.objects?.storageId) await ctx.storage.delete(oldBlob);
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert("segmentationCache", {
      ownerId: args.ownerId,
      imageHash: args.imageHash,
      mode: args.mode,
      objects: args.objects,
      width: args.width,
      height: args.height,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
  },
});

export const getCachedGeneration = query({
  args: { inputHash: v.string() },
  handler: async (ctx, { inputHash }) => {
    const ownerId = await owner(ctx);
    const row = await ctx.db.query("generationCache").withIndex("by_owner_hash", (q) => q.eq("ownerId", ownerId).eq("inputHash", inputHash)).unique();
    if (!row || row.expiresAt < Date.now()) return null;
    return row;
  },
});

export const getCachedGenerationServer = query({
  args: { serverKey: v.string(), ownerId: v.string(), inputHash: v.string() },
  handler: async (ctx, { serverKey: s, ownerId, inputHash }) => {
    requireServerKey(s);
    const row = await ctx.db.query("generationCache").withIndex("by_owner_hash", (q) => q.eq("ownerId", ownerId).eq("inputHash", inputHash)).unique();
    if (!row || row.expiresAt < Date.now()) return null;
    return row;
  },
});

export const saveGenerationCacheServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), inputHash: v.string(), resultImage: v.string(), prompt: v.string(), modelVersion: v.optional(v.string()), aspectRatio: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const now = Date.now();
    const existing = await ctx.db.query("generationCache").withIndex("by_owner_hash", (q) => q.eq("ownerId", args.ownerId).eq("inputHash", args.inputHash)).unique();
    if (existing) await ctx.db.delete(existing._id);
    await ctx.db.insert("generationCache", {
      ownerId: args.ownerId,
      inputHash: args.inputHash,
      resultImage: args.resultImage,
      prompt: args.prompt,
      modelVersion: args.modelVersion,
      aspectRatio: args.aspectRatio,
      createdAt: now,
      expiresAt: now + 14 * 24 * 60 * 60 * 1000,
    });
  },
});

// --- Async jobs ---

export const enqueueServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), type: v.union(v.literal("segment"), v.literal("edit")), requestId: v.string(), inputHash: v.string(), image: v.string(), prompt: v.optional(v.string()), mode: v.optional(v.string()), mask: v.optional(v.string()), aspectRatio: v.optional(v.string()), projectId: v.optional(v.string()), roomId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const requestId = `${args.type}:${args.ownerId}:${args.requestId}`;
    const existing = await ctx.db.query("aiJobs").withIndex("by_request", q => q.eq("requestId", requestId)).unique();
    if (existing) return { requestId, status: existing.status };
    if (!/^https:\/\//.test(args.image) || (args.mask && !/^https:\/\//.test(args.mask))) throw new Error("Stored images are required for background work.");
    const usageEventId = `usage:${args.ownerId}:${args.type}:${args.requestId}`;
    const usage = await consumeInTransaction(ctx, { ownerId: args.ownerId, eventId: usageEventId, amount: args.type === "segment" ? 1 : 4, description: args.type === "segment" ? "Object detection" : "Image edit" });
    if (usage.duplicate) throw new Error("This request was already processed.");
    await ctx.db.insert("aiJobs", { ownerId: args.ownerId, type: args.type, status: "queued", requestId, inputHash: args.inputHash, inputImage: args.image, mode: args.mode, progress: 0, usageEventId, projectId: args.projectId, roomId: args.roomId, createdAt: Date.now(), updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.durableAi.execute, { requestId, ownerId: args.ownerId, type: args.type, image: args.image, mask: args.mask, prompt: args.prompt, mode: args.mode, aspectRatio: args.aspectRatio, usageEventId, inputHash: args.inputHash });
    await ctx.scheduler.runAfter(10 * 60_000, internal.durableAi.expire, { requestId, ownerId: args.ownerId, usageEventId });
    return { requestId, status: "queued" };
  },
});

export const claimInternal = internalMutation({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    const job = await ctx.db.query("aiJobs").withIndex("by_request", q => q.eq("requestId", requestId)).unique();
    if (!job || job.status !== "queued") return false;
    await ctx.db.patch(job._id, { status: "running", progress: 10, updatedAt: Date.now() });
    return true;
  },
});

export const getServer = query({
  args: { serverKey: v.string(), ownerId: v.string(), requestId: v.string() },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const job = await ctx.db.query("aiJobs").withIndex("by_request", q => q.eq("requestId", args.requestId)).unique();
    return job?.ownerId === args.ownerId ? job : null;
  },
});

export const enqueue = mutation({
  args: {
    type: v.union(v.literal("segment"), v.literal("edit"), v.literal("tripo")),
    requestId: v.string(),
    inputHash: v.string(),
    prompt: v.optional(v.string()),
    mode: v.optional(v.string()),
    projectId: v.optional(v.string()),
    roomId: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx) => {
    await owner(ctx);
    throw new Error("Background generation must use the confirmed editor action.");
  },
});

export const updateProgress = mutation({
  args: { serverKey: v.string(), requestId: v.string(), progress: v.number(), status: v.optional(v.string()) },
  handler: async (ctx, { serverKey: s, requestId, progress, status }) => {
    requireServerKey(s);
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", requestId)).unique();
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(job._id, { progress, status: (status as any) || job.status, updatedAt: Date.now() });
  },
});

export const complete = mutation({
  args: { serverKey: v.string(), requestId: v.string(), result: v.any(), tripoTaskId: v.optional(v.string()), usageEventId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", args.requestId)).unique();
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(job._id, { status: "success", result: args.result, tripoTaskId: args.tripoTaskId, usageEventId: args.usageEventId, progress: 100, updatedAt: Date.now() });
  },
});

export const fail = mutation({
  args: { serverKey: v.string(), requestId: v.string(), error: v.string() },
  handler: async (ctx, { serverKey: s, requestId, error }) => {
    requireServerKey(s);
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", requestId)).unique();
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(job._id, { status: "failed", error, updatedAt: Date.now() });
  },
});

export const get = query({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    const ownerId = await owner(ctx);
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", requestId)).unique();
    if (!job || job.ownerId !== ownerId) return null;
    return job;
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const ownerId = await owner(ctx);
    const rows = await ctx.db.query("aiJobs").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).order("desc").take(limit || 10);
    return rows;
  },
});

export const updateProgressInternal = internalMutation({
  args: { requestId: v.string(), progress: v.number(), status: v.optional(v.string()) },
  handler: async (ctx, { requestId, progress, status }) => {
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", requestId)).unique();
    if (!job) throw new Error("Job not found");
    await ctx.db.patch(job._id, { progress, status: (status as any) || job.status, updatedAt: Date.now() });
  },
});

export const completeInternal = internalMutation({
  args: { requestId: v.string(), result: v.any(), tripoTaskId: v.optional(v.string()), usageEventId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", args.requestId)).unique();
    if (!job) throw new Error("Job not found");
    if (job.status !== "running") return;
    await ctx.db.patch(job._id, { status: "success", result: args.result, tripoTaskId: args.tripoTaskId, usageEventId: args.usageEventId, progress: 100, updatedAt: Date.now() });
  },
});

export const failInternal = internalMutation({
  args: { requestId: v.string(), error: v.string() },
  handler: async (ctx, { requestId, error }) => {
    const job = await ctx.db.query("aiJobs").withIndex("by_request", (q) => q.eq("requestId", requestId)).unique();
    if (!job) throw new Error("Job not found");
    if (job.status === "success" || job.status === "failed") return false;
    await ctx.db.patch(job._id, { status: "failed", error, updatedAt: Date.now() });
    return true;
  },
});

// Cleanup expired and old global cache rows (no ownerId) — cron or manual
export const cleanupExpiredCaches = mutation({
  args: { serverKey: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { serverKey: s, limit }) => {
    requireServerKey(s);
    return cleanupCaches(ctx, limit);
  },
});

export const cleanupExpiredCachesInternal = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return cleanupCaches(ctx, limit);
  },
});

export const cleanupOrphanAssetsInternal = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const { cleanupOrphanAssets } = await import("./cacheCleanup");
    return cleanupOrphanAssets(ctx, limit);
  },
});
