import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const preferencesShape = {
  studioName: v.string(),
  language: v.string(),
  timezone: v.string(),
  currency: v.string(),
  measurements: v.string(),
  defaultMode: v.string(),
  defaultQuality: v.string(),
  referenceFidelity: v.string(),
  confirmHighCost: v.boolean(),
  generationNotifications: v.boolean(),
  creditNotifications: v.boolean(),
  collaborationNotifications: v.boolean(),
  marketingEmails: v.boolean(),
  analyticsConsent: v.boolean(),
  replayConsent: v.boolean(),
};

async function owner(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await owner(ctx);
    return await ctx.db.query("preferences").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).unique();
  },
});

export const saveMine = mutation({
  args: preferencesShape,
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("preferences").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).unique();
    const value = { ...args, ownerId, updatedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("preferences", value);
    return value;
  },
});
