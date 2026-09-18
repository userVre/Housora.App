import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProjectAccess, cryptoToken } from "./helpers";

const roles = v.union(v.literal("designer"), v.literal("collaborator"), v.literal("client_viewer"));

async function me(ctx: any) {
  const i = await ctx.auth.getUserIdentity();
  if (!i) throw new Error("signin");
  return { id: i.subject, email: (i as any).email ?? undefined };
}

export const create = mutation({
  args: { projectId: v.string(), email: v.optional(v.string()), role: roles },
  handler: async (ctx, a) => {
    await requireProjectAccess(ctx, a.projectId, ["owner", "designer"]);
    const o = await me(ctx);
    const email = a.email?.trim().slice(0, 160) || undefined;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That email does not look valid.");
    const token = cryptoToken();
    await ctx.db.insert("projectInvites", {
      projectId: a.projectId,
      email,
      role: a.role,
      token,
      createdBy: o.id,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });
    return token;
  },
});

export const list = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId, ["owner", "designer"]);
    return await ctx.db
      .query("projectInvites")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const revoke = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const o = await me(ctx);
    const row = await ctx.db.query("projectInvites").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!row) throw new Error("Invite not found.");
    await requireProjectAccess(ctx, (row as any).projectId, ["owner", "designer"]);
    if ((row as any).createdBy !== o.id) {
      const access = await requireProjectAccess(ctx, (row as any).projectId);
      if (access.role !== "owner") throw new Error("Only the inviter or owner can revoke.");
    }
    await ctx.db.patch(row._id, { revokedAt: Date.now() });
  },
});

export const getPublic = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db.query("projectInvites").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!row || (row as any).revokedAt || (row as any).acceptedAt) return null;
    if ((row as any).expiresAt !== undefined && (row as any).expiresAt <= Date.now()) return null;
    const id = ctx.db.normalizeId("housoraProjects", (row as any).projectId);
    const project = id ? await ctx.db.get(id) : null;
    if (!project) return null;
    return { projectName: (project as any).name, role: (row as any).role, email: (row as any).email ?? null };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const o = await me(ctx);
    const row = await ctx.db.query("projectInvites").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!row || (row as any).revokedAt) throw new Error("This invite is no longer valid.");
    if ((row as any).acceptedAt) throw new Error("This invite was already used. Ask for a new link.");
    if ((row as any).expiresAt !== undefined && (row as any).expiresAt <= Date.now()) throw new Error("This invite expired. Ask for a new link.");
    const projectId = (row as any).projectId;
    const existing = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", o.id))
      .unique();
    if (existing) {
      await ctx.db.patch((row as any)._id, { acceptedAt: Date.now() });
      return projectId;
    }
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: o.id,
      role: (row as any).role,
      email: o.email ?? (row as any).email,
      createdAt: Date.now(),
    });
    await ctx.db.patch((row as any)._id, { acceptedAt: Date.now() });
    return projectId;
  },
});
