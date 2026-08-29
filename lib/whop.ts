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
  const aliases: Partial<Record<WhopOfferKey, string[]>> = {
    creator_monthly: ["WHOP_CREATOR_MONTHLY_PLAN_ID", "WHOP_PRO_MONTHLY_PLAN_ID"],
    creator_yearly: ["WHOP_CREATOR_YEARLY_PLAN_ID", "WHOP_PRO_YEARLY_PLAN_ID"],
    studio_monthly: ["WHOP_STUDIO_MONTHLY_PLAN_ID", "WHOP_ENTERPRISE_PRO_MONTHLY_PLAN_ID"],
    studio_yearly: ["WHOP_STUDIO_YEARLY_PLAN_ID", "WHOP_ENTERPRISE_PRO_YEARLY_PLAN_ID"],
    credits_50: ["WHOP_CREDITS_50_PLAN_ID"],
    credits_150: ["WHOP_CREDITS_150_PLAN_ID"],
    credits_400: ["WHOP_CREDITS_400_PLAN_ID"],
  };
  const planId = process.env[WHOP_OFFERS[offer].env]
    || aliases[offer]?.map((name) => process.env[name]).find(Boolean);
  if (!planId?.startsWith("plan_")) throw new Error(`${WHOP_OFFERS[offer].env} is missing or invalid.`);
  return planId;
}
