import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const processSegment = internalAction({
  args: { requestId: v.string(), ownerId: v.string(), image: v.string(), mode: v.string(), prompt: v.optional(v.string()) },
  handler: async (ctx, { requestId, ownerId, image, mode, prompt }) => {
    await ctx.runMutation(internal.jobs.updateProgressInternal, { requestId, progress: 10, status: "running" });
    try {
      const endpoint = process.env.MODAL_SAM_ENDPOINT;
      const key = process.env.MODAL_PROXY_KEY;
      const secret = process.env.MODAL_PROXY_SECRET;
      if (!endpoint || !key || !secret) throw new Error("Segmentation not configured");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Modal-Key": key, "Modal-Secret": secret },
        body: JSON.stringify({ image, auto_detect: !prompt, mode, prompt: prompt || "", max_masks: 8, threshold: 0.5 }),
      });
      const data: any = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `SAM error ${res.status}`);
      await ctx.runMutation(internal.jobs.completeInternal, { requestId, result: data });
    } catch (e: any) {
      await ctx.runMutation(internal.jobs.failInternal, { requestId, error: e.message || String(e) });
    }
  },
});

export const processEdit = internalAction({
  args: { requestId: v.string(), ownerId: v.string(), image: v.string(), prompt: v.string(), aspectRatio: v.optional(v.string()) },
  handler: async (ctx, { requestId, ownerId, image, prompt, aspectRatio }) => {
    await ctx.runMutation(internal.jobs.updateProgressInternal, { requestId, progress: 20, status: "running" });
    try {
      const key = process.env.GROK_IMAGE_KEY || process.env.XAI_API_KEY;
      if (!key) throw new Error("Grok not configured");
      const isEdit = Boolean(image);
      const endpoint = isEdit ? "https://api.x.ai/v1/images/edits" : "https://api.x.ai/v1/images/generations";
      const body: any = { model: "grok-imagine-image-2.0", prompt: prompt.slice(0, 4000) };
      if (isEdit) body.image = { url: image, type: "image_url" };
      if (aspectRatio && aspectRatio !== "auto") body.aspect_ratio = aspectRatio;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: any = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Grok error ${res.status}`);
      const url = data?.data?.[0]?.url || data?.url;
      if (!url) throw new Error("No image returned");
      await ctx.runMutation(internal.jobs.completeInternal, { requestId, result: { image: url } });
    } catch (e: any) {
      await ctx.runMutation(internal.jobs.failInternal, { requestId, error: e.message || String(e) });
    }
  },
});
