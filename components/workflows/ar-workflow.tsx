"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Isolated AR workflow — props-driven, no fake data, no fake camera
// ---------------------------------------------------------------------------

export type ArModel = {
  id: string;
  url: string;
  title?: string;
  createdAt?: number | string;
  poster?: string | null;
  thumbnail?: string | null;
};

export type ArWorkflowProps = {
  /** Completed saved models — only real, persisted glb urls. Empty array is valid empty state. */
  completedModels: ArModel[];
  /** Currently selected model, or null when nothing chosen yet. */
  selectedModel: ArModel | null;
  /** Select an existing completed model. */
  onSelectModel: (model: ArModel) => void;
  /** Start image-to-3D from a normal furniture photo. Parent creates the model, then updates selectedModel to continue to AR. */
  onStartImageTo3D: () => void;
  /** Open AR on this device for the given model. Parent decides routing / model-viewer AR activation. */
  onOpenAr: (model: ArModel) => void | Promise<void>;
  /** Copy a phone link for the given model. Parent builds the share URL and writes clipboard. */
  onCopyPhoneLink: (model: ArModel) => void | Promise<void>;
};

function formatDate(value?: ArModel["createdAt"]) {
  if (value == null) return "";
  try {
    const d = typeof value === "number" ? new Date(value) : new Date(String(value));
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

function ArPreview({ model, viewerRef }: { model: ArModel; viewerRef?: React.RefObject<HTMLElement | null> }) {
  const internalRef = useRef<HTMLElement>(null);
  const ref = viewerRef ?? internalRef;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setError("3D viewer failed to load. Please refresh.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    const onError = () => setError("This model could not be loaded. Reopen it from your saved models.");
    el.addEventListener("error", onError);
    return () => el.removeEventListener("error", onError);
  }, [ready, model.url]);

  if (error) {
    return (
      <div className="ar-workflow__preview-error" role="alert">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="ar-workflow__preview-loading" role="status" aria-live="polite">
        <span className="ar-workflow__spinner" aria-hidden />
        Loading 3D preview…
      </div>
    );
  }

  return (
    <div className="ar-workflow__model-shell">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <model-viewer
        ref={ref as React.RefObject<HTMLElement>}
        src={model.url}
        poster={model.poster || undefined}
        alt={model.title ? `3D model: ${model.title}` : "Selected furniture 3D model"}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        shadow-softness="0.7"
        exposure="1.05"
        environment-image="neutral"
        tone-mapping="aces"
        style={{ width: "100%", height: "100%" }}
      />
      <p className="ar-workflow__preview-caption">Drag to rotate · pinch to zoom · AR uses real floor detection — no simulated camera.</p>
    </div>
  );
}

export function ArWorkflow({
  completedModels,
  selectedModel,
  onSelectModel,
  onStartImageTo3D,
  onOpenAr,
  onCopyPhoneLink,
}: ArWorkflowProps) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const hasModels = completedModels.length > 0;
  const isSelected = Boolean(selectedModel?.url && /^https:\/\//i.test(selectedModel.url));
  const selectedId = selectedModel?.id ?? null;

  useEffect(() => {
    // Detect AR support without simulation
    let supported = false;
    try {
      // @ts-ignore - model-viewer may expose canActivateAR
      const el = viewerRef.current as unknown as { canActivateAR?: boolean };
      if (el && typeof el.canActivateAR === "boolean") supported = el.canActivateAR;
      // Fallback: check WebXR
      if (!supported && typeof navigator !== "undefined" && (navigator as unknown as { xr?: unknown }).xr) supported = true;
    } catch {}
    setArSupported(supported);
  }, [selectedModel?.id]);

  const handleCopy = async () => {
    if (!selectedModel) return;
    try {
      await onCopyPhoneLink(selectedModel);
      setCopyFeedback("Link copied — open it on your phone.");
    } catch {
      setCopyFeedback("Could not copy link. Use Open AR on this device, or copy manually.");
    }
    window.setTimeout(() => setCopyFeedback(""), 3200);
  };

  const handleOpenAr = async () => {
    if (!selectedModel) return;
    const el = viewerRef.current as unknown as { activateAR?: () => void };
    if (arSupported !== false && el?.activateAR) {
      try {
        await Promise.resolve(el.activateAR());
        return;
      } catch {
        // Use the secure phone-view fallback below when native AR activation fails.
      }
    }
    try {
      await onOpenAr(selectedModel);
    } catch {
      setCopyFeedback("AR could not open. Try Copy phone link, then open it on a compatible phone.");
    }
  };

  return (
    <section className="ar-workflow" aria-labelledby="ar-workflow-title">
      <header className="ar-workflow__header">
        <h2 id="ar-workflow-title" className="ar-workflow__title">
          Place furniture in your room
        </h2>
        <p className="ar-workflow__subtitle">
          AR needs a completed 3D model — a flat photo cannot be placed directly. Choose a saved model or create one from a furniture photo first.
        </p>
      </header>

      {/* Empty / chooser state — always visible as the selection source */}
      <div className="ar-workflow__chooser" aria-label="AR model chooser">
        <div className="ar-workflow__chooser-head">
          <h3 className="ar-workflow__chooser-title">Choose a 3D model</h3>
          <span className="ar-workflow__count" aria-live="polite">
            {hasModels ? `${completedModels.length} ready for AR` : "No completed models yet"}
          </span>
        </div>

        {hasModels ? (
          <ul className="ar-workflow__model-list" role="listbox" aria-label="Completed 3D models">
            {completedModels.map((model, index) => {
              const active = model.id === selectedId;
              const label = model.title || `Furniture model ${completedModels.length - index}`;
              const date = formatDate(model.createdAt);
              return (
                <li key={model.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={active ? "ar-workflow__model-option is-selected" : "ar-workflow__model-option"}
                    onClick={() => onSelectModel(model)}
                  >
                    <span className="ar-workflow__model-thumb" aria-hidden>
                      {model.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={model.thumbnail} alt="" width={48} height={48} />
                      ) : (
                        <span className="ar-workflow__thumb-placeholder" aria-hidden>
                          3D
                        </span>
                      )}
                    </span>
                    <span className="ar-workflow__model-meta">
                      <b>{label}</b>
                      <small>{date ? `Ready · ${date}` : "Ready for AR"}</small>
                    </span>
                    <span className="ar-workflow__check" aria-hidden>
                      {active ? "✓" : "→"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="ar-workflow__empty-list" role="status">
            <p>No AR-ready models yet. A furniture photo must be turned into a 3D model before it can be placed.</p>
          </div>
        )}

        <div className="ar-workflow__chooser-actions">
          <button type="button" className="ar-workflow__button ar-workflow__button--secondary" onClick={onStartImageTo3D}>
            Create one from a photo
          </button>
          {!isSelected && hasModels ? (
            <span className="ar-workflow__hint">Select a model above to preview it.</span>
          ) : null}
        </div>
      </div>

      {/* Selected state */}
      {isSelected && selectedModel ? (
        <div className="ar-workflow__selected">
          <div className="ar-workflow__preview" aria-label="Interactive 3D preview">
            <ArPreview model={selectedModel} viewerRef={viewerRef} />
          </div>

          <div className="ar-workflow__actions" aria-label="AR actions">
            <button type="button" className="ar-workflow__button ar-workflow__button--primary" onClick={() => void handleOpenAr()}>
              Open AR on this device
            </button>
            <button type="button" className="ar-workflow__button ar-workflow__button--secondary" onClick={handleCopy}>
              Copy phone link
            </button>
            <p className="ar-workflow__feedback" role="status" aria-live="polite">
              {copyFeedback || "\u00A0"}
            </p>
          </div>

          <div className="ar-workflow__camera-note" role="note">
            <b>Camera permission</b>
            <p>
              When you open AR, your browser will ask to allow camera access. Camera is used only to detect your floor and place the model. No video is
              recorded or saved by Housora. You can deny access and still use the 3D preview and phone link above.
            </p>
          </div>

          <ol className="ar-workflow__steps" aria-label="How AR works">
            <li>
              <span>1</span>
              <b>Choose or create model</b>
            </li>
            <li>
              <span>2</span>
              <b>Open on phone</b>
            </li>
            <li>
              <span>3</span>
              <b>Scan floor</b>
            </li>
            <li>
              <span>4</span>
              <b>Place and scale</b>
            </li>
          </ol>
          <p className="ar-workflow__desktop-note">On desktop without AR support, the interactive 3D preview and Copy phone link remain fully usable — scan the link on your phone to place the model.</p>
        </div>
      ) : (
        <div className="ar-workflow__selected ar-workflow__selected--empty" aria-label="AR preview placeholder">
          <div className="ar-workflow__preview-placeholder" role="status">
            <p>
              <b>Preview appears here</b>
              <span>Select a completed model to see its interactive 3D preview before opening AR.</span>
            </p>
          </div>
          <p className="ar-workflow__desktop-note">On desktop, you can still rotate the 3D preview and copy a phone link to view it in your room — no camera simulation is used.</p>
        </div>
      )}
    </section>
  );
}

export default ArWorkflow;
