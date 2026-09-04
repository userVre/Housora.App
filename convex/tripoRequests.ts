import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function owner(ctx: any) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) throw new Error("Signed in required");
  return id.subject;
}

export const getByRequest = query({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    const ownerId = await owner(ctx);
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", ownerId).eq("requestId", requestId)).unique();
  },
});

export const getByRequestServer = query({
  args: { ownerId: v.string(), requestId: v.string() },
  handler: async (ctx, { ownerId, requestId }) => {
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", ownerId).eq("requestId", requestId)).unique();
  },
});

export const saveServer = mutation({
  args: { ownerId: v.string(), requestId: v.string(), taskId: v.string(), usageEventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", args.ownerId).eq("requestId", args.requestId)).unique();
    if (existing) return existing;
    await ctx.db.insert("tripoRequests", { ...args, createdAt: Date.now() });
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", args.ownerId).eq("requestId", args.requestId)).unique();
  },
});
