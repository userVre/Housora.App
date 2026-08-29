import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function owner(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await owner(ctx);
    const rows = await ctx.db.query("savedDesigns").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    return rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },
});

export const save = mutation({
  args: {
    designId: v.string(),
    title: v.string(),
    image: v.string(),
    mode: v.union(v.literal("Interior"), v.literal("Exterior"), v.literal("Garden")),
    savedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedDesigns").withIndex("by_owner_designId", (q) => q.eq("ownerId", ownerId).eq("designId", args.designId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("savedDesigns", { ownerId, ...args });
  },
});

export const remove = mutation({
  args: { designId: v.string() },
  handler: async (ctx, { designId }) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedDesigns").withIndex("by_owner_designId", (q) => q.eq("ownerId", ownerId).eq("designId", designId)).unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
