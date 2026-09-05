import { afterEach, describe, expect, test, vi } from "vitest";
import { allowedCostForHousoraCredits, tripoCostUSD, warnIfProviderCostExceedsAllowed, whopFeeForAmount } from "../lib/cost-model";

afterEach(() => {
  delete process.env.TRIPO_DOLLAR_PER_TRIPO_CREDIT;
  delete process.env.TRIPO_CREDIT_PRICE_USD;
  delete process.env.ALLOWED_COST_PER_HOUSORA_CREDIT_USD;
  vi.restoreAllMocks();
});

describe("internal cost model", () => {
  test("does not guess an unknown Tripo exchange rate", () => {
    expect(tripoCostUSD(12)).toBeNull();
  });
  test("computes configured Tripo and Whop costs", () => {
    process.env.TRIPO_DOLLAR_PER_TRIPO_CREDIT = "0.02";
    expect(tripoCostUSD(12)).toBeCloseTo(.24);
    expect(whopFeeForAmount(19)).toBeCloseTo(.813);
  });
  test("warns when real provider cost exceeds the configured allowance", () => {
    process.env.ALLOWED_COST_PER_HOUSORA_CREDIT_USD = "0.03";
    expect(allowedCostForHousoraCredits(4)).toBeCloseTo(.12);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warnIfProviderCostExceedsAllowed("edit", .2, 4);
    expect(warning).toHaveBeenCalledOnce();
  });
});
