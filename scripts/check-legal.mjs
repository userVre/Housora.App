const required = ["HOUSORA_LEGAL_NAME", "HOUSORA_LEGAL_ADDRESS", "HOUSORA_SUPPORT_EMAIL", "HOUSORA_PRIVACY_EMAIL", "HOUSORA_JURISDICTION"];
const missing = required.filter(name => !process.env[name]?.trim());
if (process.env.HOUSORA_LEGAL_REVIEWED !== "true") missing.push("HOUSORA_LEGAL_REVIEWED=true");
const staleTerms = ["fal.ai", "OpenRouter", "Microsoft model infrastructure", "masked session replay"];
const { readFile } = await import("node:fs/promises");
const sources = await Promise.all(["components/legal-page.tsx", "PRIVACY_POLICY.md", "TERMS_OF_SERVICE.md"].map(path => readFile(new URL(`../${path}`, import.meta.url), "utf8")));
const stale = staleTerms.filter(term => sources.some(source => source.toLowerCase().includes(term.toLowerCase())));
if (stale.length) {
  console.error(`Legal copy still names removed behavior/providers: ${stale.join(", ")}`);
  process.exit(1);
}
if (missing.length) {
  console.error(`Missing required legal environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("Legal readiness check passed.");
