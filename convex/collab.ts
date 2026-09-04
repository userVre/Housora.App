import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner, requireProjectAccess, cryptoToken } from "./helpers";

async function owner(ctx: any) {
  const i = await ctx.auth.getUserIdentity();
  if (!i) throw new Error("signin");
  return { id: i.subject, name: (i as any).name || "Designer" };
}

export const addComment = mutation({
  args: { projectId: v.string(), roomId: v.optional(v.string()), versionId: v.optional(v.string()), body: v.string(), xRatio: v.optional(v.number()), yRatio: v.optional(v.number()) },
  handler: async (ctx, a) => {
    await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "collaborator", "client_viewer"]);
    const o = await owner(ctx);
    if (!a.body.trim() || a.body.length > 2000) throw new Error("Invalid comment");
    return await ctx.db.insert("comments", { ownerId: o.id, authorId: o.id, authorName: o.name, ...a, resolved: false, createdAt: Date.now() });
  },
});
export const listComments = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.query("comments").withIndex("by_project", (q) => q.eq("projectId", projectId)).order("desc").collect();
  },
});
export const resolveComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const o = await owner(ctx);
    const c = await ctx.db.get(commentId);
    if (!c) throw new Error("Comment not found");
    await requireProjectAccess(ctx, c.projectId);
    // Only owner/designer or author can resolve
    if ((c as any).authorId !== o.id) {
      const access = await requireProjectAccess(ctx, (c as any).projectId);
      if (access.role === "client_viewer") throw new Error("Insufficient permissions");
    }
    await ctx.db.patch(commentId, { resolved: true });
  },
});

export const setApproval = mutation({
  args: { versionId: v.string(), projectId: v.string(), status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("changes_requested")), comment: v.optional(v.string()) },
  handler: async (ctx, a) => {
    await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "client_viewer", "collaborator"]);
    const versionId = ctx.db.normalizeId("roomVersions", a.versionId);
    const version = versionId ? await ctx.db.get(versionId) : null;
    if (!version || version.projectId !== a.projectId) throw new Error("Version does not belong to this project.");
    const o = await owner(ctx);
    const existing = await ctx.db.query("approvals").withIndex("by_version", (q) => q.eq("versionId", a.versionId)).first();
    if (existing) await ctx.db.patch(existing._id, { ...a, actorId: o.id, createdAt: Date.now() });
    else await ctx.db.insert("approvals", { ...a, actorId: o.id, createdAt: Date.now() });
  },
});
export const getApproval = query({
  args: { versionId: v.string() },
  handler: async (ctx, { versionId }) => {
    const row = await ctx.db.query("approvals").withIndex("by_version", (q) => q.eq("versionId", versionId)).first();
    if (!row) return null;
    await requireProjectAccess(ctx, (row as any).projectId);
    return row;
  },
});

// Share links — cryptographically secure token with expiration & revocation
export const createShareLink = mutation({
  args: { projectId: v.string(), role: v.union(v.literal("viewer"), v.literal("client_viewer")), expiresAt: v.optional(v.number()) },
  handler: async (ctx, a) => {
    await requireProjectAccess(ctx, a.projectId, ["owner", "designer"]);
    const o = await owner(ctx);
    const token = cryptoToken();
    const expiresAt = a.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000;
    return await ctx.db.insert("shareLinks", { ...a, token, expiresAt, createdBy: o.id, createdAt: Date.now() });
  },
});
export const getShareLink = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db.query("shareLinks").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!row) return null;
    if ((row as any).revokedAt) return null;
    if (row.expiresAt !== undefined && row.expiresAt <= Date.now()) return null;
    return row;
  },
});
export const revokeShareLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const o = await owner(ctx);
    const row = await ctx.db.query("shareLinks").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!row) throw new Error("Link not found");
    await requireProjectAccess(ctx, (row as any).projectId, ["owner", "designer"]);
    await ctx.db.patch(row._id, { revokedAt: Date.now() } as any);
  },
});

// Tokens grant read-only access to project images, never member or billing data.
export const getSharedProject = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const link = await ctx.db.query("shareLinks").withIndex("by_token", q => q.eq("token", token)).unique();
    if (!link || link.revokedAt !== undefined || (link.expiresAt !== undefined && link.expiresAt <= Date.now())) return null;
    const id = ctx.db.normalizeId("housoraProjects", link.projectId);
    const project = id ? await ctx.db.get(id) : null;
    if (!project) return null;
    const rooms = await ctx.db.query("housoraRooms").withIndex("by_project", q => q.eq("projectId", link.projectId)).take(50);
    const previews = await Promise.all(rooms.map(async room => {
      const version = await ctx.db.query("roomVersions").withIndex("by_room", q => q.eq("roomId", room._id)).order("desc").first();
      return { name: room.name, image: version?.projectId === link.projectId ? version.image : null };
    }));
    return { name: project.name, rooms: previews };
  },
});
