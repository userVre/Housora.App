import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function owner(ctx: any) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) throw new Error("Signed in required");
  return id.subject;
}

export const create = mutation({
  args: { projectId: v.string(), roomId: v.string(), image: v.string(), prompt: v.optional(v.string()), mode: v.optional(v.string()), parentVersionId: v.optional(v.string()), label: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const ownerId = await owner(ctx);
    return await ctx.db.insert("roomVersions", { ownerId, ...a, createdAt: Date.now() });
  },
});
export const list = query({
  args: { roomId: v.string() },
  handler: async (ctx, { roomId }) => {
    const ownerId = await owner(ctx);
    const rows = await ctx.db.query("roomVersions").withIndex("by_room", q => q.eq("roomId", roomId)).collect();
    return rows.filter(r => r.ownerId === ownerId).sort((a,b)=>b.createdAt-a.createdAt).slice(0,30);
  },
});
export const undo = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, { roomId }) => {
    const ownerId = await owner(ctx);
    const rows = await ctx.db.query("roomVersions").withIndex("by_room", q=>q.eq("roomId", roomId)).collect();
    const mine = rows.filter(r=>r.ownerId===ownerId).sort((a,b)=>b.createdAt-a.createdAt);
    if (mine.length < 2) return null;
    return mine[1]; // previous version
  },
});
