// CubiCasa API — async job: upload photos → poll → retrieve floor plan
// Docs: cubi.casa/developers — may use API_KEY (x-api-key) or OAuth client_id/secret. We support both.

const CUBI_BASE = "https://api.cubicasa.com/v3";

function authHeaders(): Record<string, string> {
  const key = process.env.CUBICASA_API_KEY;
  const id = process.env.CUBICASA_CLIENT_ID;
  const secret = process.env.CUBICASA_CLIENT_SECRET;
  if (key) return { "x-api-key": key, "Content-Type": "application/json" };
  if (id && secret) {
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    return { Authorization: `Basic ${basic}`, "Content-Type": "application/json" };
  }
  throw new Error("CUBICASA_API_KEY or CUBICASA_CLIENT_ID/SECRET not configured");
}

export async function createCubiCasaJob(photoUrls: string[], roomName?: string) {
  const res = await fetch(`${CUBI_BASE}/scans`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ photos: photoUrls.map((url) => ({ url })), name: roomName || "Housora scan" }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `CubiCasa create failed ${res.status}`);
  return { jobId: data.id || data.scan_id || data.job_id, raw: data };
}

export async function getCubiCasaJob(jobId: string) {
  const res = await fetch(`${CUBI_BASE}/scans/${encodeURIComponent(jobId)}`, {
    headers: authHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `CubiCasa poll failed ${res.status}`);
  // Normalize status
  const statusRaw = (data.status || data.state || "").toLowerCase();
  let status: "queued" | "processing" | "success" | "failed" = "processing";
  if (["completed", "success", "done"].includes(statusRaw)) status = "success";
  else if (["failed", "error"].includes(statusRaw)) status = "failed";
  else if (["queued", "pending"].includes(statusRaw)) status = "queued";
  return { status, walls: data.walls || data.floorplan?.walls, doors: data.doors, windows: data.windows, dimensions: data.dimensions || data.measurements, planUrl: data.download_url || data.result_url, raw: data };
}
