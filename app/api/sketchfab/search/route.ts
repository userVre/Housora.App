import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchSketchfab } from "../../../../lib/sketchfab";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "sofa";
  const category = searchParams.get("category") || undefined;
  const style = searchParams.get("style") || undefined;
  try {
    const data = await searchSketchfab(q, { category, style });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 502 });
  }
}
