import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "../app/api/health/route";

const originalEnv = { ...process.env };
afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("production readiness health check", () => {
  test("does not call billing ready when only a Whop API key exists", async () => {
    vi.stubEnv("WHOP_API_KEY", "whop-api-key-long");
    delete process.env.WHOP_COMPANY_ID;
    delete process.env.WHOP_WEBHOOK_SECRET;
    const response = await GET();
    const body = await response.json();
    expect(body.billingReady).toBe(false);
    expect(body.env.WHOP_API).toBe(false);
    expect(body.env.WHOP_WEBHOOK).toBe(false);
  });

  test("reports exactly which Whop offers are not configured", async () => {
    const planEnv = [
      "WHOP_PLAN_CREATOR_MONTHLY",
      "WHOP_PLAN_CREATOR_YEARLY",
      "WHOP_PLAN_STUDIO_MONTHLY",
      "WHOP_PLAN_STUDIO_YEARLY",
      "WHOP_CREDIT_PACK_50",
      "WHOP_CREDIT_PACK_150",
      "WHOP_CREDIT_PACK_400",
    ];
    for (const name of planEnv) delete process.env[name];
    const response = await GET();
    const body = await response.json();
    expect(body.env.WHOP_OFFERS).toBe(false);
    expect(body.billing.missingOffers).toContain("creator_monthly");
    expect(body.billing.missingOffers).toContain("credits_400");
  });
});
