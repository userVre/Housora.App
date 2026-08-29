import { unwrapWebhook } from "@whop/sdk/helpers";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { WHOP_OFFERS, type WhopOfferKey } from "../../../../lib/whop";

export const runtime = "nodejs";

type WhopEvent = { id?: string; type: string; data?: Record<string, unknown> };

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function offerFromPlan(planId?: string) {
  if (!planId) return undefined;
  return (Object.keys(WHOP_OFFERS) as WhopOfferKey[]).find(
    (key) => process.env[WHOP_OFFERS[key].env] === planId,
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!secret || !convexUrl) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  try {
    const payload = await request.text();
    const event = unwrapWebhook<WhopEvent>(payload, {
      headers: Object.fromEntries(request.headers.entries()),
      key: secret,
    });
    const data = object(event.data);
    const metadata = object(data.metadata);
    const payment = object(data.payment);
    const membership = object(data.membership);
    const plan = object(data.plan);
    const paymentId = text(data.payment_id) || text(payment.id) || (event.type === "payment.succeeded" ? text(data.id) : undefined);
    const membershipId = text(data.membership_id) || text(membership.id) || (event.type.startsWith("membership.") ? text(data.id) : undefined);
    const planId = text(data.plan_id) || text(plan.id);
    const ownerId = text(metadata.clerk_user_id) || text(object(payment.metadata).clerk_user_id) || text(object(membership.metadata).clerk_user_id);
    const offerKey = text(metadata.offer_key) || text(object(payment.metadata).offer_key) || text(object(membership.metadata).offer_key) || offerFromPlan(planId);
    const eventId = request.headers.get("webhook-id") || event.id;
    if (!eventId) return NextResponse.json({ error: "Webhook event ID is missing." }, { status: 400 });

    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(api.credits.fulfillWhopServer, {
      serverKey: secret,
      eventId,
      eventType: event.type,
      ownerId,
      offerKey,
      paymentId,
      membershipId,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Whop webhook rejected", error);
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }
}
