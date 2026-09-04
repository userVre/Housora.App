import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to view your task." }, { status: 401 });
  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId || requestId.length > 200) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  try {
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL!);
    const job = await client.query(api.jobs.getServer, { serverKey: process.env.WHOP_WEBHOOK_SECRET!, ownerId: userId, requestId });
    if (!job) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    if (job.status === "success" && job.result?.payloadUrl) {
      const payload = await fetch(job.result.payloadUrl, { signal: AbortSignal.timeout(30_000), cache: "no-store" });
      if (!payload.ok) throw new Error("Result unavailable");
      return NextResponse.json({ status: "success", result: await payload.json() });
    }
    return NextResponse.json({ status: job.status, error: job.error });
  } catch { return NextResponse.json({ error: "Could not check the task. No new generation was submitted." }, { status: 503 }); }
}
