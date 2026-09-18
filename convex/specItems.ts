import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./helpers";

async function owner(ctx: any) {
  const i = await ctx.auth.getUserIdentity();
  if (!i) throw new Error("signin");
  return i.subject;
}

export const list = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db
      .query("specItems")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    projectId: v.string(),
    roomId: v.optional(v.string()),
    name: v.string(),
    category: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    retailPrice: v.optional(v.number()),
    supplier: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "collaborator"]);
    const name = a.name.trim().slice(0, 120);
    if (!name) throw new Error("Name is required.");
    const now = Date.now();
    return await ctx.db.insert("specItems", {
      ownerId,
      projectId: a.projectId,
      roomId: a.roomId,
      name,
      category: a.category?.trim().slice(0, 80) || undefined,
      quantity: Math.max(1, Math.min(999, Math.floor(a.quantity ?? 1))),
      unit: a.unit?.trim().slice(0, 24) || undefined,
      retailPrice: a.retailPrice === undefined ? undefined : Math.max(0, Math.min(10000000, a.retailPrice)),
      supplier: a.supplier?.trim().slice(0, 120) || undefined,
      link: a.link?.trim().slice(0, 500) || undefined,
      status: "to_source",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatus = mutation({
  args: {
    itemId: v.id("specItems"),
    status: v.union(v.literal("to_source"), v.literal("specified"), v.literal("approved")),
  },
  handler: async (ctx, { itemId, status }) => {
    const o = await owner(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || (item as any).ownerId !== o) {
      if (!item) throw new Error("Item not found.");
      await requireProjectAccess(ctx, (item as any).projectId, ["owner", "designer", "collaborator"]);
    }
    await ctx.db.patch(itemId, { status, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { itemId: v.id("specItems") },
  handler: async (ctx, { itemId }) => {
    const o = await owner(ctx);
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found.");
    if ((item as any).ownerId !== o) {
      await requireProjectAccess(ctx, (item as any).projectId, ["owner", "designer"]);
    }
    await ctx.db.delete(itemId);
  },
});
