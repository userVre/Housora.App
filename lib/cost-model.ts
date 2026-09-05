/**
 * Internal documented cost model — SERVER ONLY. Never import from client components.
 */
export const HOUSORA_CREDIT_COSTS = { detection: 1, imageEdit: 4, model3d: 12 } as const;
export const PROVIDER_COSTS = { grokGenerationUSD: 0.04, grokEditUSD: 0.07, modalL4PerSecondUSD: 0.000222, whopBaselinePercent: 0.027, whopBaselineFixedUSD: 0.3 } as const;
export function tripoCostUSD(consumedCredit: number | null | undefined): number | null {
  if (consumedCredit == null || !Number.isFinite(consumedCredit)) return null;
  const raw = process.env.TRIPO_DOLLAR_PER_TRIPO_CREDIT ?? process.env.TRIPO_CREDIT_PRICE_USD ?? "";
  const perCredit = Number(raw);
  if (!Number.isFinite(perCredit) || perCredit <= 0) return null;
  return consumedCredit * perCredit;
}
export function allowedCostForHousoraCredits(housoraCredits: number): number | null {
  const allowedPerCredit = Number(process.env.ALLOWED_COST_PER_HOUSORA_CREDIT_USD ?? "");
  if (!Number.isFinite(allowedPerCredit) || allowedPerCredit <= 0) return null;
  return allowedPerCredit * housoraCredits;
}
export function warnIfProviderCostExceedsAllowed(action: string, providerCostUSD: number | null, housoraCredits: number, context?: Record<string, unknown>) {
  if (providerCostUSD == null) return;
  const allowed = allowedCostForHousoraCredits(housoraCredits);
  if (allowed == null) return;
  if (providerCostUSD > allowed) console.warn("[margin] provider cost exceeds allowed cost", { action, providerCostUSD, allowed, overage: providerCostUSD - allowed, ...context });
}
export function whopFeeForAmount(amountUSD: number): number { return amountUSD * PROVIDER_COSTS.whopBaselinePercent + PROVIDER_COSTS.whopBaselineFixedUSD; }
