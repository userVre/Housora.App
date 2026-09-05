import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCubiCasaTicket } from "../../../../lib/cubicasa";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.sourceUrls)) {
    return NextResponse.json({ error: "Upload a CubiCasa Mobile SDK scan ZIP before requesting a floor plan." }, { status: 400 });
  }
  const webhookUrl = process.env.CUBICASA_WEBHOOK_URL;
  const workflowReady = process.env.CUBICASA_MOBILE_SDK_READY === "true" && process.env.CUBICASA_EXPORTER_READY === "true";
  if (!webhookUrl || !workflowReady) {
    return NextResponse.json({ error: "Floor-plan scanning needs the CubiCasa Mobile SDK, delivery webhook, and Exporter API before it can be enabled. No credits were charged.", code: "CUBICASA_WORKFLOW_NOT_READY" }, { status: 503 });
  }
  try {
    const result = await createCubiCasaTicket({
      sourceUrls: body.sourceUrls,
      webhookUrl,
      externalId: body.externalId,
      formattedAddress: body.formattedAddress,
      suite: body.suite,
      notes: body.notes,
      priority: body.priority,
    });
    return NextResponse.json({ ...result, status: "queued", creditsCharged: 0 }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CubiCasa request failed.";
    const isInputError = /requires|required|valid/i.test(message);
    console.error("CubiCasa ticket creation failed", error);
    return NextResponse.json({ error: isInputError ? message : "CubiCasa could not accept this scan. No Housora credits were charged." }, { status: isInputError ? 400 : 502 });
  }
}
