import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSketchfabModel, isCommercialSketchfabLicense, normalizeSketchfabLicense } from "../../../../lib/sketchfab";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const uid = typeof body?.uid === "string" ? body.uid.trim() : "";
  if (!/^[a-zA-Z0-9]{20,40}$/.test(uid)) {
    return NextResponse.json({ error: "A valid Sketchfab model ID is required." }, { status: 400 });
  }
  try {
    const model = await getSketchfabModel(uid);
    const license = normalizeSketchfabLicense(model.license);
    if (!model.isDownloadable || !isCommercialSketchfabLicense(model.license)) {
      return NextResponse.json({ error: "This model cannot be used commercially in Housora.", code: "LICENSE_NOT_ALLOWED" }, { status: 422 });
    }
    return NextResponse.json({
      model: {
        uid,
        name: model.name,
        thumbnail: model.thumbnails?.images?.[0]?.url || "",
        license,
        author: model.user?.displayName || model.user?.username || "",
        attributionUrl: `https://sketchfab.com/models/${uid}`,
        embedUrl: `https://sketchfab.com/models/${uid}/embed?autostart=1&ui_theme=dark`,
      },
      provider: "Sketchfab",
      creditsCharged: 0,
      notice: "Model provided by Sketchfab. Keep the author attribution when required by the license.",
    });
  } catch (error) {
    console.error("Sketchfab model selection failed", error);
    return NextResponse.json({ error: "That model could not be loaded. No credits were charged." }, { status: 502 });
  }
}
