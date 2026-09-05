import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchSketchfab } from "../../../../lib/sketchfab";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ error: "Search must contain between 2 and 80 characters." }, { status: 400 });
  }
  try {
    const result = await searchSketchfab(query, {
      category: searchParams.get("category")?.slice(0, 40) || undefined,
      style: searchParams.get("style")?.slice(0, 40) || undefined,
      cursor: searchParams.get("cursor")?.slice(0, 500) || undefined,
    });
    return NextResponse.json({ ...result, provider: "Sketchfab", creditsCharged: 0 });
  } catch (error) {
    console.error("Sketchfab search failed", error);
    return NextResponse.json({ error: "The furniture catalog is temporarily unavailable. No credits were charged." }, { status: 502 });
  }
}
