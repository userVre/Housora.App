export const REQUIRED_LEGAL_ENV = [
  "HOUSORA_LEGAL_NAME",
  "HOUSORA_LEGAL_ADDRESS",
  "HOUSORA_SUPPORT_EMAIL",
  "HOUSORA_PRIVACY_EMAIL",
  "HOUSORA_JURISDICTION",
] as const;
export const LEGAL_ENV_LABELS: Record<(typeof REQUIRED_LEGAL_ENV)[number], string> = {
  HOUSORA_LEGAL_NAME: "legal entity name",
  HOUSORA_LEGAL_ADDRESS: "registered address",
  HOUSORA_SUPPORT_EMAIL: "support contact email",
  HOUSORA_PRIVACY_EMAIL: "privacy contact email",
  HOUSORA_JURISDICTION: "governing jurisdiction",
};
export type LegalConfig = {
  legalName?: string;
  legalAddress?: string;
  supportEmail?: string;
  privacyEmail?: string;
  jurisdiction?: string;
  salesGeo?: string;
  reviewed: boolean;
  missing: string[];
  ready: boolean;
};
export function getLegalConfig(): LegalConfig {
  const missing = REQUIRED_LEGAL_ENV.filter(name => !process.env[name]?.trim());
  const reviewed = process.env.HOUSORA_LEGAL_REVIEWED === "true";
  return {
    legalName: process.env.HOUSORA_LEGAL_NAME?.trim(),
    legalAddress: process.env.HOUSORA_LEGAL_ADDRESS?.trim(),
    supportEmail: process.env.HOUSORA_SUPPORT_EMAIL?.trim(),
    privacyEmail: process.env.HOUSORA_PRIVACY_EMAIL?.trim(),
    jurisdiction: process.env.HOUSORA_JURISDICTION?.trim(),
    salesGeo: process.env.HOUSORA_SALES_GEO?.trim(),
    reviewed,
    missing: [...missing],
    ready: missing.length === 0 && reviewed,
  };
}
