"use client";

import "../../app/workflows/three-d-workflow.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Box as Cube,
  Download as DownloadSimple,
  RefreshCw,
  Smartphone,
  Upload as UploadSimple,
} from "lucide-react";
import { ModelViewer } from "../model-viewer";
import {
  guidanceForInvalid,
  isValidThreeDSource,
  type ThreeDSource,
} from "../../lib/threeD-validation";

// ---------------------------------------------------------------------------
// Isolated 3D workflow — props-driven, no backend coupling, no fake progress
// ---------------------------------------------------------------------------

export type ThreeDWorkflowStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "running"
  | "success"
  | "failed";

export type ThreeDWorkflowProps = {
  /** Crop from Edit (SAM) or null. If provided, its image is the source. */
  initialSource?: ThreeDSource | null;
  /** Controlled preview image; when omitted component manages its own preview from upload / initialSource */
  image?: string | null;
  /** Controlled status — honest names only, no fake percentages. Defaults to internal idle/failed/success flow */
  status?: ThreeDWorkflowStatus;
  /** Completed model URL (GLB). Only used when status === success */
  modelUrl?: string | null;
  /** Optional poster for model-viewer */
  modelPoster?: string | null;
  /** Controlled error message. Component keeps the image visible on error */
  error?: string | null;
  /** Override busy; otherwise derived from status */
  busy?: boolean;
  /** Called with the raw File when user picks an image (JPG/PNG/WEBP, ≤10MB) */
  onUpload?: (file: File) => void;
  /**
   * Request generation.
   * Parent MUST gate this with a 12-credit CreditConfirmation before calling
   * /api/tripo/generate. The component prevents duplicate calls while busy.
   * Receives the validated source and resolved data URL / blob URL.
   */
  onGenerate: (source: ThreeDSource, imagePreview: string) => void | Promise<void>;
  /** Reset to Empty (clear image/model) */
  onReset?: () => void;
  /** Retry after failure — defaults to onGenerate */
  onRetry?: () => void;
  /** Optional AR activation override; otherwise model-viewer's built-in AR button is used */
  onViewAr?: (modelUrl: string, poster: string | null) => void;
  /** Notify when internal source changes (e.g., file → furniture-upload) */
  onSourceChange?: (source: ThreeDSource | null) => void;
  /** Shown when the user arrived from AR — preserves the return-to-AR intent through generation. */
  returnIntent?: string | null;
};

function honestLabel(status: ThreeDWorkflowStatus): string {
  if (status === "uploading") return "Uploading securely…";
  if (status === "queued") return "Queued — preparing your model…";
  if (status === "running") return "Building your 3D model…";
  return status;
}

/** Keep return-to-AR intent user-friendly: never render raw ids, slugs or long payloads. */
function friendlyReturnIntent(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 120 || /[/\\:_#?]{1}/.test(trimmed) || /\b(id|slug|model|design)[-_=:]/i.test(trimmed)) {
    return "You’ll return to AR when this model is ready.";
  }
  return trimmed;
}

