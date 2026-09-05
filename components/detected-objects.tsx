"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Box as Cube, Search as MagnifyingGlass, ArrowRight, Upload as UploadSimple } from "lucide-react";
import { AI_COSTS, type DetectedObject } from "../lib/ai-costs";
import { prepareImage } from "../lib/prepare-image";
import { smoothMask } from "../lib/mask-postprocess";
import { readAiResponse } from "../lib/await-ai-response";
import { CreditConfirmation } from "./credit-confirmation";

function safeUUID() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DetectedObjects({ hasImage, mode, image, onUpload, onImageChange, active = true, onSelect, onCreate3d, initialObjects }: {
  initialObjects?: DetectedObject[];
  hasImage: boolean; mode: "Interior" | "Exterior" | "Garden"; image: string;
  onUpload: () => void; onImageChange?: (image: string, storageWarning?: string) => void; active?: boolean;
  onSelect?: (object: DetectedObject | null) => void;
  onCreate3d?: (object: DetectedObject) => void;
}) {
  const [objects, setObjects] = useState<DetectedObject[]>(initialObjects || []);
  const [selected, setSelected] = useState<DetectedObject | null>(null);
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState<"idle" | "detecting" | "ready" | "editing" | "error">("idle");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<"detect" | "edit" | null>(null);
  const prompted = useRef(Boolean(initialObjects));
  const inFlight = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (active && hasImage && !prompted.current) {
      prompted.current = true;
      setConfirmation("detect");
    }
  }, [active, hasImage]);

  const detect = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setConfirmation(null);
    setStatus("detecting");
    setError("");
    try {
      const pixels = await prepareImage(image);
      const response = await fetch("/api/ai/segment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: pixels, autoDetect: true, mode, confirmed: true, requestId: safeUUID() }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok) throw new Error(result.error || "Detection failed. Please try again.");
      if (!Array.isArray(result.objects)) throw new Error("Detection returned an invalid result. Contact support.");
      if (!alive.current) return;
      // Post-process SAM masks: smooth edges + feather for clean edits on messy photos
      let processed = result.objects as DetectedObject[];
      try {
        processed = await Promise.all(
          processed.map(async (o) => {
            try {
              const smoothed = await smoothMask(o.mask, { feather: 1.6, closeRadius: 2 });
              return { ...o, mask: smoothed };
            } catch {
              return o;
            }
          }),
        );
      } catch {}
      if (!alive.current) return;
      setObjects(processed);
      setSelected(null);
      onSelect?.(null);
      setStatus("ready");
    } catch (reason) {
      const raw = reason instanceof Error ? reason.message : "Detection failed.";
      const friendly = raw.includes("temporarily unavailable") || raw.includes("not configured")
        ? "Object detection is temporarily unavailable. Your credits were not charged. Please save your design and try again later."
        : raw;
      if (alive.current) { setError(friendly); setStatus("error"); }
    } finally { inFlight.current = false; }
  };

  const edit = async () => {
    if (!selected || !instruction.trim() || inFlight.current) return;
    inFlight.current = true;
    setConfirmation(null);
    setStatus("editing");
    setError("");
    try {
      const pixels = await prepareImage(image);
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: pixels,
          mask: selected.mask,
          prompt: `Edit only the ${selected.label} inside the normalized bounding box ${JSON.stringify(selected.box)}: ${instruction.trim()}. Preserve other objects, room architecture, perspective and lighting.`,
          requestId: safeUUID(),
          confirmed: true,
        }),
        signal: AbortSignal.timeout(295_000),
      });
      const result = await readAiResponse(response);
      if (!response.ok || !result.image) throw new Error(result.error || "Image editing failed.");
      if (!alive.current) return;
      onImageChange?.(result.image, result.storageWarning);
      setSelected(null);
      setObjects([]);
      onSelect?.(null);
      setInstruction("");
      setStatus("ready");
    } catch (reason) {
      if (alive.current) { setError(reason instanceof Error ? reason.message : "Image editing failed."); setStatus("ready"); }
    } finally { inFlight.current = false; }
  };
  const busy = status === "detecting" || status === "editing";
  const isServiceUnavailable = error.includes("temporarily unavailable");
  if (!hasImage) return <div className="objects-empty"><MagnifyingGlass /><h3>Start with your photo</h3><p>Detect real objects, then choose what to edit.</p><button onClick={onUpload}><UploadSimple /> Upload a photo</button></div>;
  return <div className="real-objects-panel">
    <button className="source-layer" onClick={onUpload} disabled={busy}><span><Image src={image} alt="" fill sizes="48px" unoptimized /></span><div><b>Current image</b><small>Replace source photo</small></div><UploadSimple /></button>
    {isServiceUnavailable ? <div className="service-notice" role="status"><b>Object detection is unavailable</b><p>Your photo is safe and no detection credit was charged. You can retry later or continue generating, saving and using 3D.</p></div> : null}
    <div className="real-objects-heading"><h3>Detected objects {objects.length > 0 ? <span>{objects.length}</span> : null}</h3>
      {objects.length > 0 ? <button disabled={busy || isServiceUnavailable} onClick={() => setConfirmation("detect")}>Scan again</button> : null}</div>
    {status === "detecting" ? <div className="objects-empty" role="status"><span className="spinner" /><h3>Finding objects in your photo…</h3><p>The first scan can take a few minutes while the model starts. Keep this workspace open.</p></div> : objects.length === 0 ?
      <div className="objects-empty"><MagnifyingGlass /><h3>{status === "error" && isServiceUnavailable ? "Detection offline" : status === "ready" ? "No objects found" : "Detect objects to start editing"}</h3><p>{status === "error" && isServiceUnavailable ? "Object detection will be available soon. Your work is safe — generate or save in the meantime." : status === "ready" ? "No credits were kept. Try a clearer photo with visible furniture or surfaces." : "Scan this photo for furniture and surfaces. Only actual detections will appear here."}</p><button disabled={busy || isServiceUnavailable} onClick={() => setConfirmation("detect")}>Auto-detect · {AI_COSTS.detection} credit</button>{isServiceUnavailable ? <small className="service-hint">No credits charged while offline</small> : null}</div> :
      <div className="real-object-list" aria-label="Objects detected in this photo">{objects.map((object, index) => <button key={object.id} disabled={busy} aria-pressed={selected?.id === object.id} onClick={() => { setSelected(object); onSelect?.(object); }}>
        <span className="real-object-thumb"><Image src={object.thumbnail} alt="" fill sizes="56px" unoptimized /></span><span><b>{object.label}</b><small>Object {index + 1} · {Math.round(object.score * 100)}% confidence</small></span><ArrowRight />
      </button>)}</div>}
    {selected ? <section className="real-object-actions"><h4>Selected: {selected.label}</h4>
      {onCreate3d ? <button className="object-3d-action" disabled={busy} onClick={() => onCreate3d(selected)}><Cube /><span><b>Create 3D from this object</b><small>{AI_COSTS.model3d} credits · confirmation required</small></span><ArrowRight /></button> : null}
      {onImageChange ? <><label htmlFor="object-edit-instruction">Describe your change</label><textarea id="object-edit-instruction" style={{ resize: "none" }} value={instruction} disabled={busy} onChange={e => setInstruction(e.target.value)} placeholder={`For example: make this ${selected.label} sage green`} /><button className="primary-action" disabled={busy || !instruction.trim()} onClick={() => setConfirmation("edit")}>{status === "editing" ? "Editing…" : `Edit object · ${AI_COSTS.imageEdit} credits`}</button><small>AI edits may affect nearby details. Review the result.</small></> : null}
    </section> : null}
    {error && !isServiceUnavailable ? <p className="integration-error" role="alert">{error}</p> : null}
    <CreditConfirmation open={active && confirmation !== null} cost={confirmation === "edit" ? AI_COSTS.imageEdit : AI_COSTS.detection}
      title={confirmation === "edit" ? `Edit ${selected?.label || "object"}?` : "Detect objects in this photo?"}
      description={confirmation === "edit" ? "Send your photo and instruction for an AI edit. This uses the existing detection, with no extra scanning charge." : "Send this photo to SAM to find furniture and surfaces. Failed or empty scans return the detection credit."}
      action={confirmation === "edit" ? "Edit object" : "Detect objects"} onCancel={() => setConfirmation(null)} onConfirm={() => void (confirmation === "edit" ? edit() : detect())} />
  </div>;
}
