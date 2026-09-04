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
    const roomId = ctx.db.normalizeId("housoraRooms", a.roomId);
    const room = roomId ? await ctx.db.get(roomId) : null;
    if (!room || room.projectId !== a.projectId) throw new Error("Room does not belong to this project.");
    if (a.parentVersionId) {
      const parentId = ctx.db.normalizeId("roomVersions", a.parentVersionId);
      const parent = parentId ? await ctx.db.get(parentId) : null;
      if (!parent || parent.projectId !== a.projectId || parent.roomId !== a.roomId) throw new Error("Invalid parent version.");
    }
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
    const { ownerId } = await requireProjectAccess(ctx, projectId, ["owner", "designer", "collaborator"]);
    const rows = await ctx.db.query("roomVersions").withIndex("by_room", (q) => q.eq("roomId", roomId)).collect();
    const filtered = rows.filter((r) => (r as any).projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);
    if (filtered.length < 2) return null;
    const previous = filtered[1];
    // Create a new version that reverts to previous state - preserves history instead of deleting
    const newVersionId = await ctx.db.insert("roomVersions", {
      ownerId,
      projectId,
      roomId,
      image: previous.image,
      prompt: previous.prompt,
      mode: previous.mode,
      parentVersionId: filtered[0]._id,
      label: "undo",
      createdAt: Date.now(),
    });
    return await ctx.db.get(newVersionId);
  },
});
