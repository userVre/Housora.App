// CubiCasa Conversion API. It accepts ZIP scan sources produced by the CubiCasa
// Mobile SDK; ordinary room photos are intentionally not accepted here.

const CUBI_BASE = process.env.CUBICASA_API_BASE || "https://api.cubi.casa/conversion";

function authHeaders(): Record<string, string> {
  const key = process.env.CUBICASA_API_KEY;
  if (key) return { "x-api-key": key, "Content-Type": "application/json" };
  throw new Error("CUBICASA_API_KEY is not configured");
}

export type CubiCasaTicketInput = {
  sourceUrls: string[];
  webhookUrl: string;
  externalId: string;
  formattedAddress: string;
  suite?: string;
  notes?: string;
  priority?: "normal" | "fast";
};

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validateCubiCasaTicket(input: CubiCasaTicketInput) {
  if (!input.sourceUrls?.length || input.sourceUrls.length > 10 || input.sourceUrls.some((url) => !isHttpsUrl(url))) {
    throw new Error("CubiCasa requires 1-10 public HTTPS URLs for Mobile SDK scan ZIP files.");
  }
  if (!isHttpsUrl(input.webhookUrl)) throw new Error("A public HTTPS webhook URL is required.");
  if (!input.externalId?.trim() || input.externalId.length > 120) throw new Error("A valid external project ID is required.");
  if (!input.formattedAddress?.trim() || input.formattedAddress.length > 300) throw new Error("A scan address is required.");
}

export async function createCubiCasaTicket(input: CubiCasaTicketInput) {
  validateCubiCasaTicket(input);
  const res = await fetch(`${CUBI_BASE}/ticket`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      conversion_type: "t3",
      priority: input.priority || "normal",
      webhook_url: input.webhookUrl,
      source_url: input.sourceUrls,
      external_id: input.externalId,
      address: { formatted_address: input.formattedAddress, ...(input.suite ? { suite: input.suite } : {}) },
      ...(input.notes ? { customer_info: { text: input.notes } } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || `CubiCasa create failed ${res.status}`);
  if (!data?.id) throw new Error("CubiCasa did not return a ticket ID.");
  return { ticketId: data.id as string };
}
