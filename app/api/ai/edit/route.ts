import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";
import { AI_COSTS } from "../../../../lib/ai-costs";
import { getCachedGeneration, hashGeneration, saveCachedGeneration } from "../../../../lib/cache";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGE_LENGTH = 14_000_000;

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object") return "The image could not be edited.";
  const body = value as { detail?: string; message?: string; error?: string };
  return body.detail || body.message || body.error || "The image could not be edited.";
}

async function generateWithOpenRouter(image: string, prompt: string, key: string, aspectRatio: string) {
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://housora.vercel.app",
      "X-Title": "Housora",
    },
    body: JSON.stringify({
      model: "microsoft/mai-image-2.5-pro",
      prompt: prompt.slice(0, 4000),
      n: 1,
      aspect_ratio: aspectRatio,
      input_references: [
        {
          type: "image_url",
          image_url: { url: image },
        },
      ],
    }),
    signal: AbortSignal.timeout(285_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(result) || `OpenRouter error ${response.status}`);
  const generated = result?.data?.[0];
  const url =
    generated?.url ||
    (generated?.b64_json ? `data:${generated.media_type || "image/png"};base64,${generated.b64_json}` : null);
  if (!url) throw new Error("Model returned no image.");
  return { url, usage: result?.usage || null };
}

async function generateWithGrok(image: string, prompt: string, key: string) {
  // xAI Grok image generation - OpenAI compatible
  // For image-to-image, we include the reference image description in prompt when native image input not supported
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-image-1212",
      prompt: prompt.slice(0, 4000),
      n: 1,
      response_format: "url",
      // Attempt to pass reference image if provider supports it (ignored if unsupported)
      ...(image.startsWith("data:image/") ? { image } : {}),
    }),
    signal: AbortSignal.timeout(285_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(result) || `Grok error ${response.status}`);
  const generated = result?.data?.[0];
  const url =
    generated?.url ||
    (generated?.b64_json ? `data:${generated.media_type || "image/png"};base64,${generated.b64_json}` : null) ||
    result?.url;
  if (!url) throw new Error("Grok returned no image.");
  return { url, usage: result?.usage || null };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to generate designs." }, { status: 401 });

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const grokKey = process.env.GROK_IMAGE_KEY || process.env.XAI_API_KEY || process.env.GROK_API_KEY;

  if (!openRouterKey && !grokKey) {
    return NextResponse.json(
      { error: "Image generation is not configured. Add OPENROUTER_API_KEY or GROK_IMAGE_KEY to your environment." },
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
    };
    const image = body.image?.trim();
    const prompt = body.prompt?.trim();
    if (!image || !prompt) {
      return NextResponse.json({ error: "An image and edit instruction are required." }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json({ error: "The image is too large. Use an image under 10 MB." }, { status: 413 });
    }
    if (!image.startsWith("data:image/") && !/^https:\/\//i.test(image)) {
      return NextResponse.json({ error: "The image source is not supported." }, { status: 400 });
    }

    // Generation cache: same image+prompt reuse within 14d is instant & free
    const genHash = hashGeneration(image, prompt);
    const cachedGen = await getCachedGeneration(genHash);
    if (cachedGen) {
      return NextResponse.json({ image: cachedGen.resultImage, description: "", usage: null, cached: true });
    }

    usage = await consumeCredits(userId, AI_COSTS.imageEdit, "AI image generation or edit");

    const aspectRatio = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "auto"].includes(body.aspectRatio || "")
      ? body.aspectRatio!
      : "auto";

    let result: { url: string; usage: unknown } | null = null;
    let lastError: string | null = null;

    // Prefer OpenRouter when available (supports true image-to-image with Mai), otherwise use Grok
    if (openRouterKey) {
      try {
        result = await generateWithOpenRouter(image, prompt, openRouterKey, aspectRatio);
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        // If OpenRouter fails and Grok is available, fallback to Grok
        if (grokKey) {
          try {
            result = await generateWithGrok(image, prompt, grokKey);
            lastError = null;
          } catch (grokErr) {
            lastError = `${lastError} | Grok fallback: ${grokErr instanceof Error ? grokErr.message : String(grokErr)}`;
          }
        }
      }
    } else if (grokKey) {
      try {
        result = await generateWithGrok(image, prompt, grokKey);
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!result) {
      await refundCredits(userId, usage, "Image generation failed");
      usage = null;
      return NextResponse.json({ error: lastError || "Generation failed." }, { status: 502 });
    }

    // Save to generation cache (fire-and-forget)
    void saveCachedGeneration(genHash, result.url, prompt);

    return NextResponse.json({ image: result.url, description: "", usage: result.usage });
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
