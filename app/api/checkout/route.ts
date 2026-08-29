import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWhopClient, getWhopPlanId, WHOP_OFFERS, type WhopOfferKey } from "../../../lib/whop";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in before checking out." }, { status: 401 });

  try {
    const body = (await request.json()) as { offer?: string };
    if (!body.offer || !(body.offer in WHOP_OFFERS)) {
      return NextResponse.json({ error: "That offer is not available." }, { status: 400 });
    }
    const offer = body.offer as WhopOfferKey;
    const accountId = process.env.WHOP_COMPANY_ID;
    if (!accountId?.startsWith("biz_")) throw new Error("WHOP_COMPANY_ID is missing or invalid.");

    const checkout = await getWhopClient().checkoutConfigurations.create({
      account_id: accountId,
      plan_id: getWhopPlanId(offer),
      metadata: {
        clerk_user_id: userId,
        offer_key: offer,
        source: "housora_web",
      },
      redirect_url: `${request.nextUrl.origin}/workspace?view=pricing&checkout=success`,
    });
    if (!checkout.purchase_url) throw new Error("Whop did not return a checkout URL.");
    return NextResponse.json({ url: checkout.purchase_url });
  } catch (error) {
    console.error("Unable to create Whop checkout", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
