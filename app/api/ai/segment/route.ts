import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";
import { AI_COSTS } from "../../../../lib/ai-costs";
import { getCachedSegmentation, hashImage, saveCachedSegmentation } from "../../../../lib/cache";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { enqueueAi } from "../../../../lib/durable-ai";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to edit objects." }, { status: 401 });
  const endpoint = process.env.MODAL_SAM_ENDPOINT;
  const modalKey = process.env.MODAL_PROXY_KEY;
  const modalSecret = process.env.MODAL_PROXY_SECRET;
  if (!endpoint || !modalKey || !modalSecret) {
    return NextResponse.json(
      {
        error:
          "Object detection is not configured in this deployment. In Vercel: check Shared variables MODAL_SAM_ENDPOINT, MODAL_PROXY_KEY, MODAL_PROXY_SECRET are linked to this Project and then Redeploy (Deployments → Redeploy without cache). Local: set them in .env.local and restart.",
        code: "SERVICE_NOT_CONFIGURED",
        hint: "visit /api/health to verify runtime env",
      },
      { status: 503 },
    );
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

    // Cache check before charging — repeated segmentation on same image+mode is free & instant, owner-scoped
    const modeNorm = ["Interior", "Exterior", "Garden"].includes(body.mode) ? body.mode : "Interior";
    const imageHash = hashImage(image);
    if (auto) {
      const cached = await getCachedSegmentation(imageHash, modeNorm, userId);
      if (cached) {
        return NextResponse.json({ objects: cached.objects, width: cached.width, height: cached.height, auto_detect: true, cached: true });
      }
    }

    if (auto && process.env.DURABLE_AI_ENABLED === "true") {
      const job = await enqueueAi({ ownerId: userId, type: "segment", requestId: body.requestId, inputHash: imageHash, image, mode: modeNorm, projectId: body.projectId as string | undefined, roomId: body.roomId as string | undefined });
      return NextResponse.json(job, { status: 202 });
    }
    const reserved = await consumeCredits(userId, AI_COSTS.detection, "Object detection with SAM 3", `detect:${body.requestId}`);
    if (reserved.duplicate) return NextResponse.json({ error: "This detection was already submitted. Wait for its result." }, { status: 409 });
    usage = reserved;

    // Modal cold start: first inference spins up GPU (up to 90s). Retry once on 502/503/504/timeout without extra charge
    let response: Response | null = null;
    let result: any = null;
    let lastStatus = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Modal-Key": modalKey,
            "Modal-Secret": modalSecret,
          },
          body: JSON.stringify({
            image,
            auto_detect: auto,
            mode: modeNorm,
            prompt: object.slice(0, 160),
            max_masks: 8,
            threshold: 0.5,
          }),
          signal: AbortSignal.timeout(280_000),
        });
        const j = await r.json().catch(() => null);
        response = r;
        result = j;
        lastStatus = r.status;
        if (r.ok) break;
        // retry only on transient cold-start / gateway errors
        if (![502, 503, 504].includes(r.status) || attempt === 1) break;
        await new Promise((res) => setTimeout(res, 4000 + attempt * 3000));
      } catch (e) {
        lastStatus = 0;
        result = { detail: e instanceof Error ? e.message : String(e) };
        if (attempt === 1) throw e;
        await new Promise((res) => setTimeout(res, 4000 + attempt * 3000));
      }
    }
    if (!response || !response.ok) {
      await refundCredits(userId, usage, "Object detection failed");
      usage = null;
      const msg =
        lastStatus === 503 || lastStatus === 504
          ? "SAM is starting (cold GPU). Please wait 30–60s and try again – no extra credit charged."
          : "Detection could not complete. Please try again in a moment.";
      return NextResponse.json({ error: msg, detail: (result as { detail?: string })?.detail }, { status: lastStatus || 502 });
    }
    if (auto && (!Array.isArray(result?.objects) || result?.auto_detect !== true)) {
      throw new Error("The detection service needs an update. Please contact support.");
    }
    const empty = auto ? result.objects.length === 0 : !result?.masks?.length;
    if (empty) {
      await refundCredits(userId, usage, "No objects detected");
      usage = null;
    } else if (auto) {
      // Save to cache for 30d — next identical image is instant & free, owner-scoped
      await saveCachedSegmentation(imageHash, modeNorm, result.objects, result.width, result.height, userId);
    }
    if (auto) return NextResponse.json({ objects: result.objects, refunded: empty, cached: false });
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
