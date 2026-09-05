import { NextResponse } from "next/server";
import { getLegalConfig } from "../../../lib/legal-config";
import { getWhopPlanId, WHOP_OFFERS, type WhopOfferKey } from "../../../lib/whop";

export const runtime = "nodejs";

function has(name: string) {
  const v = process.env[name];
  return Boolean(v && String(v).trim().length > 8);
}

export async function GET() {
  const legal = getLegalConfig();
  const whopOffers = Object.keys(WHOP_OFFERS) as WhopOfferKey[];
  const missingWhopOffers = whopOffers.filter((offer) => {
    try { return !getWhopPlanId(offer); } catch { return true; }
  });
  const whopApiReady = has("WHOP_API_KEY") && has("WHOP_COMPANY_ID");
  const whopWebhookReady = has("WHOP_WEBHOOK_SECRET");
  const internalServerReady = has("HOUSORA_SERVER_KEY") || whopWebhookReady;
  const checks = {
    // generation
    GROK_IMAGE_KEY: has("GROK_IMAGE_KEY"),
    generationReady: has("GROK_IMAGE_KEY") || has("XAI_API_KEY"),
    // segmentation - Modal SAM 3.1
    MODAL_SAM_ENDPOINT: has("MODAL_SAM_ENDPOINT"),
    MODAL_PROXY_KEY: has("MODAL_PROXY_KEY"),
    MODAL_PROXY_SECRET: has("MODAL_PROXY_SECRET"),
    segmentationReady: has("MODAL_SAM_ENDPOINT") && has("MODAL_PROXY_KEY") && has("MODAL_PROXY_SECRET"),
    // 3D - Tripo
    TRIPO_API_KEY: has("TRIPO_API_KEY"),
    tripoReady: has("TRIPO_API_KEY"),
    // optional catalogs / floor-plan integration
    SKETCHFAB_API_TOKEN: has("SKETCHFAB_API_TOKEN"),
    sketchfabReady: has("SKETCHFAB_API_TOKEN"),
    CUBICASA_API_KEY: has("CUBICASA_API_KEY"),
    CUBICASA_WEBHOOK_URL: has("CUBICASA_WEBHOOK_URL"),
    cubicasaReady: has("CUBICASA_API_KEY") && has("CUBICASA_WEBHOOK_URL") && process.env.CUBICASA_MOBILE_SDK_READY === "true" && process.env.CUBICASA_EXPORTER_READY === "true",
    // AR - free via Google model-viewer, no key
    arRequiresCompatibleDevice: true,
    // core
    CLERK: has("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") && has("CLERK_SECRET_KEY"),
    CONVEX: has("NEXT_PUBLIC_CONVEX_URL"),
    WHOP_API: whopApiReady,
    WHOP_WEBHOOK: whopWebhookReady,
    WHOP_OFFERS: missingWhopOffers.length === 0,
    INTERNAL_SERVER_AUTH: internalServerReady,
  };

  const billingReady = whopApiReady && whopWebhookReady && missingWhopOffers.length === 0 && internalServerReady;
  const allCritical = checks.generationReady && checks.segmentationReady && checks.tripoReady && checks.CLERK && checks.CONVEX && billingReady && legal.ready;
  return NextResponse.json({
    ok: allCritical,
    ready: allCritical,
    legalReady: legal.ready,
    legal: { missing: legal.missing },
    billingReady,
    billing: { missingOffers: missingWhopOffers },
    timestamp: new Date().toISOString(),
    env: checks,
    hint: !allCritical
      ? "This deployment is missing one or more required service or legal settings. Add them to the server environment, redeploy, and check this endpoint again."
      : "Configuration detected only. Provider connectivity, payments and device AR have not been tested by this endpoint.",
  });
}
