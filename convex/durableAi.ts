"use node";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { compositeObjectEdit } from "../lib/composite-object-edit";

const identity = { requestId: v.string(), ownerId: v.string(), usageEventId: v.string() };
function serverKey() {
  const value = process.env.HOUSORA_SERVER_KEY || process.env.WHOP_WEBHOOK_SECRET;
  if (!value) throw new Error("Internal server authentication is not configured.");
  return value;
}
async function bytes(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: "error" });
  if (!response.ok) throw new Error("Image download failed.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 25_000_000) throw new Error("Image is too large.");
  return buffer;
}
export const execute = internalAction({
  args: { ...identity, inputHash: v.string(), type: v.union(v.literal("segment"), v.literal("edit")), image: v.string(), mask: v.optional(v.string()), prompt: v.optional(v.string()), mode: v.optional(v.string()), aspectRatio: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!await ctx.runMutation(internal.jobs.claimInternal, { requestId: args.requestId })) return;
    try {
      let result: Record<string, unknown>;
      if (args.type === "segment") {
        const endpoint = process.env.MODAL_SAM_ENDPOINT, key = process.env.MODAL_PROXY_KEY, secret = process.env.MODAL_PROXY_SECRET;
        if (!endpoint || !key || !secret) throw new Error("Detection is not configured in the background worker.");
        const image = `data:image/png;base64,${(await bytes(args.image)).toString("base64")}`;
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Modal-Key": key, "Modal-Secret": secret }, body: JSON.stringify({ image, auto_detect: true, mode: args.mode || "Interior", prompt: "", max_masks: 8, threshold: 0.5 }), signal: AbortSignal.timeout(280_000) });
        const data = await response.json();
        if (!response.ok || data.auto_detect !== true || !Array.isArray(data.objects)) throw new Error("Detection failed. Please try again.");
        result = { objects: data.objects, refunded: data.objects.length === 0 };
        if (!data.objects.length) await ctx.runMutation(api.credits.refundUsageEventServer, { serverKey: serverKey(), ownerId: args.ownerId, usageEventId: args.usageEventId, description: "No objects detected" });
      } else {
        const key = process.env.GROK_IMAGE_KEY || process.env.XAI_API_KEY;
        if (!key) throw new Error("Image editing is not configured in the background worker.");
        const response = await fetch("https://api.x.ai/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "grok-imagine-image-2.0", prompt: (args.prompt || "").slice(0,4000), image: { url: args.image, type: "image_url" }, ...(args.aspectRatio && args.aspectRatio !== "auto" ? { aspect_ratio: args.aspectRatio } : {}) }), signal: AbortSignal.timeout(280_000) });
        const data = await response.json();
        const url = data.data?.[0]?.url;
        if (!response.ok || !url) throw new Error("Image editing failed. Please try again.");
        let edited = await bytes(url);
        if (args.mask) edited = await compositeObjectEdit(await bytes(args.image), edited, await bytes(args.mask));
        const storageId = await ctx.storage.store(new Blob([new Uint8Array(edited)], { type: "image/png" }));
        result = { image: await ctx.storage.getUrl(storageId), cached: false };
      }
      // Masks can exceed the document limit; put the payload in file storage.
      const storageId = await ctx.storage.store(new Blob([JSON.stringify(result)], { type: "application/json" }));
      await ctx.runMutation(internal.jobs.completeInternal, { requestId: args.requestId, result: { payloadUrl: await ctx.storage.getUrl(storageId) } });
      try {
        if (args.type === "segment" && Array.isArray(result.objects) && result.objects.length) {
          const cacheId = await ctx.storage.store(new Blob([JSON.stringify(result.objects)], { type: "application/json" }));
          await ctx.runMutation(api.jobs.saveSegmentationCacheServer, { serverKey: serverKey(), ownerId: args.ownerId, imageHash: args.inputHash, mode: args.mode || "Interior", objects: { payloadUrl: await ctx.storage.getUrl(cacheId), storageId: cacheId } });
        } else if (args.type === "edit" && typeof result.image === "string") {
          await ctx.runMutation(api.jobs.saveGenerationCacheServer, { serverKey: serverKey(), ownerId: args.ownerId, inputHash: args.inputHash, resultImage: result.image, prompt: args.prompt || "", modelVersion: "grok-imagine-image-2.0", aspectRatio: args.aspectRatio });
        }
      } catch { /* Successful work remains available even if its optional cache fails. */ }
    } catch {
      await ctx.runMutation(internal.jobs.failInternal, { requestId: args.requestId, error: "The task could not complete. Its credits are being returned; no automatic paid retry was submitted." });
      await ctx.runMutation(api.credits.refundUsageEventServer, { serverKey: serverKey(), ownerId: args.ownerId, usageEventId: args.usageEventId, description: "Background task failed" });
    }
  },
});

// Covers a crashed worker; never dispatches a second provider request.
export const expire = internalAction({
  args: identity,
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(api.jobs.getServer, { serverKey: serverKey(), ownerId: args.ownerId, requestId: args.requestId });
    if (!job || job.status === "success") return;
    if (job.status !== "failed") {
      await ctx.runMutation(internal.jobs.failInternal, { requestId: args.requestId, error: "This task timed out. No automatic paid retry was submitted." });
    }
    const updated = await ctx.runQuery(api.jobs.getServer, { serverKey: serverKey(), ownerId: args.ownerId, requestId: args.requestId });
    if (updated?.status === "failed") await ctx.runMutation(api.credits.refundUsageEventServer, { serverKey: serverKey(), ownerId: args.ownerId, usageEventId: args.usageEventId, description: "Background task failed or timed out" });
  },
});
