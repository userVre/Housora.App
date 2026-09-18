import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess } from "./helpers";

export const get = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    const row = await ctx.db
      .query("budgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    return row ?? { projectId, clientBudget: undefined, taxRate: 0, shippingFlat: 0, contingencyPct: 10 };
  },
});

export const save = mutation({
  args: {
    projectId: v.string(),
    clientBudget: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    shippingFlat: v.optional(v.number()),
    contingencyPct: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer"]);
    const clean = (n: number | undefined, min: number, max: number) =>
      n === undefined || Number.isNaN(n) ? undefined : Math.max(min, Math.min(max, n));
    const patch = {
      clientBudget: clean(a.clientBudget, 0, 100000000),
      taxRate: clean(a.taxRate, 0, 100) ?? 0,
      shippingFlat: clean(a.shippingFlat, 0, 1000000) ?? 0,
      contingencyPct: clean(a.contingencyPct, 0, 100) ?? 10,
    };
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_project", (q) => q.eq("projectId", a.projectId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...patch, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("budgets", { ownerId, projectId: a.projectId, ...patch, updatedAt: now });
  },
});
