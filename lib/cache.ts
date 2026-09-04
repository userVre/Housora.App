import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

function convex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error("Convex URL missing");
  return new ConvexHttpClient(url);
}
function serverKey() {
  const v = process.env.WHOP_WEBHOOK_SECRET;
  if (!v) throw new Error("WHOP_WEBHOOK_SECRET missing");
  return v;
}

export function hashImage(imageDataUrl: string): string {
  // hash the base64 payload only, stable across dataUrl prefixes
  const comma = imageDataUrl.indexOf(",");
  const payload = comma >= 0 ? imageDataUrl.slice(comma + 1) : imageDataUrl;
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}
export function hashGeneration(imageDataUrl: string, prompt: string, modelVersion?: string, aspectRatio?: string): string {
  const imgHash = hashImage(imageDataUrl);
  const promptHash = createHash("sha256").update(prompt.trim()).digest("hex").slice(0, 16);
  const extra = createHash("sha256")
    .update(`${modelVersion || "default"}|${aspectRatio || "auto"}`)
    .digest("hex")
    .slice(0, 8);
  return `${imgHash}:${promptHash}:${extra}`;
}

export async function getCachedSegmentation(imageHash: string, mode: string, ownerId?: string) {
  // Server-side: use serverKey + ownerId; client-side: fallback to authenticated query (no owner needed)
  if (ownerId) {
    try {
      const cached = await convex().query((api as any).jobs.getCachedSegmentationServer, { serverKey: serverKey(), ownerId, imageHash, mode });
      if (cached?.objects?.payloadUrl) {
        const response = await fetch(cached.objects.payloadUrl, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) return null;
        return { ...cached, objects: await response.json() };
      }
      return cached;
    } catch {
      return null;
    }
  }
  try {
    return await convex().query(api.jobs.getCachedSegmentation, { imageHash, mode });
  } catch {
    return null;
  }
}
export async function saveCachedSegmentation(imageHash: string, mode: string, objects: unknown, width?: number, height?: number, ownerId?: string) {
  if (!ownerId) {
    console.warn("saveCachedSegmentation skipped: missing ownerId");
    return;
  }
  try {
    const payload = JSON.stringify(objects);
    if (payload.length > 400_000) {
      const client = convex();
      const uploadUrl = await client.mutation(api.models.uploadUrlServer, { serverKey: serverKey() });
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error("Cache upload failed");
      const { storageId } = await response.json();
      const payloadUrl = await client.mutation(api.models.cachePayloadUrlServer, { serverKey: serverKey(), storageId });
      objects = { payloadUrl, storageId };
    }
    await convex().mutation(api.jobs.saveSegmentationCacheServer, { serverKey: serverKey(), ownerId, imageHash, mode, objects, width, height });
  } catch (e) {
    console.warn("saveCachedSegmentation failed", e);
  }
}
export async function getCachedGeneration(inputHash: string, ownerId?: string) {
  if (ownerId) {
    try {
      return await convex().query((api as any).jobs.getCachedGenerationServer, { serverKey: serverKey(), ownerId, inputHash });
    } catch {
      return null;
    }
  }
  try {
    return await convex().query(api.jobs.getCachedGeneration, { inputHash });
  } catch {
    return null;
  }
}
export async function saveCachedGeneration(inputHash: string, resultImage: string, prompt: string, ownerId?: string, modelVersion?: string, aspectRatio?: string) {
  if (!ownerId) {
    console.warn("saveCachedGeneration skipped: missing ownerId");
    return;
  }
  try {
    await convex().mutation(api.jobs.saveGenerationCacheServer, { serverKey: serverKey(), ownerId, inputHash, resultImage, prompt, modelVersion, aspectRatio });
  } catch (e) {
    console.warn("saveCachedGeneration failed", e);
  }
}

// client-side hash for queue dedup (Web Crypto)
export async function clientImageHash(dataUrl: string): Promise<string> {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
