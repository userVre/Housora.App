import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { getSketchfabModel } from "../../../../lib/sketchfab";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { uid } = await request.json().catch(() => ({}));
  if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });
  try {
    const model = await getSketchfabModel(uid);
    // store metadata in Convex for caching (flexible source field)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    // Use server mutation via ConvexHttpClient with auth token not available server-side — instead return metadata and let client save via convex/mutation
    return NextResponse.json({ model: { uid, name: model.name, thumbnail: model.thumbnails?.images?.[0]?.url, license: model.license?.label, category: model.categories?.[0]?.name } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fetch failed" }, { status: 502 });
  }
}
