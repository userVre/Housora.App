import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { type = "spec", projectName = "Project", clientName = "Client", rooms = [] } = body;
  try {
    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text(`${type.toUpperCase()} — ${projectName}`, 10, 15);
    pdf.setFontSize(10); pdf.text(`Client: ${clientName}  Date: ${new Date().toLocaleDateString()}`, 10, 22);
    let y = 32;
    for (const r of rooms) {
      if (y > 270) { pdf.addPage(); y = 15; }
      pdf.setFontSize(12); pdf.text(r.name || "Room", 10, y); y += 6;
      pdf.setFontSize(8); pdf.text(`Before/After: ${r.before ? "yes" : "no"}  Style: ${r.style || "-"}`, 10, y); y += 10;
    }
    if (type === "moodboard") {
      pdf.setFontSize(10); pdf.text("Mood board — materials & palette locked per style library", 10, y);
    }
    const out = pdf.output("arraybuffer");
    return new NextResponse(out, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="housora-${type}-${Date.now()}.pdf"` } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "PDF failed" }, { status: 500 });
  }
}
