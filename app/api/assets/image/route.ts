import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { storeProjectImage } from "../../../../lib/image-storage";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save images." }, { status: 401 });
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File) || image.size > 10_000_000 || !["image/png", "image/jpeg", "image/webp"].includes(image.type)) return NextResponse.json({ error: "Use an image under 10 MB." }, { status: 400 });
    const url = await storeProjectImage(userId, Buffer.from(await image.arrayBuffer()));
    return NextResponse.json({ url });
  } catch { return NextResponse.json({ error: "Your image could not be saved. Please try again." }, { status: 503 }); }
}