export function ThreeDWorkflow({
  initialSource = null,
  image,
  status: controlledStatus,
  modelUrl: controlledModelUrl,
  modelPoster: controlledPoster,
  error: controlledError,
  busy: controlledBusy,
  onUpload,
  onGenerate,
  onReset,
  onRetry,
  onViewAr,
  onSourceChange,
  returnIntent = null,
}: ThreeDWorkflowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  const [internalPreview, setInternalPreview] = useState<string | null>(
    initialSource?.image ?? image ?? null,
  );
  const [internalSource, setInternalSource] = useState<ThreeDSource | null>(
    initialSource ?? null,
  );
  const [internalStatus, setInternalStatus] = useState<ThreeDWorkflowStatus>(
    controlledStatus ?? "idle",
  );
  const [internalError, setInternalError] = useState<string | null>(
    controlledError ?? null,
  );
  const [internalModelUrl, setInternalModelUrl] = useState<string | null>(
    controlledModelUrl ?? null,
  );
  const [internalPoster, setInternalPoster] = useState<string | null>(
    controlledPoster ?? null,
  );
  const [dragging, setDragging] = useState(false);

  // Sync controlled props when parent drives them
  useEffect(() => {
    if (controlledStatus !== undefined) setInternalStatus(controlledStatus);
  }, [controlledStatus]);
  useEffect(() => {
    if (controlledError !== undefined) setInternalError(controlledError);
  }, [controlledError]);
  useEffect(() => {
    if (controlledModelUrl !== undefined) setInternalModelUrl(controlledModelUrl);
  }, [controlledModelUrl]);
  useEffect(() => {
    if (controlledPoster !== undefined) setInternalPoster(controlledPoster);
  }, [controlledPoster]);
  useEffect(() => {
    if (image !== undefined) setInternalPreview(image);
  }, [image]);
  useEffect(() => {
    if (initialSource) {
      setInternalSource(initialSource);
      setInternalPreview(initialSource.image);
      setInternalError(null);
    }
  }, [initialSource]);

  // Revoke blob URLs on unmount / replacement
  useEffect(() => {
    return () => {
      if (internalPreview?.startsWith("blob:")) URL.revokeObjectURL(internalPreview);
    };
  }, [internalPreview]);

  const effectivePreview = image !== undefined ? image : internalPreview;
  const effectiveSource = internalSource;
  const effectiveStatus = controlledStatus ?? internalStatus;
  const effectiveError = controlledError !== undefined ? controlledError : internalError;
  const effectiveModelUrl = controlledModelUrl !== undefined ? controlledModelUrl : internalModelUrl;
  const effectivePoster = controlledPoster !== undefined ? controlledPoster : internalPoster;
  const busy =
    controlledBusy !== undefined
      ? controlledBusy
      : effectiveStatus === "uploading" ||
        effectiveStatus === "queued" ||
        effectiveStatus === "running";

  const validation = isValidThreeDSource(effectiveSource);

  const chooseFile = (file?: File) => {
    if (busy || submitting.current) return;
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setInternalError("Use a JPG, PNG or WEBP image under 10 MB.");
      return;
    }
    // If parent handles upload (controlled), avoid creating a second blob URL
    if (onUpload) {
      onUpload(file);
      return;
    }
    if (effectivePreview?.startsWith("blob:")) URL.revokeObjectURL(effectivePreview);
    const url = URL.createObjectURL(file);
    const next: ThreeDSource = { image: url, kind: "furniture-upload" };
    setInternalPreview(url);
    setInternalSource(next);
    setInternalModelUrl(null);
    setInternalPoster(null);
    setInternalStatus("idle");
    setInternalError(null);
    onSourceChange?.(next);
  };

  const handleGenerate = async () => {
    if (busy || submitting.current) return;
    const result = isValidThreeDSource(effectiveSource);
    if (!result.valid || !effectivePreview) {
      setInternalError(result.reason || "Choose a furniture image first.");
      return;
    }
    submitting.current = true;
    setInternalError(null);
    // Honest generating state; parent should also reflect busy via controlled status
    if (controlledStatus === undefined) setInternalStatus("uploading");
    try {
      await onGenerate(effectiveSource!, effectivePreview);
      // Parent may update status/modelUrl via props; if uncontrolled, simulate queued→running
      if (controlledStatus === undefined) setInternalStatus("queued");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start 3D generation.";
      setInternalError(msg);
      if (controlledStatus === undefined) setInternalStatus("failed");
    } finally {
      submitting.current = false;
    }
  };

  const handleRetry = () => {
    setInternalError(null);
    if (onRetry) return onRetry();
    return handleGenerate();
  };

  const handleReset = () => {
    if (effectivePreview?.startsWith("blob:")) URL.revokeObjectURL(effectivePreview);
    setInternalPreview(null);
    setInternalSource(null);
    setInternalModelUrl(null);
    setInternalPoster(null);
    setInternalStatus("idle");
    setInternalError(null);
    onSourceChange?.(null);
    onReset?.();
  };

  const empty = !effectivePreview;
  const completed = effectiveStatus === "success" && Boolean(effectiveModelUrl);
  const hasError = effectiveStatus === "failed" || Boolean(effectiveError);
  const generating = busy && !completed;
  const returnNote = friendlyReturnIntent(returnIntent);

  return (
    <section
      className="three-d-workflow"
      aria-labelledby="three-d-workflow-title"
      data-state={
        empty ? "empty" : completed ? "completed" : generating ? "generating" : hasError ? "error" : "ready"
      }
    >
      {/* Preview: flexible */}
      <div
        className="three-d-workflow__stage"
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          chooseFile(e.dataTransfer.files[0]);
        }}
      >
        {completed && effectiveModelUrl ? (
          <div className="three-d-workflow__viewer">
            <ModelViewer src={effectiveModelUrl} poster={effectivePoster} />
            {effectiveSource?.kind === "sam-crop" && effectiveSource.objectLabel ? (
              <p className="three-d-workflow__preview-caption" role="note">
                From: {effectiveSource.objectLabel} · isolated crop
              </p>
            ) : null}
          </div>
        ) : effectivePreview ? (
          <figure className="three-d-workflow__preview" aria-label="Furniture preview for 3D">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effectivePreview}
              alt={
                effectiveSource?.kind === "sam-crop" && effectiveSource.objectLabel
                  ? `${effectiveSource.objectLabel} selected for 3D`
                  : "Furniture selected for 3D generation"
              }
              style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
            />
            {effectiveSource?.kind === "sam-crop" && effectiveSource.objectLabel ? (
              <figcaption>{effectiveSource.objectLabel} · isolated crop</figcaption>
            ) : null}
            {generating ? (
              <div className="three-d-workflow__generating" role="status" aria-live="polite">
                <span className="three-d-workflow__spinner" aria-hidden />
                <b>{honestLabel(effectiveStatus)}</b>
                <small>This usually takes one to two minutes. You can leave and return — no second charge is created.</small>
              </div>
            ) : null}
          </figure>
        ) : (
          <button
            type="button"
            className={`three-d-workflow__empty${dragging ? " is-dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            aria-label="Upload a furniture photo for 3D"
          >
            <span className="three-d-workflow__empty-icon" aria-hidden>
              <UploadSimple />
            </span>
            <b>Drag a furniture photo here</b>
            <span>or click to browse — one complete object on a plain background</span>
            <small>JPG, PNG or WEBP · Up to 10 MB</small>
          </button>
        )}
      </div>

      {/* Control panel: 320px */}
      <aside className="three-d-workflow__panel" aria-label="3D controls">
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Choose furniture photo"
          onChange={(e) => {
            chooseFile(e.target.files?.[0]);
            e.currentTarget.value = "";
          }}
        />

        <header className="three-d-workflow__panel-head">
          <span className="eyebrow">
            <Cube aria-hidden /> Furniture photo → 3D model
          </span>
          <h2 id="three-d-workflow-title" className="three-d-workflow__title">
            {empty
              ? "Create a 3D model"
              : completed
                ? "Your model is ready"
                : generating
                  ? honestLabel(effectiveStatus)
                  : hasError
                    ? "Could not create the model"
                    : "Ready to generate"}
          </h2>
          <p className="three-d-workflow__subtitle">
            {completed
              ? "Drag to rotate. Use View in AR on your phone to place it in your room."
              : "Upload one clearly visible object on a simple background."}
          </p>
          {returnNote && !completed ? (
            <p className="three-d-workflow__return" role="status">
              {returnNote}
            </p>
          ) : null}
        </header>

        {/* Optional tips stay collapsed — one upload, preview and Generate remain primary */}
        <details className="three-d-workflow__tips">
          <summary>Tips for a good model</summary>
          <ul>
            <li>One object, fully visible, plain background</li>
            <li>A crop from Edit is used directly — no re-upload needed</li>
            <li>Room photos with multiple items give poor 3D results</li>
          </ul>
          <p className="three-d-workflow__guidance">{guidanceForInvalid()}</p>
        </details>

        <ol className="three-d-workflow__steps" aria-label="Progress">
          <li className={effectivePreview ? "is-complete" : "is-active"}>
            <span>1</span>
            <b>Choose furniture</b>
          </li>
          <li className={busy ? "is-active" : completed ? "is-complete" : ""}>
            <span>2</span>
            <b>Create 3D model</b>
          </li>
          <li className={completed ? "is-active" : ""}>
            <span>3</span>
            <b>Preview or View in AR</b>
          </li>
        </ol>

        {effectiveError ? (
          <p className="three-d-workflow__error" role="alert">
            {effectiveError}
          </p>
        ) : null}
        {!validation.valid && effectivePreview && !busy && !completed ? (
          <p className="three-d-workflow__hint" role="status">
            {validation.reason}
          </p>
        ) : null}

        <div className="three-d-workflow__actions">
          {empty ? (
            <button
              type="button"
              className="three-d-workflow__button three-d-workflow__button--secondary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <UploadSimple aria-hidden />
              Choose image
            </button>
          ) : completed && effectiveModelUrl ? (
            <>
              <a
                className="three-d-workflow__button three-d-workflow__button--primary"
                href={effectiveModelUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                <DownloadSimple aria-hidden />
                Download GLB
              </a>
              {onViewAr ? (
                <button
                  type="button"
                  className="three-d-workflow__button three-d-workflow__button--secondary"
                  onClick={() => onViewAr(effectiveModelUrl!, effectivePoster)}
                >
                  <Smartphone aria-hidden />
                  View in AR
                </button>
              ) : (
                <span className="three-d-workflow__hint">Use the “View in your room” button inside the 3D preview to place it.</span>
              )}
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--ghost"
                onClick={handleReset}
              >
                <RefreshCw aria-hidden />
                Start over
              </button>
            </>
          ) : generating ? (
            <>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--primary"
                disabled
                aria-busy="true"
              >
                <span className="three-d-workflow__spinner" aria-hidden />
                {honestLabel(effectiveStatus)}
              </button>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--ghost"
                onClick={() => setInternalError("Keep this window open — your model is still building. No second generation was sent.")}
              >
                Still running?
              </button>
            </>
          ) : hasError ? (
            <>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--primary"
                onClick={handleRetry}
                disabled={busy}
              >
                <RefreshCw aria-hidden />
                Retry
              </button>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--secondary"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                <UploadSimple aria-hidden />
                Replace image
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--secondary"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                <UploadSimple aria-hidden />
                Replace image
              </button>
              <button
                type="button"
                className="three-d-workflow__button three-d-workflow__button--primary"
                onClick={handleGenerate}
                disabled={!validation.valid || busy}
                title={validation.reason}
                aria-disabled={!validation.valid || busy}
              >
                <Cube aria-hidden />
                Generate 3D · 12 credits
              </button>
            </>
          )}
        </div>

        <p className="three-d-workflow__note">
          12 credits are charged only after you confirm. Duplicate requests are blocked while a model is building. Dimensions are approximate.
        </p>
      </aside>
    </section>
  );
}

export default ThreeDWorkflow;
