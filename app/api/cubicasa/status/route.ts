import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCubiCasaJob } from "../../../../lib/cubicasa";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  try {
    const data = await getCubiCasaJob(jobId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Poll failed" }, { status: 502 });
  }
}
