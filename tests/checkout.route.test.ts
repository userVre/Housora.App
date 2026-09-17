// Checkout route states (B03): every locally testable outcome of
// POST /api/checkout without contacting Whop or spending anything.
// The only untestable-locally branch is a live provider success, which needs
// real Whop credentials (left as an explicit owner step).
import { test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => authMock(...args) }));

const createMock = vi.fn();
vi.mock("../lib/whop", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../lib/whop")>();
  return { ...mod, getWhopClient: () => ({ checkoutConfigurations: { create: createMock } }) };
});

import { POST } from "../app/api/checkout/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.WHOP_COMPANY_ID;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

test("401 when signed out", async () => {
  authMock.mockResolvedValue({ userId: null });
  const res = await POST(req({ offer: "creator_monthly" }));
  expect(res.status).toBe(401);
  expect(createMock).not.toHaveBeenCalled();
});

test("400 for unknown offer (no provider call)", async () => {
  authMock.mockResolvedValue({ userId: "user_1" });
  const res = await POST(req({ offer: "not-an-offer" }));
  expect(res.status).toBe(400);
  expect(createMock).not.toHaveBeenCalled();
});

test("400 for missing offer", async () => {
  authMock.mockResolvedValue({ userId: "user_1" });
  const res = await POST(req({}));
  expect(res.status).toBe(400);
});

test("503 with friendly config message when company id is missing", async () => {
  authMock.mockResolvedValue({ userId: "user_1" });
  const res = await POST(req({ offer: "creator_monthly" }));
  expect(res.status).toBe(503);
  const body = await res.json();
  expect(body.code).toBe("CHECKOUT_CONFIGURATION");
  expect(createMock).not.toHaveBeenCalled();
});

test("502 reproduces the reported provider failure message", async () => {
  authMock.mockResolvedValue({ userId: "user_1" });
  process.env.WHOP_COMPANY_ID = "biz_test";
  process.env.WHOP_CREDIT_PACK_150 = "plan_test_150";
  createMock.mockRejectedValue(new Error("provider exploded"));
  const res = await POST(req({ offer: "credits_150" }));
  expect(res.status).toBe(502);
  const body = await res.json();
  expect(body.error).toBe("Whop could not open checkout. Please wait a moment and try again.");
  expect(body.code).toBe("CHECKOUT_PROVIDER");
});

test("200 returns provider URL with metadata (mocked provider, no purchase)", async () => {
  authMock.mockResolvedValue({ userId: "user_1" });
  process.env.WHOP_COMPANY_ID = "biz_test";
  process.env.WHOP_PLAN_CREATOR_YEARLY = "plan_test_creator_yearly";
  createMock.mockResolvedValue({ purchase_url: "https://whop.test/checkout/abc" });
  const res = await POST(req({ offer: "creator_yearly" }));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ url: "https://whop.test/checkout/abc" });
  expect(createMock).toHaveBeenCalledTimes(1);
  const args = createMock.mock.calls[0][0];
  expect(args.account_id).toBe("biz_test");
  expect(args.metadata).toMatchObject({ clerk_user_id: "user_1", offer_key: "creator_yearly", source: "housora_web" });
  expect(args.redirect_url).toContain("/workspace?view=pricing&checkout=success");
});
