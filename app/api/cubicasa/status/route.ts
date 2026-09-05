import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Not release-ready: do not submit paid/unverified work or return placeholder deliverables.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  return NextResponse.json({
    error: "CubiCasa sends conversion progress and delivery through the configured webhook; polling is not supported by this integration.",
    code: "WEBHOOK_REQUIRED",
  }, { status: 409 });
}
