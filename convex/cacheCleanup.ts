import type { MutationCtx } from "./_generated/server";

export async function cleanupCaches(ctx: MutationCtx, limit = 200) {
  const max = Math.max(1, Math.min(1000, Math.floor(limit)));
  if (!Number.isFinite(max)) throw new Error("Invalid cleanup limit");
  let deleted = 0;
  const now = Date.now();
  const remove = async (rows: Array<{ _id: any; objects?: any }>) => {
    for (const row of rows) {
      const blobId = typeof row.objects?.storageId === "string" ? ctx.db.system.normalizeId("_storage", row.objects.storageId) : null;
      if (blobId) await ctx.storage.delete(blobId);
      await ctx.db.delete(row._id); deleted++;
    }
  };
  await remove(await ctx.db.query("segmentationCache").withIndex("by_expires", q => q.lt("expiresAt", now)).take(max));
  if (deleted < max) await remove(await ctx.db.query("generationCache").withIndex("by_expires", q => q.lt("expiresAt", now)).take(max - deleted));
  if (deleted < max) await remove(await ctx.db.query("segmentationCache").withIndex("by_owner_hash_mode", q => q.eq("ownerId", undefined)).take(max - deleted));
  if (deleted < max) await remove(await ctx.db.query("generationCache").withIndex("by_owner_hash", q => q.eq("ownerId", undefined)).take(max - deleted));
  return { deleted };
}
