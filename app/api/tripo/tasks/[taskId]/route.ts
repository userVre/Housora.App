import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { refundUsageEvent } from "../../../../../lib/credits";
import { verifyTripoTrackingToken } from "../../../../../lib/tripo-tracking";
import { persistModel } from "../../../../../lib/model-storage";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to view this 3D task." }, { status: 401 });
  const key = process.env.TRIPO_API_KEY;
  if (!key)
    return NextResponse.json(
      {
        error: "3D status check is not configured. Add TRIPO_API_KEY in Vercel and Redeploy.",
        hint: "visit /api/health",
      },
      { status: 503 },
    );
  const { taskId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(taskId)) {
    return NextResponse.json({ error: "Invalid Tripo task." }, { status: 400 });
  }
  const trackingToken = new URL(request.url).searchParams.get("trackingToken");
  if (!trackingToken) {
    return NextResponse.json({ error: "This 3D task is missing its secure tracking token." }, { status: 400 });
  }
  let tracking: ReturnType<typeof verifyTripoTrackingToken>;
  try {
    tracking = verifyTripoTrackingToken(trackingToken, taskId, userId);
  } catch {
    return NextResponse.json({ error: "This 3D task link is invalid or has expired." }, { status: 403 });
  }
  try {
    const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.code !== 0) {
      return NextResponse.json(
        { error: result?.message || "Could not read the Tripo task." },
        { status: response.ok ? 502 : response.status },
      );
    }
    const task = result.data;
    if (["failed", "cancelled", "banned", "expired"].includes(task.status) || (task.status === "success" && !task.output?.pbr_model && !task.output?.model && !task.output?.base_model)) {
      await refundUsageEvent(userId, tracking.usageEventId, "3D generation failed");
      return NextResponse.json({ status: "failed", error: "The model could not be generated. Your Housora credits were returned." });
    }
    let modelUrl = task.output?.pbr_model || task.output?.model || task.output?.base_model || null;
    let storageWarning: string | null = null;
    if (task.status === "success" && modelUrl) {
      try { modelUrl = await persistModel(userId, taskId, modelUrl); }
      catch { storageWarning = "The model is ready but could not be saved. Download it now; the provider link is temporary."; }
    }
    return NextResponse.json({
      status: task.status,
      progress: task.progress || 0,
      modelUrl,
      persisted: task.status === "success" && !storageWarning,
      storageWarning,
      previewUrl: task.output?.rendered_image || task.output?.generated_image || null,
      error: task.error_msg || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read the Tripo task." },
      { status: 500 },
    );
  }
}
