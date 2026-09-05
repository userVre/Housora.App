export const REQUIRED_LEGAL_ENV = [
  "HOUSORA_LEGAL_NAME",
  "HOUSORA_LEGAL_ADDRESS",
  "HOUSORA_SUPPORT_EMAIL",
  "HOUSORA_PRIVACY_EMAIL",
  "HOUSORA_JURISDICTION",
] as const;

export type LegalConfig = {
  legalName?: string;
  legalAddress?: string;
  supportEmail?: string;
  privacyEmail?: string;
  jurisdiction?: string;
  salesGeo?: string;
  missing: string[];
  ready: boolean;
};

export function getLegalConfig(): LegalConfig {
  const missing = REQUIRED_LEGAL_ENV.filter(name => !process.env[name]?.trim());
  return {
    legalName: process.env.HOUSORA_LEGAL_NAME?.trim(),
    legalAddress: process.env.HOUSORA_LEGAL_ADDRESS?.trim(),
    supportEmail: process.env.HOUSORA_SUPPORT_EMAIL?.trim(),
    privacyEmail: process.env.HOUSORA_PRIVACY_EMAIL?.trim(),
    jurisdiction: process.env.HOUSORA_JURISDICTION?.trim(),
    salesGeo: process.env.HOUSORA_SALES_GEO?.trim(),
    missing: [...missing],
    ready: missing.length === 0,
  };
}
