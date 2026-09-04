"use client";

import { useEffect, useRef, useState } from "react";

export function ModelViewer({ src, poster }: { src: string; poster?: string | null }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const viewer = useRef<HTMLElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [arMessage, setArMessage] = useState("");
  useEffect(() => {
    const element = viewer.current;
    if (!ready || !element) return;
    setModelLoaded(false); setArMessage("");
    const loaded = () => setModelLoaded(true);
    const failed = () => setError("This model could not be loaded. Reopen it from Saved models or try again later.");
    const arStatus = (event: Event) => {
      if ((event as CustomEvent).detail?.status === "failed") setArMessage("AR could not start. Use a compatible phone and allow camera access. The 3D preview is still available.");
    };
    element.addEventListener("load", loaded);
    element.addEventListener("error", failed);
    element.addEventListener("ar-status", arStatus);
    return () => { element.removeEventListener("load", loaded); element.removeEventListener("error", failed); element.removeEventListener("ar-status", arStatus); };
  }, [ready, src]);

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

  if (error) return <div className="model-viewer-loading" role="alert">{error}</div>;
  if (!ready) {
    return <div className="model-viewer-loading"><span className="spinner" /> Loading 3D viewer…</div>;
  }

  return (
    <><model-viewer
      ref={viewer}
      src={src}
      poster={poster || undefined}
      alt="Generated furniture model"
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="fixed"
      ar-placement="floor"
      camera-controls
      auto-rotate
      shadow-intensity="1.2"
      shadow-softness="0.7"
      exposure="1.05"
      environment-image="neutral"
      tone-mapping="aces"
      touch-action="pan-y"
      interaction-prompt="auto"
      style={{ width: "100%", height: "100%" }}
    >
      <button className="ar-launch-button" slot="ar-button">
        View in your room
      </button>
      {!modelLoaded ? <p className="ar-status" slot="progress-bar" role="status">Preparing the model…</p> : null}
    </model-viewer>{arMessage ? <p role="alert">{arMessage}</p> : null}</>
  );
}
