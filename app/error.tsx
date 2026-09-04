"use client";

import { useEffect, useState } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    console.error("Housora route error", error);
  }, [error]);

  const isMissingConfig =
    error.message?.includes("NEXT_PUBLIC_CLERK") ||
    error.message?.includes("CONVEX_URL") ||
    error.message?.includes("Configuration");

  return (
    <main className="recovery-page">
      <section className="recovery-card" role="alert">
        <a className="auth-brand" href="/">
          Housora
        </a>
        <span className="eyebrow">Workspace interrupted</span>
        <h1>This page did not finish loading.</h1>
        <p>
          Your saved work is safe. Try the page again, or return to Projects if
          the problem continues.
        </p>
        {isMissingConfig ? (
          <p className="error-hint">
            This is usually a missing environment variable on the deployment
            (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CONVEX_URL).
            Check Vercel → Settings → Environment Variables and redeploy.
          </p>
        ) : null}
        <div className="recovery-actions">
          <button className="primary-action" onClick={reset}>
            Try again
          </button>
          <a href="/?view=projects">Return to Projects</a>
        </div>
        <button
          className="error-details-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          style={{
            marginTop: 16,
            fontSize: 12,
            opacity: 0.6,
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {showDetails ? "Hide details" : "Show error details"}
        </button>
        {showDetails ? (
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              fontSize: 11,
              textAlign: "left",
              overflow: "auto",
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message || "Unknown error"}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack.slice(0, 2000)}` : ""}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
