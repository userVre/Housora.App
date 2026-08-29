import { WhopClient } from "@whop/sdk";

export function getWhopClient() {
  const token = process.env.WHOP_API_KEY;
  if (!token) throw new Error("WHOP_API_KEY is not configured.");
  return new WhopClient({ token });
}

export const WHOP_OFFERS = {
  creator_monthly: { env: "WHOP_PLAN_CREATOR_MONTHLY", credits: 120, type: "subscription" },
  creator_yearly: { env: "WHOP_PLAN_CREATOR_YEARLY", credits: 120, type: "subscription" },
  studio_monthly: { env: "WHOP_PLAN_STUDIO_MONTHLY", credits: 400, type: "subscription" },
  studio_yearly: { env: "WHOP_PLAN_STUDIO_YEARLY", credits: 400, type: "subscription" },
  credits_50: { env: "WHOP_CREDIT_PACK_50", credits: 50, type: "credit_pack" },
  credits_150: { env: "WHOP_CREDIT_PACK_150", credits: 150, type: "credit_pack" },
  credits_400: { env: "WHOP_CREDIT_PACK_400", credits: 400, type: "credit_pack" },
} as const;

export type WhopOfferKey = keyof typeof WHOP_OFFERS;

export function getWhopPlanId(offer: WhopOfferKey) {
  const planId = process.env[WHOP_OFFERS[offer].env];
  if (!planId?.startsWith("plan_")) throw new Error(`${WHOP_OFFERS[offer].env} is missing or invalid.`);
  return planId;
}
