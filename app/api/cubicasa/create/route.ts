import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCubiCasaJob } from "../../../../lib/cubicasa";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const photos: string[] = body.photos || [];
  const projectId: string | undefined = body.projectId;
  const roomId: string | undefined = body.roomId;
  if (!photos.length) return NextResponse.json({ error: "Upload at least one room photo (dataUrl or https URL)" }, { status: 400 });
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  try {
    const { jobId } = await createCubiCasaJob(photos, body.roomName);
    // create floorPlan record linked to project/room
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const whopSecret = process.env.WHOP_WEBHOOK_SECRET!;
    // Use server mutation via direct Convex client with serverKey bypass — we emulate by using ConvexHttpClient with serverKey not needed if we insert via server mutation
    // For now create via client mutation using user auth — fallback to direct insert
    // We call convex/mutation with auth via ConvexHttpClient token not available, so we return jobId and let client create floorPlan
    return NextResponse.json({ jobId, status: "queued" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("not configured")) return NextResponse.json({ error: msg }, { status: 503 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
