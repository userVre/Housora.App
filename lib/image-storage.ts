import sharp from "sharp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

export async function storeProjectImage(ownerId: string, source: Buffer) {
  const serverKey = process.env.WHOP_WEBHOOK_SECRET;
  const endpoint = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!serverKey || !endpoint) throw new Error("Image storage is not configured.");
  if (source.length > 20_000_000) throw new Error("Image is too large.");
  const bytes = await sharp(source, { limitInputPixels: 25_000_000 }).rotate().resize(2048, 2048, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
  if (bytes.length > 10_000_000) throw new Error("Image is too large to save.");
  const client = new ConvexHttpClient(endpoint);
  const url = await client.mutation(api.models.uploadUrlServer, { serverKey });
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "image/png" }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error("Image storage upload failed.");
  const { storageId } = await response.json();
  const saved = await client.mutation(api.models.saveImageServer, { serverKey, ownerId, storageId });
  if (!saved) throw new Error("Image storage returned no image.");
  return saved;
}
