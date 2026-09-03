import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits, refundCredits } from "../../../../lib/credits";
import { createTripoTrackingToken } from "../../../../lib/tripo-tracking";
import { AI_COSTS } from "../../../../lib/ai-costs";

export const runtime = "nodejs";
export const maxDuration = 60;

const TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi";
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to generate 3D models." }, { status: 401 });
  const key = process.env.TRIPO_API_KEY;
  if (!key) return NextResponse.json({ error: "TRIPO_API_KEY is not configured." }, { status: 503 });

  let usage: Awaited<ReturnType<typeof consumeCredits>> | null = null;
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Send the furniture image as form data." }, { status: 400 });
    }
    const file = form.get("image");
    const requestId = form.get("requestId");
    if (form.get("confirmed") !== "true" || typeof requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(requestId)) {
      return NextResponse.json({ error: "Confirm the credit cost before creating a 3D model." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a furniture image first." }, { status: 400 });
    }
    if (!acceptedTypes.has(file.type) || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Use a JPG, PNG or WEBP image under 10 MB." }, { status: 400 });
    }
    const reserved = await consumeCredits(userId, AI_COSTS.model3d, "Textured 3D model and AR preview", `3d:${requestId}`);
    if (reserved.duplicate) return NextResponse.json({ error: "This model was already submitted. Check the existing task before trying again." }, { status: 409 });
    usage = reserved;

    const uploadBody = new FormData();
    uploadBody.append("file", file, file.name || "furniture.png");
    const uploadResponse = await fetch(`${TRIPO_BASE}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: uploadBody,
      signal: AbortSignal.timeout(25_000),
    });
    const upload = await uploadResponse.json().catch(() => null);
    const imageToken = upload?.data?.image_token;
    if (!uploadResponse.ok || upload?.code !== 0 || !imageToken) {
      await refundCredits(userId, usage, "3D upload failed");
      usage = null;
      return NextResponse.json(
        { error: upload?.message || "Tripo could not upload the image." },
        { status: uploadResponse.ok ? 502 : uploadResponse.status },
      );
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpeg";
    const taskResponse = await fetch(`${TRIPO_BASE}/task`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "image_to_model",
        model_version: "v3.1-20260211",
        file: { type: extension, file_token: imageToken },
        texture: true,
        pbr: true,
        face_limit: 10000,
        enable_image_autofix: true,
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const task = await taskResponse.json().catch(() => null);
    const taskId = task?.data?.task_id;
    if (!taskResponse.ok || task?.code !== 0 || !taskId) {
      await refundCredits(userId, usage, "3D generation could not start");
      usage = null;
      return NextResponse.json(
        { error: task?.message || "Tripo could not start the 3D model." },
        { status: taskResponse.ok ? 502 : taskResponse.status },
      );
    }
    return NextResponse.json({
      taskId,
      trackingToken: createTripoTrackingToken({
        taskId,
        ownerId: userId,
        usageEventId: usage.eventId,
      }),
    });
  } catch (error) {
    if (usage) await refundCredits(userId, usage, "3D generation failed").catch(() => undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start 3D generation." },
      { status: 500 },
    );
  }
}
