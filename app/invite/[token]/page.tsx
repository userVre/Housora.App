"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return <AcceptInvite params={params} />;
}

function AcceptInvite({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);
  const invite = useQuery(api.invites.getPublic, token ? { token } : "skip");
  const accept = useMutation(api.invites.accept);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const join = async () => {
    if (!token) return;
    setError("");
    setBusy(true);
    try {
      await accept({ token });
      window.location.assign("/?view=projects");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept this invite.");
      setBusy(false);
    }
  };
  if (!token || invite === undefined) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
        <p>Housora</p>
        <p>Checking invite…</p>
      </main>
    );
  }
  if (!invite) {
    return (
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
        <p>Housora</p>
        <h1>This invite is no longer available</h1>
        <p>It may have been used, revoked, or expired. Ask the project owner for a new link.</p>
      </main>
    );
  }
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
      <p>Housora</p>
      <h1>You’re invited to {invite.projectName}</h1>
      <p>
        Role: {String(invite.role).replaceAll("_", " ")}
        {invite.email ? ` · sent to ${invite.email}` : ""}
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <button onClick={() => void join()} disabled={busy} style={{ minHeight: 44, padding: "0 20px" }}>
        {busy ? "Joining…" : "Accept and open Projects"}
      </button>
    </main>
  );
}
