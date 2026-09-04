import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner } from "./helpers";
function server(key: string) {
  if (!process.env.WHOP_WEBHOOK_SECRET || key !== process.env.WHOP_WEBHOOK_SECRET) throw new Error("Unauthorized");
}
export const uploadUrlServer = mutation({
  args: { serverKey: v.string() },
  handler: async (ctx, args) => { server(args.serverKey); return ctx.storage.generateUploadUrl(); },
});
export const cachePayloadUrlServer = mutation({
  args: { serverKey: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { serverKey, storageId }) => {
    server(serverKey);
    const metadata = await ctx.db.system.get(storageId);
    if (!metadata || metadata.contentType !== "application/json" || metadata.size > 15_000_000) throw new Error("Invalid cache payload");
    return ctx.storage.getUrl(storageId);
  },
});

export const saveImageServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { serverKey, ownerId, storageId }) => {
    server(serverKey);
    const metadata = await ctx.db.system.get(storageId);
    if (!metadata || !["image/png", "image/jpeg", "image/webp"].includes(metadata.contentType || "") || metadata.size > 10_000_000) throw new Error("Invalid image upload");
    await ctx.db.insert("uploads", { userId: ownerId, storageId, createdAt: Date.now(), kind: "project-image" });
    return ctx.storage.getUrl(storageId);
  },
});
export const getServer = query({
  args: { serverKey: v.string(), ownerId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    server(args.serverKey);
    const model = await ctx.db.query("generatedModels").withIndex("by_owner_task", q => q.eq("ownerId", args.ownerId).eq("taskId", args.taskId)).unique();
    return model ? ctx.storage.getUrl(model.storageId) : null;
  },
});
export const saveServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), taskId: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { serverKey, ...args }) => {
    server(serverKey);
    const existing = await ctx.db.query("generatedModels").withIndex("by_owner_task", q => q.eq("ownerId", args.ownerId).eq("taskId", args.taskId)).unique();
    if (existing) {
      if (existing.storageId !== args.storageId) await ctx.storage.delete(args.storageId);
      return ctx.storage.getUrl(existing.storageId);
    }
    await ctx.db.insert("generatedModels", { ...args, createdAt: Date.now() });
    return ctx.storage.getUrl(args.storageId);
  },
});
export const list = query({
  args: {},
  handler: async ctx => {
    const ownerId = await requireOwner(ctx);
    const rows = await ctx.db.query("generatedModels").withIndex("by_owner", q => q.eq("ownerId", ownerId)).order("desc").take(20);
    return Promise.all(rows.map(async row => ({ taskId: row.taskId, createdAt: row.createdAt, url: await ctx.storage.getUrl(row.storageId) })));
  },
});
