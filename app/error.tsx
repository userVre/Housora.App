"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Housora route error", error);
  }, [error]);

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
        <div className="recovery-actions">
          <button className="primary-action" onClick={reset}>
            Try again
          </button>
          <a href="/?view=projects">Return to Projects</a>
        </div>
      </section>
    </main>
  );
}
