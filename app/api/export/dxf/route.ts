import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateDxf } from "../../../../lib/dxf";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const plan = body.plan || {};
  try {
    const dxf = generateDxf(plan);
    return new NextResponse(dxf, {
      headers: {
        "Content-Type": "application/dxf",
        "Content-Disposition": `attachment; filename="housora-${Date.now()}.dxf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DXF failed" }, { status: 500 });
  }
}
