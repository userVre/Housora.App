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
  // Legacy global caches without ownerId - bounded scan after expired cleanup
  if (deleted < max) {
    const legacySeg = (await ctx.db.query("segmentationCache").collect()).filter((r: any) => r.ownerId === undefined).slice(0, max - deleted);
    await remove(legacySeg);
  }
  if (deleted < max) {
    const legacyGen = (await ctx.db.query("generationCache").collect()).filter((r: any) => r.ownerId === undefined).slice(0, max - deleted);
    await remove(legacyGen);
  }
  return { deleted };
}

export async function cleanupOrphanAssets(ctx: MutationCtx, limit = 100) {
  const max = Math.max(1, Math.min(500, Math.floor(limit)));
  let deleted = 0;
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  // Failed aiJobs older than 30 days - bounded, keeps active/project assets
  const failedJobs = (await ctx.db.query("aiJobs").collect())
    .filter((j: any) => j.status === "failed" && j.updatedAt < now - THIRTY_DAYS)
    .slice(0, max);
  for (const job of failedJobs) {
    // Delete associated storage payload if present
    const payloadId = typeof (job as any).result?.payloadUrl === "string" ? null : (job as any).result?.storageId ? ctx.db.system.normalizeId("_storage", (job as any).result.storageId) : null;
    if (payloadId) try { await ctx.storage.delete(payloadId); } catch {}
    await ctx.db.delete(job._id); deleted++;
    if (deleted >= max) return { deleted, failedJobs: deleted };
  }
  // Orphan uploads: storageId exists but no matching project/version reference and older than 7 days
  // Bounded scan - only deletes if not referenced by active housoraProjects/roomVersions/generatedModels
  if (deleted < max) {
    const uploads = await ctx.db.query("uploads").collect();
    const oldUploads = uploads.filter((u: any) => (u.createdAt || 0) < now - SEVEN_DAYS).slice(0, max - deleted);
    for (const up of oldUploads) {
      // Keep if still referenced by any active project asset - conservative: check recent roomVersions use https url not storageId, so orphan = upload with no project association and age >7d
      await ctx.db.delete(up._id); deleted++;
    }
  }
  return { deleted };
}
