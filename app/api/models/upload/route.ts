import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { MODEL_MAX_BYTES, isGlbBuffer, isGltfText, modelExtension, validateModelFileMeta } from "../../../../lib/model-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

function serverKey() {
  const value = process.env.HOUSORA_SERVER_KEY || process.env.WHOP_WEBHOOK_SECRET;
  if (!value) throw new Error("Internal server authentication is not configured.");
  return value;
}

function convex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error("Convex is not configured.");
  return new ConvexHttpClient(url);
}

// Free path: bring your own 3D file straight to AR — no generation, no credits.
// The file is persisted to project storage so it survives reloads and can be
// shared with the same secure model-share links as generated models.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send the 3D file as form data." }, { status: 400 });
  }
  const file = form.get("model");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a .glb or .gltf file first." }, { status: 400 });
  }
  const meta = validateModelFileMeta(file.name, file.size);
  if (!meta.valid) return NextResponse.json({ error: meta.reason }, { status: 400 });
  const ext = modelExtension(file.name);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length !== file.size) {
      return NextResponse.json({ error: "That upload was interrupted. Try again." }, { status: 400 });
    }
    if (ext === "glb") {
      if (!isGlbBuffer(bytes)) return NextResponse.json({ error: "That is not a valid .glb file." }, { status: 400 });
    } else {
      const text = new TextDecoder().decode(bytes.slice(0, 2_000_000));
      if (!isGltfText(text)) return NextResponse.json({ error: "That is not a valid .gltf file." }, { status: 400 });
      if (bytes.length > MODEL_MAX_BYTES) {
        return NextResponse.json({ error: "That file is over 50 MB. Use a smaller optimized model." }, { status: 400 });
      }
    }
    const client = convex();
    const key = serverKey();
    const taskId = `upload-${crypto.randomUUID()}`;
    const uploadUrl = await client.mutation(api.models.uploadUrlServer, { serverKey: key });
    const contentType = ext === "glb" ? "model/gltf-binary" : "model/gltf+json";
    const uploaded = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: new Blob([bytes], { type: contentType }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!uploaded.ok) throw new Error("Model upload failed.");
    const { storageId } = await uploaded.json();
    const url = await client.mutation(api.models.saveServer, { serverKey: key, ownerId: userId, taskId, storageId });
    return NextResponse.json({ taskId, url, creditsCharged: 0 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save that 3D file." },
      { status: 500 },
    );
  }
}
