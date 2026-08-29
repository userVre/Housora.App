import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to edit objects." }, { status: 401 });
  const key = process.env.FAL_KEY;
  if (!key) return NextResponse.json({ error: "FAL_KEY is not configured." }, { status: 503 });

  let usage: Awaited<ReturnType<typeof consumeCredits>> | null = null;
  try {
    const body = (await request.json()) as { image?: string; object?: string };
    const image = body.image?.trim();
    const object = body.object?.trim();
    if (!image || !object) {
      return NextResponse.json({ error: "An image and object name are required." }, { status: 400 });
    }
    if (image.length > 14_000_000) {
      return NextResponse.json({ error: "The image is too large. Use an image under 10 MB." }, { status: 413 });
    }

    usage = await consumeCredits(userId, 1, "Object detection with SAM 3.1");

    const response = await fetch("https://fal.run/fal-ai/sam-3-1/image", {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: image,
        prompt: object.slice(0, 200),
        apply_mask: true,
        return_multiple_masks: true,
        max_masks: 3,
        include_scores: true,
        include_boxes: true,
        output_format: "png",
      }),
      signal: AbortSignal.timeout(110_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      await refundCredits(userId, usage, "Object detection failed");
      usage = null;
      return NextResponse.json(
        { error: result?.detail || result?.message || "Segmentation failed." },
        { status: response.status },
      );
    }
    return NextResponse.json({
      mask: result?.image?.url || result?.masks?.[0]?.url || null,
      masks: result?.masks || [],
      scores: result?.scores || [],
      boxes: result?.boxes || [],
    });
  } catch (error) {
    if (usage) await refundCredits(userId, usage, "Object detection failed").catch(() => undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Segmentation failed." },
      { status: 500 },
    );
  }
}
