import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
async function owner(ctx:any){ const i=await ctx.auth.getUserIdentity(); if(!i) throw new Error("signin"); return i.subject; }
export const save = mutation({
  args:{ source:v.union(v.literal("sketchfab_ai_generated"), v.literal("retailer_catalog")), externalId:v.string(), name:v.string(), thumbnail:v.optional(v.string()), license:v.optional(v.string()), category:v.optional(v.string()), style:v.optional(v.string()), metadata:v.optional(v.any())},
  handler: async(ctx,a)=>{ const ownerId=await owner(ctx); const existing=await ctx.db.query("furnitureModels").withIndex("by_owner_external",q=>q.eq("ownerId",ownerId).eq("externalId",a.externalId)).unique(); if(existing) return existing._id; return await ctx.db.insert("furnitureModels",{ownerId,...a, createdAt:Date.now()});}
});
export const list = query({ args:{ source:v.optional(v.string())}, handler: async(ctx,{source})=>{ const ownerId=await owner(ctx); const q=ctx.db.query("furnitureModels").withIndex("by_owner",qq=>qq.eq("ownerId",ownerId)); const rows=await q.collect(); return source? rows.filter(r=>r.source===source): rows; }});
export const search = query({ args:{ q:v.string()}, handler: async(ctx,{q})=>{ const ownerId=await owner(ctx); const rows=await ctx.db.query("furnitureModels").withIndex("by_owner",qq=>qq.eq("ownerId",ownerId)).collect(); const term=q.toLowerCase(); return rows.filter(r=> r.name.toLowerCase().includes(term) || (r.category||"").toLowerCase().includes(term)); }});
