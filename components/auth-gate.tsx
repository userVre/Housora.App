"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { AuthLoading, Authenticated } from "convex/react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicPages = new Set(["/privacy", "/terms", "/refunds", "/cookies", "/support", "/ar"]);
  if (publicPages.has(pathname) || pathname.startsWith("/share/")) return children;
  return (
    <>
      <Show when="signed-out">
        <main className="auth-page">
          <div className="auth-aurora" aria-hidden="true" />
          <section className="auth-card">
            <a className="auth-brand" href="/">Housora</a>
            <span className="eyebrow">Your design workspace</span>
            <h1>See your space differently—before you change a thing.</h1>
            <p>Design from a real photo, refine individual objects, create a 3D model and preview it in your room.</p>
            <div className="auth-actions">
              <SignUpButton mode="modal"><button className="primary-action">Create your account</button></SignUpButton>
              <SignInButton mode="modal"><button>Sign in</button></SignInButton>
            </div>
            <small>Your projects are private by default.</small>
          </section>
        </main>
      </Show>
      <Show when="signed-in">
        <AuthLoading>
          <main className="auth-page"><div className="auth-loading"><span className="spinner" /> Opening your workspace…</div></main>
        </AuthLoading>
        <Authenticated>{children}</Authenticated>
      </Show>
    </>
  );
}
