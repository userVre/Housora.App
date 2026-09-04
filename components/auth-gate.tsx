"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { AuthLoading, Authenticated } from "convex/react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/privacy" || pathname === "/terms" || pathname === "/ar" || pathname.startsWith("/share/")) return children;
  return (
    <>
      <Show when="signed-out">
        <main className="auth-page">
          <section className="auth-card">
            <a className="auth-brand" href="/">Housora</a>
            <span className="eyebrow">Your design workspace</span>
            <h1>Turn a real space into a design you can see, refine and share.</h1>
            <p>Sign in to keep your projects, saved inspiration and generated designs available on every device.</p>
            <div className="auth-actions">
              <SignUpButton mode="modal"><button className="primary-action">Create your account</button></SignUpButton>
              <SignInButton mode="modal"><button>Sign in</button></SignInButton>
            </div>
            <small>Your projects stay private to your account.</small>
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
