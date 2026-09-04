import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  let project: { name: string; rooms: { name: string; image: string | null }[] } | null = null;
  let unavailable = !url;
  if (url) {
    try { project = await new ConvexHttpClient(url).query(api.collab.getSharedProject, { token }); }
    catch { unavailable = true; }
  }
  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px" }}>
    <a href="/" aria-label="Housora home">Housora</a>
    <h1>{project?.name || (unavailable ? "Project preview unavailable" : "This link is no longer available")}</h1>
    {!project ? <p>{unavailable ? "Please try again shortly." : "The link may have expired or been revoked. Ask the project owner for a new link."}</p> : <>
      <p>Shared project preview · Read only</p>
      {project.rooms.length === 0 && <p>No saved designs are available in this project yet.</p>}
      {project.rooms.map((room, index) => <section key={index} style={{ marginTop: 32 }}>
        <h2>{room.name}</h2>
        {room.image ? <img src={room.image} alt={`Saved design for ${room.name}`} style={{ width: "100%", borderRadius: 16 }} /> : <p>No saved image yet.</p>}
      </section>)}
    </>}
  </main>;
}
