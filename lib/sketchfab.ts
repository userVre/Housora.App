const BASE = "https://api.sketchfab.com/v3";

function token() {
  const t = process.env.SKETCHFAB_API_TOKEN;
  if (!t) throw new Error("SKETCHFAB_API_TOKEN not configured");
  return t;
}

// Commercial-usable licenses per Sketchfab guidelines: CC0, CC-BY are safest; CC-BY-SA/ND often not commercial. We filter to CC0/CC-BY by default.
const COMMERCIAL_LICENSES = ["CC0", "CC-BY"];

export type SketchfabModel = {
  uid: string; name: string; thumbnail: string; license: string; categories: string[]; user: string;
};

export async function searchSketchfab(q: string, opts?: { category?: string; style?: string; licenses?: string[]; cursor?: string }) {
  const licenses = (opts?.licenses || COMMERCIAL_LICENSES).join(",");
  const params = new URLSearchParams({
    type: "models",
    q: [q, opts?.category, opts?.style].filter(Boolean).join(" "),
    licenses,
    downloadable: "true",
    sort_by: "-relevance",
    count: "24",
  });
  if (opts?.cursor) params.set("cursor", opts.cursor);
  const res = await fetch(`${BASE}/search?${params}`, {
    headers: { Authorization: `Token ${token()}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || `Sketchfab search failed ${res.status}`);
  const results: SketchfabModel[] = (data.results || []).map((r: any) => ({
    uid: r.uid,
    name: r.name,
    thumbnail: r.thumbnails?.images?.[0]?.url || r.thumbnails?.images?.[0]?.url || "",
    license: r.license?.label || r.license || "unknown",
    categories: r.categories?.map((c: any) => c.name) || [],
    user: r.user?.username || "",
  }));
  return { models: results, nextCursor: data.cursors?.next || null };
}

export async function getSketchfabModel(uid: string) {
  const res = await fetch(`${BASE}/models/${uid}`, {
    headers: { Authorization: `Token ${token()}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || `Sketchfab fetch failed ${res.status}`);
  return data;
}
