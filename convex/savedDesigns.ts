import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function owner(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await owner(ctx);
    const rows = await ctx.db.query("savedDesigns").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).collect();
    return rows.filter(row => row.removedAt === undefined).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },
});

export const save = mutation({
  args: {
    designId: v.string(),
    title: v.string(),
    image: v.string(),
    mode: v.union(v.literal("Interior"), v.literal("Exterior"), v.literal("Garden")),
    savedAt: v.string(),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedDesigns").withIndex("by_owner_designId", (q) => q.eq("ownerId", ownerId).eq("designId", args.designId)).unique();
    let projectId = existing?.projectId;
    let roomId = existing?.roomId;
    const now = Date.now();
    if (!projectId || !roomId) {
      let clientId: string | null = null;
      const existingClient = await ctx.db.query("housoraClients").withIndex("by_owner_name", (q) => q.eq("ownerId", ownerId).eq("name", "Personal project")).unique();
      if (existingClient) {
        clientId = existingClient._id as unknown as string;
      } else {
        clientId = await ctx.db.insert("housoraClients", { ownerId, name: "Personal project", createdAt: now }) as unknown as string;
      }
      projectId = await ctx.db.insert("housoraProjects", { ownerId, clientId, name: args.title, status: "active", createdAt: now, updatedAt: now });
      await ctx.db.insert("projectMembers", { projectId, userId: ownerId, role: "owner", createdAt: now });
      roomId = await ctx.db.insert("housoraRooms", { ownerId, projectId, name: args.title, type: args.mode, createdAt: now });
      if (existing?.image && existing.image !== args.image) {
        await ctx.db.insert("roomVersions", { ownerId, projectId, roomId, image: existing.image, mode: existing.mode, createdAt: now - 1 });
      }
    }
    const latest = await ctx.db.query("roomVersions").withIndex("by_room", q => q.eq("roomId", roomId!)).order("desc").first();
    if (!latest || latest.image !== args.image) {
      await ctx.db.insert("roomVersions", { ownerId, projectId, roomId, image: args.image, prompt: args.prompt, mode: args.mode, createdAt: now });
    }
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, projectId, roomId, removedAt: undefined });
      return { projectId, roomId };
    }
    await ctx.db.insert("savedDesigns", { ownerId, ...args, projectId, roomId });
    return { projectId, roomId };
  },
});

export const remove = mutation({
  args: { designId: v.string() },
  handler: async (ctx, { designId }) => {
    const ownerId = await owner(ctx);
    const existing = await ctx.db.query("savedDesigns").withIndex("by_owner_designId", (q) => q.eq("ownerId", ownerId).eq("designId", designId)).unique();
    if (existing) await ctx.db.patch(existing._id, { removedAt: Date.now() });
  },
});
