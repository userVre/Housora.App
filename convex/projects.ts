import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwner, requireProjectAccess } from "./helpers";

async function owner(ctx: any) {
  const i = await ctx.auth.getUserIdentity();
  if (!i) throw new Error("signin");
  return i.subject;
}

// Clients
export const createClient = mutation({
  args:{ name:v.string(), email:v.optional(v.string()), phone:v.optional(v.string()), notes:v.optional(v.string()) },
  handler: async(ctx,a)=>{ const ownerId=await owner(ctx); return await ctx.db.insert("housoraClients",{ownerId,...a, createdAt:Date.now()});}
});
export const listClients = query({ args:{}, handler: async(ctx)=>{ const ownerId=await owner(ctx); return await ctx.db.query("housoraClients").withIndex("by_owner",q=>q.eq("ownerId",ownerId)).collect(); }});

// Projects (multi-room)
export const createProject = mutation({
  args:{ clientId:v.string(), name:v.string(), description:v.optional(v.string())},
  handler: async(ctx,a)=>{ const ownerId=await owner(ctx); const id=await ctx.db.insert("housoraProjects",{ownerId, ...a, status:"active", createdAt:Date.now(), updatedAt:Date.now()}); await ctx.db.insert("projectMembers",{projectId:id, userId:ownerId, role:"owner", createdAt:Date.now()}); return id; }
});
export const listProjects = query({ args:{}, handler: async(ctx)=>{ const ownerId=await owner(ctx); return await ctx.db.query("housoraProjects").withIndex("by_owner",q=>q.eq("ownerId",ownerId)).order("desc").collect(); }});
export const getProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.get(projectId as any);
  },
});

// Rooms
export const createRoom = mutation({
  args: { projectId: v.string(), name: v.string(), type: v.string(), dimensions: v.optional(v.object({ w: v.number(), h: v.number(), ceiling: v.optional(v.number()) })), floorPlanUrl: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer", "collaborator"]);
    return await ctx.db.insert("housoraRooms", { ownerId, ...a, createdAt: Date.now() });
  },
});
export const listRooms = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.query("housoraRooms").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
  },
});

// Style libraries
export const upsertStyleLibrary = mutation({
  args: { projectId: v.string(), name: v.string(), palette: v.optional(v.string()), materials: v.optional(v.array(v.object({ name: v.string(), url: v.optional(v.string()), color: v.optional(v.string()) }))), locked: v.boolean() },
  handler: async (ctx, a) => {
    const { ownerId } = await requireProjectAccess(ctx, a.projectId, ["owner", "designer"]);
    const existing = await ctx.db.query("housoraStyleLibraries").withIndex("by_project", (q) => q.eq("projectId", a.projectId)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...a, lockedAt: a.locked ? Date.now() : undefined });
      return existing._id;
    }
    return await ctx.db.insert("housoraStyleLibraries", { ownerId, ...a, lockedAt: a.locked ? Date.now() : undefined, createdAt: Date.now() });
  },
});
export const getStyleLibrary = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.query("housoraStyleLibraries").withIndex("by_project", (q) => q.eq("projectId", projectId)).first();
  },
});

// RBAC
export const addMember = mutation({
  args:{ projectId:v.string(), userId:v.string(), role:v.union(v.literal("designer"),v.literal("collaborator"),v.literal("client_viewer")), email:v.optional(v.string())},
  handler: async(ctx,a)=>{ const ownerId=await owner(ctx); const proj=await ctx.db.get(a.projectId as any); if(!proj|| (proj as any).ownerId!==ownerId) throw new Error("not owner"); return await ctx.db.insert("projectMembers",{...a, createdAt:Date.now()}); }
});
export const listMembers = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    await requireProjectAccess(ctx, projectId);
    return await ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect();
  },
});
export const checkAccess = query({ args:{ projectId:v.string()}, handler: async(ctx,{projectId})=>{ const ownerId=await owner(ctx); const proj=await ctx.db.get(projectId as any); if((proj as any)?.ownerId===ownerId) return "owner"; const m=await ctx.db.query("projectMembers").withIndex("by_project_user",q=>q.eq("projectId",projectId).eq("userId",ownerId)).unique(); return m?.role||null; }});
