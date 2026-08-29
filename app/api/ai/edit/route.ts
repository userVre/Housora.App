import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGE_LENGTH = 14_000_000;

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object") return "The image could not be edited.";
  const body = value as { detail?: string; message?: string };
  return body.detail || body.message || "The image could not be edited.";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to generate designs." }, { status: 401 });
  const key = process.env.FAL_KEY;
  if (!key) {
    return NextResponse.json({ error: "FAL_KEY is not configured." }, { status: 503 });
  }

  let usage: Awaited<ReturnType<typeof consumeCredits>> | null = null;
  try {
    const body = (await request.json()) as {
      image?: string;
      prompt?: string;
      aspectRatio?: string;
    };
    const image = body.image?.trim();
    const prompt = body.prompt?.trim();
    if (!image || !prompt) {
      return NextResponse.json(
        { error: "An image and edit instruction are required." },
        { status: 400 },
      );
    }
    if (image.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json({ error: "The image is too large. Use an image under 10 MB." }, { status: 413 });
    }
    if (!image.startsWith("data:image/") && !/^https:\/\//i.test(image)) {
      return NextResponse.json({ error: "The image source is not supported." }, { status: 400 });
    }

    usage = await consumeCredits(userId, 4, "AI image generation or edit");

    const response = await fetch("https://fal.run/microsoft/mai-image-2.5-pro/edit", {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image,
        prompt: prompt.slice(0, 4000),
        num_images: 1,
        aspect_ratio: body.aspectRatio || "auto",
        output_format: "png",
      }),
      signal: AbortSignal.timeout(285_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      await refundCredits(userId, usage, "Image generation failed");
      usage = null;
      return NextResponse.json({ error: errorMessage(result) }, { status: response.status });
    }
    const url = result?.images?.[0]?.url;
    if (!url) throw new Error("MAI returned no image.");
    return NextResponse.json({ image: url, description: result.description || "" });
  } catch (error) {
    if (usage) await refundCredits(userId, usage, "Image generation failed").catch(() => undefined);
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "Image editing timed out. Please try again."
      : error instanceof Error ? error.message : "The image could not be edited.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
