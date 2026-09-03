import { NextResponse } from "next/server";

export const runtime = "nodejs";

function has(name: string) {
  const v = process.env[name];
  return Boolean(v && String(v).trim().length > 8);
}

export async function GET() {
  const checks = {
    // generation
    GROK_IMAGE_KEY: has("GROK_IMAGE_KEY"),
    OPENROUTER_API_KEY: has("OPENROUTER_API_KEY"),
    generationReady: has("GROK_IMAGE_KEY") || has("OPENROUTER_API_KEY"),
    // segmentation - Modal SAM 3.1
    MODAL_SAM_ENDPOINT: has("MODAL_SAM_ENDPOINT"),
    MODAL_PROXY_KEY: has("MODAL_PROXY_KEY"),
    MODAL_PROXY_SECRET: has("MODAL_PROXY_SECRET"),
    segmentationReady: has("MODAL_SAM_ENDPOINT") && has("MODAL_PROXY_KEY") && has("MODAL_PROXY_SECRET"),
    // 3D - Tripo
    TRIPO_API_KEY: has("TRIPO_API_KEY"),
    tripoReady: has("TRIPO_API_KEY"),
    // AR - free via Google model-viewer, no key
    arReady: true,
    // core
    CLERK: has("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") && has("CLERK_SECRET_KEY"),
    CONVEX: has("NEXT_PUBLIC_CONVEX_URL") && has("CONVEX_DEPLOYMENT"),
    WHOP: has("WHOP_API_KEY"),
  };

  const allCritical = checks.generationReady && checks.segmentationReady && checks.tripoReady;
  return NextResponse.json({
    ok: allCritical,
    timestamp: new Date().toISOString(),
    env: checks,
    hint: !allCritical
      ? "Some services show 'is not configured' because Vercel hasn't deployed the latest env vars. After adding variables (Shared or Project), you must Redeploy in Vercel > Deployments > ⋯ > Redeploy (without cache)."
      : "All required env vars detected at runtime.",
  });
}
