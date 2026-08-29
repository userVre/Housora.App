import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { refundUsageEvent } from "../../../../../lib/credits";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to view this 3D task." }, { status: 401 });
  const key = process.env.TRIPO_API_KEY;
  if (!key) return NextResponse.json({ error: "TRIPO_API_KEY is not configured." }, { status: 503 });
  const { taskId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(taskId)) {
    return NextResponse.json({ error: "Invalid Tripo task." }, { status: 400 });
  }
  try {
    const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.code !== 0) {
      return NextResponse.json(
        { error: result?.message || "Could not read the Tripo task." },
        { status: response.status || 502 },
      );
    }
    const task = result.data;
    const billingEventId = new URL(request.url).searchParams.get("billingEventId");
    if ((task.status === "failed" || task.status === "cancelled") && billingEventId?.startsWith(`usage:${userId}:`)) {
      await refundUsageEvent(userId, billingEventId, "3D generation failed").catch(() => undefined);
    }
    return NextResponse.json({
      status: task.status,
      progress: task.progress || 0,
      modelUrl: task.output?.pbr_model || task.output?.model || task.output?.base_model || null,
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
