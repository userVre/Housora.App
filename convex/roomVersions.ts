import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner, requireProjectAccess } from "./helpers";

async function owner(ctx: any) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) throw new Error("Signed in required");
  return id.subject;
}

export const create = mutation({
  args: { projectId: v.string(), roomId: v.string(), image: v.string(), prompt: v.optional(v.string()), mode: v.optional(v.string()), parentVersionId: v.optional(v.string()), label: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "collaborator"]);
    return await ctx.db.insert("roomVersions", { ownerId, ...a, createdAt: Date.now() });
  },
});
export const list = query({
  args: { roomId: v.string(), projectId: v.string() },
  handler: async (ctx, { roomId, projectId }) => {
    await requireProjectAccess(ctx, projectId);
    const rows = await ctx.db.query("roomVersions").withIndex("by_room", (q) => q.eq("roomId", roomId)).collect();
    return rows.filter((r) => (r as any).projectId === projectId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
  },
});
export const undo = mutation({
  args: { roomId: v.string(), projectId: v.string() },
  handler: async (ctx, { roomId, projectId }) => {
    await requireProjectAccess(ctx, projectId, ["owner", "designer", "collaborator"]);
    const rows = await ctx.db.query("roomVersions").withIndex("by_room", (q) => q.eq("roomId", roomId)).collect();
    const filtered = rows.filter((r) => (r as any).projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
    if (filtered.length < 2) return null;
    return filtered[1];
  },
});
