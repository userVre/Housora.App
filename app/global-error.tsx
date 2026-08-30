"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="recovery-page">
          <section className="recovery-card" role="alert">
            <span className="auth-brand">Housora</span>
            <span className="eyebrow">Temporary problem</span>
            <h1>Housora needs a fresh start.</h1>
            <p>No purchase or saved project was changed. Reload the workspace to continue.</p>
            <button className="primary-action" onClick={reset}>Reload Housora</button>
          </section>
        </main>
      </body>
    </html>
  );
}
