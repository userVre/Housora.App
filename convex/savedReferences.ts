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
    const rows = await ctx.db.query("savedReferences").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    return rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },
});

export const save = mutation({
  args: { title: v.string(), room: v.string(), style: v.string(), image: v.string(), prompt: v.string(), savedAt: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedReferences").withIndex("by_owner_title", (q) => q.eq("ownerId", ownerId).eq("title", args.title)).unique();
    if (existing) return existing._id;
    return await ctx.db.insert("savedReferences", { ownerId, ...args });
  },
});

export const remove = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedReferences").withIndex("by_owner_title", (q) => q.eq("ownerId", ownerId).eq("title", title)).unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
