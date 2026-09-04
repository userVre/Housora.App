import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Not release-ready: do not submit paid/unverified work or return placeholder deliverables.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  return NextResponse.json({ error: "Floor-plan scanning is not available yet. No credits were charged.", code: "FEATURE_UNAVAILABLE" }, { status: 503 });
}
