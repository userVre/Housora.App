"use client";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import type { DetectedObject } from "../lib/ai-costs";
export function RecentAiTasks({ onOpen }: { onOpen: (image: string, objects?: DetectedObject[], mode?: string) => void }) {
  const jobs = useQuery(api.jobs.listRecent, { limit: 8 });
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  if (!jobs?.length) return null;
  return <section className="recent-ai-tasks" aria-label="Recent AI tasks">
    <h2>Recent tasks</h2><p>Opening an existing result does not use credits.</p>
    <ul>{jobs.map(job => <li key={job._id}>
      <span><strong>{job.type === "segment" ? "Object detection" : job.type === "edit" ? "Image edit" : "3D model"}</strong><small>{job.status === "success" ? "Ready" : job.status === "failed" ? "Could not complete" : "Processing"} · {new Date(job.createdAt).toLocaleString()}</small></span>
      {job.status === "success" && job.result?.payloadUrl ? <button disabled={opening !== null} onClick={async () => {
        setOpening(job.requestId); setError("");
        try {
          const response = await fetch(`/api/ai/jobs?requestId=${encodeURIComponent(job.requestId)}`, { cache: "no-store" });
          const body = await response.json();
          if (!response.ok || !body.result) throw new Error("The result could not be opened. Try again shortly.");
          const image = body.result.image || job.inputImage;
          if (!image) throw new Error("This task has no saved image.");
          onOpen(image, body.result.objects, job.mode);
        } catch (e) { setError(e instanceof Error ? e.message : "Could not open result."); }
        finally { setOpening(null); }
      }}>{opening === job.requestId ? "Opening…" : "Open result"}</button> : null}
    </li>)}</ul>{error ? <p role="alert">{error}</p> : null}
  </section>;
}
