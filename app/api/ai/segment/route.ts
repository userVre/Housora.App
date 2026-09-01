import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to edit objects." }, { status: 401 });
  const endpoint = process.env.MODAL_SAM_ENDPOINT;
  const modalKey = process.env.MODAL_PROXY_KEY;
  const modalSecret = process.env.MODAL_PROXY_SECRET;
  if (!endpoint || !modalKey || !modalSecret) {
    return NextResponse.json({ error: "The segmentation service is not configured." }, { status: 503 });
  }

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

    usage = await consumeCredits(userId, 1, "Object detection with SAM 3");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Modal-Key": modalKey,
        "Modal-Secret": modalSecret,
      },
      body: JSON.stringify({
        image,
        prompt: object.slice(0, 200),
        max_masks: 8,
        threshold: 0.45,
      }),
      signal: AbortSignal.timeout(115_000),
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
      mask: result?.mask || result?.masks?.[0]?.url || null,
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
