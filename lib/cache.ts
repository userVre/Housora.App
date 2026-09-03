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
export function hashGeneration(imageDataUrl: string, prompt: string): string {
  const imgHash = hashImage(imageDataUrl);
  const promptHash = createHash("sha256").update(prompt.trim().toLowerCase()).digest("hex").slice(0, 16);
  return `${imgHash}:${promptHash}`;
}

export async function getCachedSegmentation(imageHash: string, mode: string) {
  try {
    return await convex().query(api.jobs.getCachedSegmentation, { imageHash, mode });
  } catch {
    return null;
  }
}
export async function saveCachedSegmentation(imageHash: string, mode: string, objects: unknown, width?: number, height?: number) {
  try {
    await convex().mutation(api.jobs.saveSegmentationCacheServer, { serverKey: serverKey(), imageHash, mode, objects, width, height });
  } catch {}
}
export async function getCachedGeneration(inputHash: string) {
  try {
    return await convex().query(api.jobs.getCachedGeneration, { inputHash });
  } catch {
    return null;
  }
}
export async function saveCachedGeneration(inputHash: string, resultImage: string, prompt: string) {
  try {
    await convex().mutation(api.jobs.saveGenerationCacheServer, { serverKey: serverKey(), inputHash, resultImage, prompt });
  } catch {}
}

// client-side hash for queue dedup (Web Crypto)
export async function clientImageHash(dataUrl: string): Promise<string> {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
