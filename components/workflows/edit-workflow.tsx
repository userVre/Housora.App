"use client";

import "../../app/workflows/edit-workflow.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload as UploadSimple } from "lucide-react";
import { maskLuminanceToAlpha } from "../../lib/mask-alpha";

export type DetectedObject = {
  id: string;
  label: string;
  score: number;
  box: [number, number, number, number];
  mask: string;
  thumbnail: string;
};

export type EditTool = "select" | "spotlight" | "draw" | "reframe";

export type EditWorkflowProps = {
  /** Current source image data URL or remote URL. Null shows empty state. */
  image: string | null;
  /** Real segmentation results only — no fake placeholders. */
  detectedObjects: DetectedObject[];
  /** Controlled selected id. If omitted, component manages selection internally but still notifies onSelectObject. */
  selectedObjectId?: string | null;
  /** Notify parent when a row or canvas highlight is chosen. */
  onSelectObject?: (object: DetectedObject | null) => void;
  /** Replace image trigger (opens file picker in parent). */
  onReplaceImage?: () => void;
  /** Direct file upload for empty state drag-and-drop (large dropzone). */
  onUpload?: (file: File) => void;
  /** Scan again — parent performs real /api/ai/segment call. */
  onScan?: () => void | Promise<void>;
  isScanning?: boolean;
  scanError?: string | null;
  /** Active canvas tool. */
  activeTool?: EditTool;
  onActiveToolChange?: (tool: EditTool) => void;
  /** Controlled instruction for selected-object edit. */
  instruction?: string;
  onInstructionChange?: (value: string) => void;
  /** Edit the selected object. Parent must call /api/ai/edit with { image, mask, prompt } and preserve outside-mask pixels. */
  onEditObject?: (payload: { object: DetectedObject; instruction: string }) => void | Promise<void>;
  /** Create 3D from the actual detected crop. Must receive cropDataUrl — no auto-generation on select. */
  onCreate3D?: (payload: { object: DetectedObject; cropDataUrl: string }) => void | Promise<void>;
  /** Spotlight rectangle edit — mask is white rect on black, same contract as object edit. */
  onSpotlightEdit?: (payload: { image: string; mask: string; prompt: string }) => void | Promise<void>;
  /** Draw mask edit — mask is stroked path on black. */
  onDrawEdit?: (payload: { image: string; mask: string; prompt: string }) => void | Promise<void>;
  /** Unified region edit fallback if parent uses one handler. */
  onRegionEdit?: (payload: { image: string; mask: string; prompt: string; tool: "spotlight" | "draw" }) => void | Promise<void>;
  /** Reframe — parent preserves composition, no fake result. */
  onReframe?: (payload: { image: string; aspectRatio: string }) => void | Promise<void>;
  /** Region prompt (spotlight/draw). Controlled if provided. */
  regionPrompt?: string;
  onRegionPromptChange?: (value: string) => void;
  /** Version history image URLs. */
  history?: string[];
  historyIndex?: number;
  onSelectHistory?: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isEditing?: boolean;
  editError?: string | null;
  onFullscreen?: () => void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image could not be loaded"));
    img.src = src;
  });
}

async function buildCropDataUrl(imageSrc: string, box: [number, number, number, number], maskSrc?: string): Promise<string> {
  const [img, maskImg] = await Promise.all([loadImage(imageSrc), maskSrc ? loadImage(maskSrc) : Promise.resolve(null)]);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const x0 = Math.max(0, Math.min(1, box[0]));
  const y0 = Math.max(0, Math.min(1, box[1]));
  const x1 = Math.max(0, Math.min(1, box[2]));
  const y1 = Math.max(0, Math.min(1, box[3]));
  const sx = Math.round(x0 * w);
  const sy = Math.round(y0 * h);
  const sw = Math.max(1, Math.round((x1 - x0) * w));
  const sh = Math.max(1, Math.round((y1 - y0) * h));
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  // Draw cropped image
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  // If mask is provided, apply it to create transparent background outside the object
  if (maskImg) {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = sw;
    maskCanvas.height = sh;
    const mCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!mCtx) throw new Error("Mask canvas unavailable");
    mCtx.drawImage(maskImg, sx, sy, sw, sh, 0, 0, sw, sh);
    const maskPixels = mCtx.getImageData(0, 0, sw, sh);
    maskLuminanceToAlpha(maskPixels.data);
    mCtx.putImageData(maskPixels, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }
  return canvas.toDataURL("image/png");
}

