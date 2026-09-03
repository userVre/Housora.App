"use client";

import { useEffect, useState } from "react";

export function ModelViewer({ src, poster }: { src: string; poster?: string | null }) {
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

  if (error) return <div className="model-viewer-loading" role="alert">{error}</div>;
  if (!ready) {
    return <div className="model-viewer-loading"><span className="spinner" /> Loading 3D viewer…</div>;
  }

  return (
    <model-viewer
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
        View in your room — no app needed
      </button>
      <p className="ar-status" slot="progress-bar">Preparing the model…</p>
    </model-viewer>
  );
}

