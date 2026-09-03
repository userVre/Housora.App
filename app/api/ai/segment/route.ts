import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";
import { AI_COSTS } from "../../../../lib/ai-costs";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    const body = await request.json();
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const object = typeof body.object === "string" ? body.object.trim() : "";
    const auto = body.autoDetect === true;
    if (body.confirmed !== true || !/^[a-f0-9-]{36}$/i.test(body.requestId || "")) {
      return NextResponse.json({ error: "Confirm the credit cost before detecting objects." }, { status: 400 });
    }
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(image) || (!auto && !object)) {
      return NextResponse.json({ error: "An image and object name are required." }, { status: 400 });
    }
    if (image.length > 4_000_000) {
      return NextResponse.json({ error: "The prepared image is too large. Try a smaller photo." }, { status: 413 });
    }

    const reserved = await consumeCredits(userId, AI_COSTS.detection, "Object detection with SAM 3", `detect:${body.requestId}`);
    if (reserved.duplicate) return NextResponse.json({ error: "This detection was already submitted. Wait for its result." }, { status: 409 });
    usage = reserved;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Modal-Key": modalKey,
        "Modal-Secret": modalSecret,
      },
      body: JSON.stringify({
        image,
        auto_detect: auto,
        mode: ["Interior", "Exterior", "Garden"].includes(body.mode) ? body.mode : "Interior",
        prompt: object.slice(0, 160),
        max_masks: 8,
        threshold: 0.5,
      }),
      signal: AbortSignal.timeout(280_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      await refundCredits(userId, usage, "Object detection failed");
      usage = null;
      return NextResponse.json(
        { error: "Detection could not complete. Please try again in a moment." },
        { status: response.status },
      );
    }
    if (auto && (!Array.isArray(result?.objects) || result?.auto_detect !== true)) {
      throw new Error("The detection service needs an update. Please contact support.");
    }
    const empty = auto ? result.objects.length === 0 : !result?.masks?.length;
    if (empty) {
      await refundCredits(userId, usage, "No objects detected");
      usage = null;
    }
    if (auto) return NextResponse.json({ objects: result.objects, refunded: empty });
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
