import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function owner(ctx: any) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) throw new Error("Signed in required");
  return id.subject;
}
function requireServerKey(key: string) {
  const expected = process.env.HOUSORA_SERVER_KEY || process.env.WHOP_WEBHOOK_SECRET;
  if (!expected || key !== expected) throw new Error("Unauthorized server call.");
}

export const getByRequest = query({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => {
    const ownerId = await owner(ctx);
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", ownerId).eq("requestId", requestId)).unique();
  },
});

export const getByRequestServer = query({
  args: { serverKey: v.string(), ownerId: v.string(), requestId: v.string() },
  handler: async (ctx, { serverKey, ownerId, requestId }) => {
    requireServerKey(serverKey);
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", ownerId).eq("requestId", requestId)).unique();
  },
});

export const saveServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), requestId: v.string(), taskId: v.string(), usageEventId: v.string() },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const existing = await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", args.ownerId).eq("requestId", args.requestId)).unique();
    if (existing) return existing;
    const { serverKey: _serverKey, ...record } = args;
    await ctx.db.insert("tripoRequests", { ...record, createdAt: Date.now() });
    return await ctx.db.query("tripoRequests").withIndex("by_owner_request", q => q.eq("ownerId", args.ownerId).eq("requestId", args.requestId)).unique();
  },
});
