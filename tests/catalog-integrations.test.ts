import { describe, expect, it } from "vitest";
import { isCommercialSketchfabLicense, normalizeSketchfabLicense } from "../lib/sketchfab";
import { validateCubiCasaTicket } from "../lib/cubicasa";

describe("Sketchfab licensing", () => {
  it("normalizes the supported public license formats", () => {
    expect(normalizeSketchfabLicense({ slug: "cc0" })).toBe("CC0");
    expect(normalizeSketchfabLicense({ slug: "by" })).toBe("CC-BY");
    expect(normalizeSketchfabLicense({ label: "CC Attribution" })).toBe("CC-BY");
    expect(isCommercialSketchfabLicense({ slug: "by" })).toBe(true);
  });

  it("rejects licenses outside Housora's allowlist", () => {
    expect(isCommercialSketchfabLicense({ slug: "by-nc" })).toBe(false);
    expect(isCommercialSketchfabLicense("editorial")).toBe(false);
  });
});

describe("CubiCasa ticket validation", () => {
  const valid = {
    sourceUrls: ["https://uploads.example.com/scan.zip"],
    webhookUrl: "https://housora.example.com/api/cubicasa/webhook",
    externalId: "project_123",
    formattedAddress: "1 Example Street, Casablanca, Morocco",
  };

  it("accepts an SDK scan ZIP workflow", () => {
    expect(() => validateCubiCasaTicket(valid)).not.toThrow();
  });

  it("rejects ordinary local files and missing webhook data", () => {
    expect(() => validateCubiCasaTicket({ ...valid, sourceUrls: ["file:///room.jpg"] })).toThrow(/HTTPS URLs/);
    expect(() => validateCubiCasaTicket({ ...valid, webhookUrl: "" })).toThrow(/webhook/);
  });
});
