import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";
import { AI_COSTS } from "../../../../lib/ai-costs";
import { getCachedGeneration, hashGeneration, saveCachedGeneration } from "../../../../lib/cache";
import { compositeObjectEdit } from "../../../../lib/composite-object-edit";
import { storeProjectImage } from "../../../../lib/image-storage";
import { enqueueAi } from "../../../../lib/durable-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGE_LENGTH = 14_000_000;

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object") return "The image could not be edited.";
  const body = value as { detail?: string; message?: string; error?: string };
  return body.detail || body.message || body.error || "The image could not be edited.";
}

async function generateWithGrokImagine(image: string, prompt: string, key: string, aspectRatio: string) {
  // Accurate per https://docs.x.ai/developers/model-capabilities/images/editing
  // grok-imagine-image-2.0 supports real image editing with image.url (data URI or public URL)
  // grok-2-image-1212 does NOT support reference-image editing — must not be used for edits
  const isEdit = Boolean(image);
  const endpoint = isEdit ? "https://api.x.ai/v1/images/edits" : "https://api.x.ai/v1/images/generations";
  const body: Record<string, unknown> = {
    model: "grok-imagine-image-2.0",
    prompt: prompt.slice(0, 4000),
  };
  if (isEdit) {
    (body as any).image = { url: image, type: "image_url" };
  }
  // aspect_ratio supported on both endpoints per docs
  if (aspectRatio && aspectRatio !== "auto") (body as any).aspect_ratio = aspectRatio;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(285_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(result) || `Grok Imagine error ${response.status}`);
  // edits endpoint returns { data: [{ url }]} or { url } depending on SDK; handle both
  const data = (result as any)?.data?.[0] || (result as any)?.data || result;
  const url = data?.url || data?.image_url || (data?.b64_json ? `data:${data.media_type || "image/png"};base64,${data.b64_json}` : null) || (result as any)?.url;
  if (!url) throw new Error("Grok Imagine returned no image — model may not support this edit type.");
  return { url, usage: (result as any)?.usage || null };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to generate designs." }, { status: 401 });

  const grokKey = process.env.GROK_IMAGE_KEY || process.env.XAI_API_KEY;
  if (!grokKey) {
    return NextResponse.json(
      { error: "Grok image editing is not configured. Set GROK_IMAGE_KEY (xAI) in Vercel env. OpenRouter is no longer used for image workflow." },
      { status: 503 },
    );
  }

  let usage: Awaited<ReturnType<typeof consumeCredits>> | null = null;
  try {
    const body = (await request.json()) as {
      image?: string;
      prompt?: string;
      aspectRatio?: string;
      mode?: string;
      space?: string | null;
      style?: string | null;
      details?: Record<string, string>;
      requestId?: string;
      confirmed?: boolean;
      mask?: string;
    };
    const image = body.image?.trim();
    const prompt = body.prompt?.trim();
    const mask = body.mask;
    if (mask !== undefined && (typeof mask !== "string" || !/^data:image\/png;base64,/.test(mask) || mask.length > 4_000_000 || !image?.startsWith("data:image/"))) {
      return NextResponse.json({ error: "Use a valid detection mask with the source photo." }, { status: 400 });
    }
    if (!image || !prompt) {
      return NextResponse.json({ error: "An image and edit instruction are required." }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json({ error: "The image is too large. Use an image under 10 MB." }, { status: 413 });
    }
    if (!image.startsWith("data:image/") && !/^https:\/\//i.test(image)) {
      return NextResponse.json({ error: "The image source is not supported." }, { status: 400 });
    }

    // Generation cache: same image+prompt+model+aspect reuse within 14d is instant & free, owner-scoped
    const aspectRatio = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "auto"].includes(body.aspectRatio || "") ? body.aspectRatio! : "auto";
    const modelVersion = "grok-imagine-image-2.0";
    const genHash = hashGeneration(image, prompt, `${modelVersion}:${mask || "full-image"}`, aspectRatio);
    const cachedGen = await getCachedGeneration(genHash, userId);
    if (cachedGen) {
      return NextResponse.json({ image: cachedGen.resultImage, description: "", usage: null, cached: true, cacheNote: "Cached result — no credits charged. Same image, prompt, model and aspect ratio as before." });
    }

    if (!body.confirmed || typeof body.requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.requestId)) {
      return NextResponse.json({ error: "Confirm the credit cost and request ID before generating." }, { status: 400 });
    }

    if (process.env.DURABLE_AI_ENABLED === "true") {
      const job = await enqueueAi({ ownerId: userId, type: "edit", requestId: body.requestId, inputHash: genHash, image, mask, prompt, aspectRatio });
      return NextResponse.json(job, { status: 202 });
    }
    usage = await consumeCredits(userId, AI_COSTS.imageEdit, "AI image generation or edit", `edit:${body.requestId}`);
    if ((usage as any).duplicate) return NextResponse.json({ error: "This generation was already submitted. Wait for its result." }, { status: 409 });

    let result: { url: string; usage: unknown } | null = null;
    try {
      result = await generateWithGrokImagine(image, prompt, grokKey, aspectRatio);
      if (mask) {
        let edited: Buffer;
        if (result.url.startsWith("data:image/")) edited = Buffer.from(result.url.split(",")[1], "base64");
        else {
          const asset = await fetch(result.url, { signal: AbortSignal.timeout(30_000), redirect: "error" });
          if (!asset.ok) throw new Error("Could not retrieve the edited image.");
          edited = Buffer.from(await asset.arrayBuffer());
        }
        const composite = await compositeObjectEdit(Buffer.from(image.split(",")[1], "base64"), edited, Buffer.from(mask.split(",")[1], "base64"));
        result.url = `data:image/png;base64,${composite.toString("base64")}`;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await refundCredits(userId, usage, "Image generation failed");
      usage = null;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Provider image URLs expire. Only cache a permanently stored image.
    let storageWarning: string | null = null;
    try {
      let bytes: Buffer;
      if (result.url.startsWith("data:image/")) bytes = Buffer.from(result.url.split(",")[1], "base64");
      else {
        const asset = await fetch(result.url, { signal: AbortSignal.timeout(30_000), redirect: "error" });
        if (!asset.ok) throw new Error("Image download failed");
        bytes = Buffer.from(await asset.arrayBuffer());
      }
      result.url = await storeProjectImage(userId, bytes);
    } catch { storageWarning = "Your edit is ready, but storage is unavailable. Download it now before leaving this page."; }
    try {
      if (!storageWarning) await saveCachedGeneration(genHash, result.url, prompt, userId, modelVersion, aspectRatio);
    } catch (e) {
      console.warn("saveCachedGeneration failed", e);
      // don't fail the request, but surface in logs
    }

    return NextResponse.json({ image: result.url, description: "", usage: result.usage, storageWarning });
  } catch (error) {
    if (usage) await refundCredits(userId, usage, "Image generation failed").catch(() => undefined);
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Image editing timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "The image could not be edited.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
