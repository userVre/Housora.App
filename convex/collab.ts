import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
async function owner(ctx:any){ const i=await ctx.auth.getUserIdentity(); if(!i) throw new Error("signin"); return {id:i.subject, name:(i as any).name||"Designer"}; }

export const addComment = mutation({
  args:{ projectId:v.string(), roomId:v.optional(v.string()), versionId:v.optional(v.string()), body:v.string(), xRatio:v.optional(v.number()), yRatio:v.optional(v.number())},
  handler: async(ctx,a)=>{ const o=await owner(ctx); return await ctx.db.insert("comments",{ownerId:o.id, authorId:o.id, authorName:o.name, ...a, resolved:false, createdAt:Date.now()});}
});
export const listComments = query({ args:{ projectId:v.string()}, handler: async(ctx,{projectId})=> await ctx.db.query("comments").withIndex("by_project",q=>q.eq("projectId",projectId)).order("desc").collect()});
export const resolveComment = mutation({ args:{ commentId:v.id("comments")}, handler: async(ctx,{commentId})=>{ await ctx.db.patch(commentId,{resolved:true}); }});

export const setApproval = mutation({
  args:{ versionId:v.string(), projectId:v.string(), status:v.union(v.literal("pending"),v.literal("approved"),v.literal("rejected"),v.literal("changes_requested")), comment:v.optional(v.string())},
  handler: async(ctx,a)=>{ const o=await owner(ctx); const existing=await ctx.db.query("approvals").withIndex("by_version",q=>q.eq("versionId",a.versionId)).first(); if(existing) await ctx.db.patch(existing._id,{...a, actorId:o.id, createdAt:Date.now()}); else await ctx.db.insert("approvals",{...a, actorId:o.id, createdAt:Date.now()}); }
});
export const getApproval = query({ args:{ versionId:v.string()}, handler: async(ctx,{versionId})=> await ctx.db.query("approvals").withIndex("by_version",q=>q.eq("versionId",versionId)).first()});

// Share links — token is random 24 chars, access via /share/[token] (public route checks token)
export const createShareLink = mutation({
  args:{ projectId:v.string(), role:v.union(v.literal("viewer"), v.literal("client_viewer")), expiresAt:v.optional(v.number())},
  handler: async(ctx,a)=>{ const o=await owner(ctx); const token=Math.random().toString(36).slice(2,12)+Math.random().toString(36).slice(2,14); return await ctx.db.insert("shareLinks",{...a, token, createdBy:o.id, createdAt:Date.now()});}
});
export const getShareLink = query({ args:{ token:v.string()}, handler: async(ctx,{token})=> await ctx.db.query("shareLinks").withIndex("by_token",q=>q.eq("token",token)).unique()});
