import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

function client() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!url) throw new Error("Convex is not configured.");
  return new ConvexHttpClient(url);
}

function serverKey() {
  const value = process.env.WHOP_WEBHOOK_SECRET;
  if (!value) throw new Error("WHOP_WEBHOOK_SECRET is not configured.");
  return value;
}

export async function consumeCredits(ownerId: string, amount: number, description: string) {
  const eventId = `usage:${ownerId}:${crypto.randomUUID()}`;
  const usage = await client().mutation(api.credits.consumeServer, {
    serverKey: serverKey(), ownerId, eventId, amount, description,
  });
  return { ...usage, eventId };
}

export async function refundCredits(
  ownerId: string,
  usage: { eventId: string; subscriptionUsed: number; purchasedUsed: number },
  description: string,
) {
  await client().mutation(api.credits.refundUsageServer, {
    serverKey: serverKey(),
    ownerId,
    eventId: `refund:${usage.eventId}`,
    subscriptionAmount: usage.subscriptionUsed,
    purchasedAmount: usage.purchasedUsed,
    description,
  });
}

export async function refundUsageEvent(ownerId: string, usageEventId: string, description: string) {
  await client().mutation(api.credits.refundUsageEventServer, {
    serverKey: serverKey(), ownerId, usageEventId, description,
  });
}