async function buildMaskDataUrl(
  imageSrc: string,
  mode: "spotlight" | "draw",
  region: { x: number; y: number; width: number; height: number } | null,
  points: Array<{ x: number; y: number }>,
): Promise<string> {
  const img = await loadImage(imageSrc);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (mode === "spotlight" && region && region.width > 0.5 && region.height > 0.5) {
    const x = (region.x / 100) * w;
    const y = (region.y / 100) * h;
    const rw = (region.width / 100) * w;
    const rh = (region.height / 100) * h;
    ctx.fillRect(x, y, rw, rh);
  } else if (mode === "draw" && points.length > 1) {
    const lineW = Math.max(14, Math.min(w, h) * 0.04);
    ctx.lineWidth = lineW;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  } else {
    throw new Error(mode === "spotlight" ? "Drag to spotlight a region first." : "Draw over the area you want to change first.");
  }
  return canvas.toDataURL("image/png");
}

export function EditWorkflow(props: EditWorkflowProps) {
  const {
    image,
    detectedObjects,
    selectedObjectId: controlledSelectedId,
    onSelectObject,
    onReplaceImage,
    onUpload,
    onScan,
    isScanning,
    scanError,
    activeTool: controlledTool,
    onActiveToolChange,
    instruction: controlledInstruction,
    onInstructionChange,
    onEditObject,
    onCreate3D,
    onSpotlightEdit,
    onDrawEdit,
    onRegionEdit,
    onReframe,
    regionPrompt: controlledRegionPrompt,
    onRegionPromptChange,
    history,
    historyIndex,
    onSelectHistory,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isEditing,
    editError,
    onFullscreen,
  } = props;

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const selectedObject = useMemo(
    () => detectedObjects.find((o) => o.id === selectedId) ?? null,
    [detectedObjects, selectedId],
  );

  const [internalTool, setInternalTool] = useState<EditTool>("select");
  const activeTool: EditTool = controlledTool ?? internalTool;
  const setActiveTool = useCallback(
    (t: EditTool) => {
      if (onActiveToolChange) onActiveToolChange(t);
      else setInternalTool(t);
    },
    [onActiveToolChange],
  );

  const [internalInstruction, setInternalInstruction] = useState("");
  const instruction = controlledInstruction ?? internalInstruction;
  const setInstruction = useCallback(
    (v: string) => {
      if (onInstructionChange) onInstructionChange(v);
      else setInternalInstruction(v);
    },
    [onInstructionChange],
  );

  const [internalRegionPrompt, setInternalRegionPrompt] = useState("");
  const regionPrompt = controlledRegionPrompt ?? internalRegionPrompt;
  const setRegionPrompt = useCallback(
    (v: string) => {
      if (onRegionPromptChange) onRegionPromptChange(v);
      else setInternalRegionPrompt(v);
    },
    [onRegionPromptChange],
  );

  const [spotlightRegion, setSpotlightRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [drawPoints, setDrawPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [reframeRatio, setReframeRatio] = useState<string>("auto");
  const [localError, setLocalError] = useState("");
  const [emptyDragging, setEmptyDragging] = useState(false);
  const emptyFileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);

  // Keep selected valid when objects change
  useEffect(() => {
    if (selectedId && !detectedObjects.some((o) => o.id === selectedId)) {
      if (controlledSelectedId === undefined) setInternalSelectedId(null);
      onSelectObject?.(null);
    }
  }, [detectedObjects, selectedId, controlledSelectedId, onSelectObject]);

  // Keyboard shortcuts V S D R when canvas focused or global when image exists
  useEffect(() => {
    if (!image) return;
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const map: Record<string, EditTool> = { v: "select", s: "spotlight", d: "draw", r: "reframe" };
      if (map[k]) {
        e.preventDefault();
        setActiveTool(map[k]);
        if (map[k] === "spotlight") setDrawPoints([]);
        if (map[k] === "draw") setSpotlightRegion(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [image, setActiveTool]);

  const selectObject = useCallback(
    (obj: DetectedObject | null) => {
      if (controlledSelectedId === undefined) setInternalSelectedId(obj?.id ?? null);
      onSelectObject?.(obj);
      if (obj) setActiveTool("select");
    },
    [controlledSelectedId, onSelectObject, setActiveTool],
  );

  const canvasPoint = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!image) return;
      if (activeTool === "spotlight" || activeTool === "draw") {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const p = canvasPoint(e);
        gestureStart.current = p;
        if (activeTool === "spotlight") setSpotlightRegion({ x: p.x, y: p.y, width: 0, height: 0 });
        else setDrawPoints([p]);
      }
    },
    [activeTool, canvasPoint, image],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!gestureStart.current) return;
      const p = canvasPoint(e);
      if (activeTool === "spotlight") {
        const s = gestureStart.current;
        setSpotlightRegion({
          x: Math.min(s.x, p.x),
          y: Math.min(s.y, p.y),
          width: Math.abs(p.x - s.x),
          height: Math.abs(p.y - s.y),
        });
      } else if (activeTool === "draw") {
        setDrawPoints((prev) => [...prev, p]);
      }
    },
    [activeTool, canvasPoint],
  );

  const onPointerUp = useCallback(() => {
    gestureStart.current = null;
  }, []);

  const handleCreate3D = useCallback(async () => {
    if (!selectedObject || !image || !onCreate3D) return;
    setLocalError("");
    try {
      const crop = await buildCropDataUrl(image, selectedObject.box, selectedObject.mask);
      await onCreate3D({ object: selectedObject, cropDataUrl: crop });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not create crop");
    }
  }, [image, onCreate3D, selectedObject]);

  const handleObjectEdit = useCallback(async () => {
    if (!selectedObject || !instruction.trim() || !onEditObject) return;
    setLocalError("");
    try {
      await onEditObject({ object: selectedObject, instruction: instruction.trim() });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Edit failed");
    }
  }, [instruction, onEditObject, selectedObject]);

  const handleRegionEdit = useCallback(async () => {
    if (!image || !regionPrompt.trim()) return;
    setLocalError("");
    const tool = activeTool === "spotlight" ? "spotlight" : "draw";
    try {
      const mask = await buildMaskDataUrl(image, tool, spotlightRegion, drawPoints);
      if (onRegionEdit) await onRegionEdit({ image, mask, prompt: regionPrompt.trim(), tool });
      else if (tool === "spotlight" && onSpotlightEdit) await onSpotlightEdit({ image, mask, prompt: regionPrompt.trim() });
      else if (tool === "draw" && onDrawEdit) await onDrawEdit({ image, mask, prompt: regionPrompt.trim() });
      else {
        // No handler — surface error without fake result
        throw new Error("Region edit handler not configured");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Region edit failed");
    }
  }, [activeTool, drawPoints, image, onDrawEdit, onRegionEdit, onSpotlightEdit, regionPrompt, spotlightRegion]);

  const handleReframe = useCallback(async () => {
    if (!image || !onReframe) return;
    setLocalError("");
    try {
      await onReframe({ image, aspectRatio: reframeRatio });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Reframe failed");
    }
  }, [image, onReframe, reframeRatio]);

  const requestFullscreen = useCallback(() => {
    if (onFullscreen) onFullscreen();
    else void wrapRef.current?.requestFullscreen().catch(() => {});
  }, [onFullscreen]);

  const canApplySpotlight = Boolean(spotlightRegion && spotlightRegion.width > 1 && spotlightRegion.height > 1 && regionPrompt.trim());
  const canApplyDraw = drawPoints.length > 2 && Boolean(regionPrompt.trim());

  return (
    <section className="edit-workflow" aria-label="Edit workflow">
      <div className="edit-workflow-canvas">
        <div className="edit-workflow-canvas-inner">
          <div
            ref={wrapRef}
            className={`edit-workflow-image-wrap${!image ? " is-empty" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Edit canvas"
          >
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Current project space" />
                {/* Real mask overlay for selected object — full-image mask, not box crop */}
                {selectedObject && activeTool === "select" ? (
                  <>
                    <span className="ew-mask-layer" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedObject.mask} alt="" />
                    </span>
                    <button
                      type="button"
                      className="ew-box"
                      style={{
                        left: `${selectedObject.box[0] * 100}%`,
                        top: `${selectedObject.box[1] * 100}%`,
                        width: `${(selectedObject.box[2] - selectedObject.box[0]) * 100}%`,
                        height: `${(selectedObject.box[3] - selectedObject.box[1]) * 100}%`,
                      }}
                      aria-label={`Selected ${selectedObject.label} — click to focus row`}
                      onClick={() => selectObject(selectedObject)}
                    >
                      <span className="ew-box-label">{selectedObject.label}</span>
                    </button>
                  </>
                ) : null}
                {/* Inactive object boxes are not rendered — only selected highlight. If you need hover boxes, render them as non-interactive outlines separately. */}
                {activeTool === "spotlight" && spotlightRegion ? (
                  <span
                    className="ew-spotlight-rect"
                    style={{
                      left: `${spotlightRegion.x}%`,
                      top: `${spotlightRegion.y}%`,
                      width: `${spotlightRegion.width}%`,
                      height: `${spotlightRegion.height}%`,
                    }}
                    aria-label="Spotlight region"
                  />
                ) : null}
                {activeTool === "draw" && drawPoints.length > 1 ? (
                  <svg className="ew-draw-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline points={drawPoints.map((p) => `${p.x},${p.y}`).join(" ")} />
                  </svg>
                ) : null}
                {activeTool === "reframe" ? <span className="ew-reframe-frame" aria-label="Reframe preview frame" /> : null}
                {/* Clickable hit areas for all detected objects when in select mode and none selected — enables row sync */}
                {activeTool === "select" && !selectedObject
                  ? detectedObjects.map((obj) => (
                      <button
                        key={`hit-${obj.id}`}
                        type="button"
                        className="ew-box"
                        style={{
                          left: `${obj.box[0] * 100}%`,
                          top: `${obj.box[1] * 100}%`,
                          width: `${(obj.box[2] - obj.box[0]) * 100}%`,
                          height: `${(obj.box[3] - obj.box[1]) * 100}%`,
                          opacity: 0.001,
                          borderColor: "transparent",
                          background: "transparent",
                        }}
                        aria-label={`Select ${obj.label}`}
                        onClick={() => selectObject(obj)}
                      />
                    ))
                  : null}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`edit-workflow-empty-dropzone${emptyDragging ? " is-dragging" : ""}`}
                  onClick={() => (onUpload ? emptyFileRef.current?.click() : onReplaceImage?.())}
                  onDragEnter={(e) => { e.preventDefault(); setEmptyDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setEmptyDragging(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setEmptyDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (!f) return;
                    if (onUpload) onUpload(f);
                    else onReplaceImage?.();
                  }}
                  aria-label="Upload a photo for precise editing"
                >
                  <UploadSimple aria-hidden style={{ width: 28, height: 28, color: "#ffad6d" }} />
                  <b>Drag a photo here</b>
                  <span>or click to browse — start precise editing</span>
                  <small>JPG, PNG or WEBP · Up to 10 MB</small>
                </button>
                <input
                  ref={emptyFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="visually-hidden"
                  aria-label="Choose a photo for editing"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUpload) onUpload(f);
                    else if (f) onReplaceImage?.();
                    e.currentTarget.value = "";
                  }}
                />
              </>
            )}
          </div>

          <div className="edit-workflow-toolbar" role="toolbar" aria-label="Edit tools">
            <button
              type="button"
              aria-pressed={activeTool === "select"}
              onClick={() => setActiveTool("select")}
              title="Select (V)"
              aria-label="Select tool"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 4l7 14 2-5 5-2z" />
              </svg>
              <span>Select</span>
              <kbd>V</kbd>
            </button>
            <button
              type="button"
              aria-pressed={activeTool === "spotlight"}
              onClick={() => {
                setActiveTool("spotlight");
                setDrawPoints([]);
              }}
              title="Spotlight (S)"
              aria-label="Spotlight tool"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 12h8M12 8v8" />
              </svg>
              <span>Spotlight</span>
              <kbd>S</kbd>
            </button>
            <button
              type="button"
              aria-pressed={activeTool === "draw"}
              onClick={() => {
                setActiveTool("draw");
                setSpotlightRegion(null);
              }}
              title="Draw (D)"
              aria-label="Draw tool"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 17c3-1 6-4 8-8l3-3 4 4-3 3c-4 2-7 5-8 8z" />
              </svg>
              <span>Draw</span>
              <kbd>D</kbd>
            </button>
            <button
              type="button"
              aria-pressed={activeTool === "reframe"}
              onClick={() => setActiveTool("reframe")}
              title="Reframe (R)"
              aria-label="Reframe tool"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4" />
              </svg>
              <span>Reframe</span>
              <kbd>R</kbd>
            </button>
            <span className="ew-toolbar-sep" aria-hidden="true" />
            <button type="button" onClick={requestFullscreen} aria-label="Full screen" title="Full screen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
              <span>Full screen</span>
            </button>
          </div>
          {localError || editError || scanError ? (
            <p className="ew-error" role="alert">
              {localError || editError || scanError}
            </p>
          ) : null}
        </div>
      </div>

      <aside className="edit-workflow-inspector" aria-label="Edit inspector">
        <div className="ew-inspector-scroll">
          {/* 1. Objects & regions */}
          <header className="ew-inspector-title">
            <b>Objects &amp; regions</b>
            <small>Select a detected layer or mark the canvas. Only real segmentation appears here.</small>
          </header>

          {/* 2. Current image and Replace image */}
          <button type="button" className="ew-current-image" onClick={onReplaceImage} disabled={!onReplaceImage} aria-label="Replace image">
            <span className="ew-current-image-thumb" aria-hidden="true">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" />
              ) : (
                <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", color: "#777", fontSize: 10 }}>No image</span>
              )}
            </span>
            <span>
              <b>Current image</b>
              <small>Replace image</small>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* 3. Detected objects count and Scan again */}
          <div className="ew-detected-head">
            <h3>
              Detected objects {detectedObjects.length > 0 ? <span>{detectedObjects.length}</span> : null}
            </h3>
            {detectedObjects.length > 0 && onScan ? (
              <button type="button" onClick={onScan} disabled={Boolean(isScanning)}>
                {isScanning ? "Scanning…" : "Scan again"}
              </button>
            ) : null}
          </div>

          {/* Empty / scanning states without fake results */}
          {isScanning ? (
            <div className="ew-tool-prompt" role="status">
              <h4>Finding objects…</h4>
              <p className="ew-hint">The first scan can take a minute. Keep this panel open.</p>
            </div>
          ) : detectedObjects.length === 0 ? (
            <div className="ew-tool-prompt">
              <h4>No objects yet</h4>
              <p className="ew-hint">Scan this photo for furniture and surfaces. Only actual detections will appear below.</p>
              {onScan ? (
                <button type="button" className="ew-secondary" onClick={onScan} disabled={Boolean(isScanning)}>
                  Scan · 1 credit
                </button>
              ) : null}
              {scanError ? <p className="ew-error" role="alert">{scanError}</p> : null}
            </div>
          ) : (
            /* 4. Real detected-object rows — selecting highlights normalized mask/bounds; clicking highlight selects row */
            <div className="ew-object-list" role="list" aria-label="Detected objects">
              {detectedObjects.map((obj, idx) => (
                <button
                  key={obj.id}
                  type="button"
                  role="listitem"
                  className="ew-object-row"
                  aria-pressed={selectedId === obj.id}
                  onClick={() => selectObject(selectedId === obj.id ? null : obj)}
                >
                  <span className="ew-object-thumb" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={obj.thumbnail} alt="" />
                  </span>
                  <span>
                    <b>{obj.label}</b>
                    <small>
                      Object {idx + 1} · {Math.round(obj.score * 100)}%
                    </small>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* 5. Selected-object or active-tool prompt */}
          {selectedObject ? (
            <section className="ew-selected-panel" aria-label="Selected object actions">
              <h4>Selected: {selectedObject.label}</h4>
              <label htmlFor="ew-describe">Describe changes</label>
              <textarea
                id="ew-describe"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={`For example: make this ${selectedObject.label} sage green`}
                rows={3}
              />
              <button
                type="button"
                className="ew-primary"
                onClick={handleObjectEdit}
                disabled={Boolean(isEditing) || !instruction.trim()}
              >
                {isEditing ? "Editing…" : "Apply edit"}
              </button>
              <p className="ew-hint">Only the masked pixels are sent. Outside-mask pixels are preserved by the server.</p>
              {onCreate3D ? (
                <button type="button" className="ew-create3d" onClick={handleCreate3D}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                    <path d="M12 12L4 7.5M12 12l8-4.5M12 12v9" />
                  </svg>
                  <span>
                    <b>Create 3D from this object</b>
                    <small>Passes the actual crop — no auto-generation</small>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" width="16" height="16">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ) : null}
            </section>
          ) : activeTool === "spotlight" || activeTool === "draw" ? (
            <section className="ew-tool-prompt" aria-label={activeTool === "spotlight" ? "Spotlight edit" : "Draw edit"}>
              <h4>{activeTool === "spotlight" ? "Spotlight rectangle" : "Draw mask"}</h4>
              <p className="ew-hint">
                {activeTool === "spotlight" ? "Drag a rectangle on the canvas." : "Draw a freehand mask on the canvas."} Then describe the change. No fake result — a real mask is sent.
              </p>
              <label htmlFor="ew-region-prompt">Describe changes</label>
              <textarea
                id="ew-region-prompt"
                value={regionPrompt}
                onChange={(e) => setRegionPrompt(e.target.value)}
                placeholder={activeTool === "spotlight" ? "For example: replace this area with built-in oak shelves" : "For example: remove everything I marked"}
                rows={3}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="ew-secondary"
                  onClick={() => {
                    setSpotlightRegion(null);
                    setDrawPoints([]);
                    setRegionPrompt("");
                    setLocalError("");
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="ew-primary"
                  onClick={handleRegionEdit}
                  disabled={Boolean(isEditing) || (activeTool === "spotlight" ? !canApplySpotlight : !canApplyDraw)}
                  style={{ flex: 1 }}
                >
                  {isEditing ? "Applying…" : "Apply edit"}
                </button>
              </div>
              <p className="ew-hint">Mask is white on black. Pixels outside the mask are preserved.</p>
            </section>
          ) : activeTool === "reframe" ? (
            <section className="ew-tool-prompt" aria-label="Reframe">
              <h4>Reframe</h4>
              <p className="ew-hint">Adjust composition. The image is reframed without redesigning content.</p>
              <div className="ew-reframe-row" role="group" aria-label="Aspect ratio">
                {[
                  { id: "auto", label: "Auto" },
                  { id: "1:1", label: "1:1" },
                  { id: "4:3", label: "4:3" },
                  { id: "3:4", label: "3:4" },
                  { id: "16:9", label: "16:9" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={reframeRatio === opt.id}
                    onClick={() => setReframeRatio(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button type="button" className="ew-primary" onClick={handleReframe} disabled={!onReframe || Boolean(isEditing)}>
                {isEditing ? "Reframing…" : "Apply reframe"}
              </button>
              <p className="ew-hint">No synthetic preview — parent applies via existing callback.</p>
            </section>
          ) : null}

          {/* 6. Version history */}
          <section className="ew-history" aria-label="Version history">
            <div className="ew-history-head">
              <span>Version history</span>
              {history && history.length > 0 ? (
                <span className="ew-history-actions">
                  <button type="button" onClick={onUndo} disabled={!canUndo && historyIndex !== undefined ? historyIndex <= 0 : !onUndo}>
                    Undo
                  </button>
                  <button type="button" onClick={onRedo} disabled={!canRedo && historyIndex !== undefined ? historyIndex !== undefined && history !== undefined && historyIndex >= history.length - 1 : !onRedo}>
                    Redo
                  </button>
                </span>
              ) : null}
            </div>
            {history && history.length > 0 ? (
              <>
                <div className="ew-history-strip" role="list">
                  {history.map((src, idx) => (
                    <button
                      key={`${idx}-${src.slice(-20)}`}
                      type="button"
                      role="listitem"
                      aria-pressed={idx === historyIndex}
                      aria-label={`Version ${idx + 1}${idx === historyIndex ? " current" : ""}`}
                      onClick={() => onSelectHistory?.(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
                <p className="ew-hint">Tap a thumbnail to preview. Current is highlighted.</p>
              </>
            ) : (
              <p className="ew-hint">Edits will appear here. Nothing is fabricated.</p>
            )}
          </section>
        </div>
      </aside>
    </section>
  );
}
