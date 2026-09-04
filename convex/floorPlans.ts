import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner, requireProjectAccess } from "./helpers";

async function owner(ctx: any) {
  const i = await ctx.auth.getUserIdentity();
  if (!i) throw new Error("signin");
  return i.subject;
}
export const create = mutation({
  args: { projectId: v.string(), roomId: v.optional(v.string()), cubiCasaJobId: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "collaborator"]);
    return await ctx.db.insert("floorPlans", { ownerId, ...a, status: "queued", createdAt: Date.now(), updatedAt: Date.now() });
  },
});
export const update = mutation({
  args: { floorPlanId: v.id("floorPlans"), status: v.union(v.literal("queued"), v.literal("processing"), v.literal("success"), v.literal("failed")), walls: v.optional(v.any()), doors: v.optional(v.any()), windows: v.optional(v.any()), dimensions: v.optional(v.any()), planUrl: v.optional(v.string()), error: v.optional(v.string()) },
  handler: async (ctx, { floorPlanId, ...rest }) => {
    const fp = await ctx.db.get(floorPlanId);
    if (!fp) throw new Error("Floor plan not found");
    await requireProjectAccess(ctx, (fp as any).projectId, ["owner", "designer"]);
    await ctx.db.patch(floorPlanId, { ...rest, updatedAt: Date.now() });
  },
});
export const listByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.query("floorPlans").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
  },
});
export const get = query({
  args: { floorPlanId: v.id("floorPlans") },
  handler: async (ctx, { floorPlanId }) => {
    const fp = await ctx.db.get(floorPlanId);
    if (!fp) return null;
    await requireProjectAccess(ctx, (fp as any).projectId);
    return fp;
  },
});
