import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
export const FREE_CREDITS = 12;
const VALID_PACK_AMOUNTS = new Set([50, 150, 400]);
const VALID_PACK_KINDS = new Set(["credits_50", "credits_150", "credits_400"]);
const VALID_SUBSCRIPTION_ALLOWANCES = new Set([120, 400]);
async function currentOwner(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}
async function getAccount(ctx: any, ownerId: string) {
  return await ctx.db.query("creditAccounts").withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId)).unique();
}
async function hasWelcomeTransaction(ctx: any, ownerId: string) {
  const existing = await ctx.db.query("creditTransactions").withIndex("by_event", (q: any) => q.eq("eventId", `welcome:${ownerId}`)).unique();
  return !!existing;
}
async function createFreeAccount(ctx: any, ownerId: string, now: number) {
  if (await hasWelcomeTransaction(ctx, ownerId)) {
    const id = await ctx.db.insert("creditAccounts", { ownerId, plan: "free", status: "active", subscriptionCredits: 0, monthlyAllowance: 0, periodStartedAt: now, updatedAt: now });
    return await ctx.db.get(id);
  }
  const id = await ctx.db.insert("creditAccounts", { ownerId, plan: "free", status: "active", subscriptionCredits: FREE_CREDITS, monthlyAllowance: 0, periodStartedAt: now, updatedAt: now });
  await ctx.db.insert("creditTransactions", { ownerId, eventId: `welcome:${ownerId}`, type: "welcome_grant", description: "Free trial credits", subscriptionDelta: FREE_CREDITS, purchasedDelta: 0, createdAt: now });
  return await ctx.db.get(id);
}
async function refreshSubscription(ctx: any, account: any, now: number) {
  // Monthly allowances are renewed only by a verified Whop payment event. A
  // clock-based refresh here would grant credits after a failed or missed
  // renewal. Annual subscriptions are already paid for the access window, so
  // they can safely receive their included allowance in monthly installments.
  if (account.billingInterval !== "yearly" || account.status !== "active" || !account.monthlyAllowance || !account.periodEndsAt || now < account.periodEndsAt || (account.accessEndsAt && now >= account.accessEndsAt)) return account;
  const periods = Math.max(1, Math.floor((now - account.periodEndsAt) / MONTH) + 1);
  const periodStartedAt = account.periodStartedAt + periods * MONTH;
  const periodEndsAt = account.periodEndsAt + periods * MONTH;
  await ctx.db.patch(account._id, { subscriptionCredits: account.monthlyAllowance, periodStartedAt, periodEndsAt, updatedAt: now });
  await ctx.db.insert("creditTransactions", { ownerId: account.ownerId, eventId: `period:${account.ownerId}:${periodStartedAt}`, type: "subscription_refresh", description: "Monthly plan credits refreshed", subscriptionDelta: account.monthlyAllowance - account.subscriptionCredits, purchasedDelta: 0, createdAt: now });
  return { ...account, subscriptionCredits: account.monthlyAllowance, periodStartedAt, periodEndsAt };
}
async function purchasedBalance(ctx: any, ownerId: string, now: number) {
  const grants = await ctx.db.query("creditGrants").withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId)).collect();
  return grants.filter((grant: any) => grant.status === "active" && grant.expiresAt > now).reduce((sum: number, grant: any) => sum + grant.remaining, 0);
}
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    const now = Date.now();
    let account = await getAccount(ctx, ownerId);
    if (!account) account = await createFreeAccount(ctx, ownerId, now);
    return await refreshSubscription(ctx, account, now);
  },
});
export const getMyBalance = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    const now = Date.now();
    const account = await getAccount(ctx, ownerId);
    const purchased = await purchasedBalance(ctx, ownerId, now);
    if (!account) {
      const welcomeExists = await hasWelcomeTransaction(ctx, ownerId);
      const subscription = welcomeExists ? 0 : FREE_CREDITS;
      return { plan: "free", status: "active", subscription, purchased, total: subscription + purchased };
    }
    const accessActive = account.status === "active" && (!account.accessEndsAt || account.accessEndsAt > now);
    const subscription = accessActive ? account.subscriptionCredits : 0;
    return { plan: account.plan, status: accessActive ? account.status : "inactive", subscription, purchased, total: subscription + purchased, monthlyAllowance: account.monthlyAllowance, periodEndsAt: account.periodEndsAt, accessEndsAt: account.accessEndsAt };
  },
});
export const getMyHistory = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    return await ctx.db.query("creditTransactions").withIndex("by_owner", (q) => q.eq("ownerId", ownerId)).order("desc").take(30);
  },
});
function requireServerKey(serverKey: string) {
  const expected = process.env.HOUSORA_SERVER_KEY || process.env.WHOP_WEBHOOK_SECRET;
  if (!expected || serverKey !== expected) throw new Error("Unauthorized fulfillment request.");
}
function isDemonstrablyInvalidGrant(grant: any): boolean {
  if (grant.paymentId && VALID_PACK_KINDS.has(grant.kind) && VALID_PACK_AMOUNTS.has(grant.amount)) return false;
  if (grant.kind === "usage_refund") return false;
  if (grant.amount === 120000 || grant.remaining === 120000) return true;
  const source = String(grant.sourceEventId || "");
  const kind = String(grant.kind || "");
  const legacyMarker = /legacy|seed|migration|test|fixture|welcome.*120000/i.test(source) || /legacy|seed|migration|test/i.test(kind);
  if (legacyMarker && !VALID_PACK_KINDS.has(kind) && grant.amount > 400) return true;
  return false;
}
function isInvalidFreeSubscription(account: any): boolean {
  if (!account || account.plan !== "free") return false;
  if (account.monthlyAllowance === 0 && account.subscriptionCredits > FREE_CREDITS) return true;
  if (account.subscriptionCredits >= 1000) return true;
  return false;
}
async function repairAccountGrants(ctx: any, ownerId: string, now: number, auditPrefix: string) {
  const account = await getAccount(ctx, ownerId);
  const grants = await ctx.db.query("creditGrants").withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId)).collect();
  let repairedSubscription = false; let repairedGrants = 0; let skippedPaid = 0;
  const isPaidPlan = !!account && account.plan !== "free" && VALID_SUBSCRIPTION_ALLOWANCES.has(account.monthlyAllowance);
  if (!isPaidPlan && account && isInvalidFreeSubscription(account)) {
    const excess = account.subscriptionCredits - FREE_CREDITS;
    await ctx.db.patch(account._id, { subscriptionCredits: FREE_CREDITS, updatedAt: now });
    await ctx.db.insert("creditTransactions", { ownerId, eventId: `${auditPrefix}:free_subscription:${ownerId}:${now}`, type: "repair_free_balance", description: `Repaired invalid free balance ${account.subscriptionCredits} -> ${FREE_CREDITS}`, subscriptionDelta: -excess, purchasedDelta: 0, createdAt: now });
    repairedSubscription = true;
  } else if (isPaidPlan) skippedPaid += 1;
  for (const grant of grants) {
    if (grant.status !== "active") continue;
    if (grant.paymentId && VALID_PACK_KINDS.has(grant.kind) && VALID_PACK_AMOUNTS.has(grant.amount)) { skippedPaid += 1; continue; }
    if (!isDemonstrablyInvalidGrant(grant)) continue;
    await ctx.db.patch(grant._id, { remaining: 0, status: "reversed" });
    await ctx.db.insert("creditTransactions", { ownerId, eventId: `${auditPrefix}:grant:${String(grant._id)}:${now}`, type: "repair_grant_reversed", description: `Reversed invalid legacy grant ${grant.kind} ${grant.amount}`, subscriptionDelta: 0, purchasedDelta: 0, createdAt: now });
    repairedGrants += 1;
  }
  return { repairedSubscription, repairedGrants, skippedPaid };
}
export const repairFreeBalanceInternal = internalMutation({
  args: { ownerId: v.string() },
  handler: async (ctx, { ownerId }) => {
    const now = Date.now();
    return { ownerId, ...(await repairAccountGrants(ctx, ownerId, now, "repair")) };
  },
});
export const repairMyFreeBalance = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await currentOwner(ctx);
    const now = Date.now();
    return await repairAccountGrants(ctx, ownerId, now, "repair");
  },
});
export const repairFreeBalanceServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string() },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const now = Date.now();
    return await repairAccountGrants(ctx, args.ownerId, now, "repair");
  },
});
export const consumeServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), eventId: v.string(), amount: v.number(), description: v.string() },
  handler: async (ctx, args) => { requireServerKey(args.serverKey); return consumeInTransaction(ctx, args); },
});
export const refundUsageServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), eventId: v.string(), subscriptionAmount: v.number(), purchasedAmount: v.number(), description: v.string() },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const duplicate = await ctx.db.query("creditTransactions").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (duplicate) return;
    const now = Date.now(); let account = await getAccount(ctx, args.ownerId); if (!account) account = await createFreeAccount(ctx, args.ownerId, now);
    await ctx.db.patch(account._id, { subscriptionCredits: account.subscriptionCredits + args.subscriptionAmount, updatedAt: now });
    if (args.purchasedAmount > 0) await ctx.db.insert("creditGrants", { ownerId: args.ownerId, sourceEventId: args.eventId, kind: "usage_refund", amount: args.purchasedAmount, remaining: args.purchasedAmount, expiresAt: now + 365 * DAY, status: "active", createdAt: now });
    await ctx.db.insert("creditTransactions", { ownerId: args.ownerId, eventId: args.eventId, type: "usage_refund", description: args.description, subscriptionDelta: args.subscriptionAmount, purchasedDelta: args.purchasedAmount, createdAt: now });
  },
});
export const refundUsageEventServer = mutation({
  args: { serverKey: v.string(), ownerId: v.string(), usageEventId: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const usage = await ctx.db.query("creditTransactions").withIndex("by_event", (q) => q.eq("eventId", args.usageEventId)).unique();
    if (!usage || usage.ownerId !== args.ownerId || usage.type !== "usage") throw new Error("Usage transaction not found.");
    const refundEventId = `refund:${args.usageEventId}`; const duplicate = await ctx.db.query("creditTransactions").withIndex("by_event", (q) => q.eq("eventId", refundEventId)).unique(); if (duplicate) return;
    const now = Date.now(); let account = await getAccount(ctx, args.ownerId); if (!account) account = await createFreeAccount(ctx, args.ownerId, now);
    const subscriptionAmount = Math.abs(usage.subscriptionDelta); const purchasedAmount = Math.abs(usage.purchasedDelta);
    await ctx.db.patch(account._id, { subscriptionCredits: account.subscriptionCredits + subscriptionAmount, updatedAt: now });
    if (purchasedAmount > 0) await ctx.db.insert("creditGrants", { ownerId: args.ownerId, sourceEventId: refundEventId, kind: "usage_refund", amount: purchasedAmount, remaining: purchasedAmount, expiresAt: now + 365 * DAY, status: "active", createdAt: now });
    await ctx.db.insert("creditTransactions", { ownerId: args.ownerId, eventId: refundEventId, type: "usage_refund", description: args.description, subscriptionDelta: subscriptionAmount, purchasedDelta: purchasedAmount, createdAt: now });
  },
});
export const fulfillWhopServer = mutation({
  args: { serverKey: v.string(), eventId: v.string(), eventType: v.string(), ownerId: v.optional(v.string()), offerKey: v.optional(v.string()), paymentId: v.optional(v.string()), membershipId: v.optional(v.string()), accessEndsAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    requireServerKey(args.serverKey);
    const seen = await ctx.db.query("webhookEvents").withIndex("by_provider_and_eventId", (q) => q.eq("provider", "whop").eq("eventId", args.eventId)).unique(); if (seen) return { duplicate: true };
    const now = Date.now(); let ownerId = args.ownerId; let account = ownerId ? await getAccount(ctx, ownerId) : null;
    if (!account && args.membershipId) { account = await ctx.db.query("creditAccounts").withIndex("by_membership", (q) => q.eq("whopMembershipId", args.membershipId)).unique(); ownerId = account?.ownerId ?? ownerId; }
    if (!account && args.paymentId) { account = await ctx.db.query("creditAccounts").withIndex("by_payment", (q) => q.eq("lastPaymentId", args.paymentId)).unique(); ownerId = account?.ownerId ?? ownerId; }
    if (!ownerId && args.paymentId) { const grant = await ctx.db.query("creditGrants").withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId)).first(); ownerId = grant?.ownerId; if (ownerId) account = await getAccount(ctx, ownerId); }
    await ctx.db.insert("webhookEvents", { provider: "whop", eventId: args.eventId, eventType: args.eventType, ownerId, receivedAt: now });
    if (!ownerId) return { duplicate: false, ignored: true }; if (!account) account = await createFreeAccount(ctx, ownerId, now);
    if (["refund.created", "dispute.created", "membership.deactivated"].includes(args.eventType)) {
      if (args.paymentId) { const grants = await ctx.db.query("creditGrants").withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId)).collect(); for (const grant of grants) await ctx.db.patch(grant._id, { remaining: 0, status: "reversed" }); }
      if (args.eventType === "membership.deactivated" || account.lastPaymentId === args.paymentId) await ctx.db.patch(account._id, { status: "inactive", subscriptionCredits: 0, updatedAt: now });
      await ctx.db.insert("creditTransactions", { ownerId, eventId: args.eventId, type: "payment_reversed", description: "Payment, membership, or credit grant reversed", subscriptionDelta: 0, purchasedDelta: 0, createdAt: now }); return { duplicate: false };
    }
    if (args.eventType !== "payment.succeeded") return { duplicate: false }; if (!args.offerKey) return { duplicate: false, ignored: true };
    if (args.paymentId) { const priorGrant = await ctx.db.query("creditGrants").withIndex("by_payment", q => q.eq("paymentId", args.paymentId)).first(); if (priorGrant || account.lastPaymentId === args.paymentId) return { duplicate: true }; }
    const subscription: Record<string, { allowance: number; accessDays: number; billingInterval: "monthly" | "yearly" }> = { creator_monthly: { allowance: 120, accessDays: 35, billingInterval: "monthly" }, creator_yearly: { allowance: 120, accessDays: 370, billingInterval: "yearly" }, studio_monthly: { allowance: 400, accessDays: 35, billingInterval: "monthly" }, studio_yearly: { allowance: 400, accessDays: 370, billingInterval: "yearly" } };
    const packs: Record<string, number> = { credits_50: 50, credits_150: 150, credits_400: 400 };
    const plan = subscription[args.offerKey];
    if (plan) { await ctx.db.patch(account._id, { plan: args.offerKey, status: "active", subscriptionCredits: plan.allowance, monthlyAllowance: plan.allowance, billingInterval: plan.billingInterval, periodStartedAt: now, periodEndsAt: now + MONTH, accessEndsAt: args.accessEndsAt || now + plan.accessDays * DAY, whopMembershipId: args.membershipId, lastPaymentId: args.paymentId, updatedAt: now }); await ctx.db.insert("creditTransactions", { ownerId, eventId: args.eventId, type: "subscription_grant", description: `${args.offerKey} plan credits`, subscriptionDelta: plan.allowance - account.subscriptionCredits, purchasedDelta: 0, createdAt: now }); return { duplicate: false }; }
    const packAmount = packs[args.offerKey]; if (packAmount) { await ctx.db.insert("creditGrants", { ownerId, sourceEventId: args.eventId, paymentId: args.paymentId, kind: args.offerKey, amount: packAmount, remaining: packAmount, expiresAt: now + 365 * DAY, status: "active", createdAt: now }); await ctx.db.insert("creditTransactions", { ownerId, eventId: args.eventId, type: "credit_pack", description: `${packAmount} purchased credits`, subscriptionDelta: 0, purchasedDelta: packAmount, createdAt: now }); } return { duplicate: false };
  },
});
export async function consumeInTransaction(ctx: MutationCtx, args: { ownerId: string; eventId: string; amount: number; description: string }) {
  if (!Number.isInteger(args.amount) || args.amount <= 0) throw new Error("Invalid credit amount.");
  const duplicate = await ctx.db.query("creditTransactions").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique(); if (duplicate) return { subscriptionUsed: 0, purchasedUsed: 0, duplicate: true };
  const now = Date.now(); let account = await getAccount(ctx, args.ownerId); if (!account) account = await createFreeAccount(ctx, args.ownerId, now); account = await refreshSubscription(ctx, account, now);
  const grants = (await ctx.db.query("creditGrants").withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId)).collect()).filter((grant) => grant.status === "active" && grant.expiresAt > now && grant.remaining > 0).sort((a, b) => a.expiresAt - b.expiresAt);
  const purchased = grants.reduce((sum, grant) => sum + grant.remaining, 0);
  const availableSubscription = account.status === "active" && (!account.accessEndsAt || account.accessEndsAt > now) ? account.subscriptionCredits : 0;
  if (availableSubscription + purchased < args.amount) throw new Error("Not enough credits. Add credits or upgrade your plan.");
  const subscriptionUsed = Math.min(availableSubscription, args.amount); let purchasedUsed = args.amount - subscriptionUsed;
  await ctx.db.patch(account._id, { subscriptionCredits: account.subscriptionCredits - subscriptionUsed, updatedAt: now });
  let remainingToUse = purchasedUsed; for (const grant of grants) { if (!remainingToUse) break; const used = Math.min(grant.remaining, remainingToUse); await ctx.db.patch(grant._id, { remaining: grant.remaining - used }); remainingToUse -= used; }
  await ctx.db.insert("creditTransactions", { ownerId: args.ownerId, eventId: args.eventId, type: "usage", description: args.description, subscriptionDelta: -subscriptionUsed, purchasedDelta: -purchasedUsed, createdAt: now });
  return { subscriptionUsed, purchasedUsed, duplicate: false };
}
