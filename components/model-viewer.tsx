"use client";

import { useEffect, useState } from "react";

export function ModelViewer({ src, poster }: { src: string; poster?: string | null }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    import("@google/model-viewer").then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

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
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      environment-image="neutral"
      touch-action="pan-y"
    >
      <button className="ar-launch-button" slot="ar-button">
        View in your room
      </button>
      <p className="ar-status" slot="progress-bar">Preparing the model…</p>
    </model-viewer>
  );
}

