import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Only call with a model URL returned by the authenticated Tripo task API.
export async function persistModel(ownerId: string, taskId: string, providerUrl: string) {
  const serverKey = process.env.WHOP_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!serverKey || !url) throw new Error("Model storage is not configured");
  const client = new ConvexHttpClient(url);
  const existing = await client.query(api.models.getServer, { serverKey, ownerId, taskId });
  if (existing) return existing;
  const source = new URL(providerUrl);
  if (source.protocol !== "https:" || source.username || source.password) throw new Error("Invalid model URL");
  const response = await fetch(source, { signal: AbortSignal.timeout(60_000), redirect: "error" });
  if (!response.ok || !response.body) throw new Error("Model download failed");
  const limit = 64 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > limit) throw new Error("Model exceeds storage limit");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = response.body.getReader();
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new Error("Model exceeds storage limit"); }
    chunks.push(new Uint8Array(value));
  }
  const blob = new Blob(chunks, { type: "model/gltf-binary" });
  const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (String.fromCharCode(...signature) !== "glTF") throw new Error("The provider did not return a GLB model");
  const uploadUrl = await client.mutation(api.models.uploadUrlServer, { serverKey });
  const uploaded = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": blob.type }, body: blob, signal: AbortSignal.timeout(60_000) });
  if (!uploaded.ok) throw new Error("Model upload failed");
  const { storageId } = await uploaded.json();
  return client.mutation(api.models.saveServer, { serverKey, ownerId, taskId, storageId });
}
