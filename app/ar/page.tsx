"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Box, Loader2, Monitor, Smartphone } from "lucide-react";
import { ModelViewer } from "../../components/model-viewer";
import { api } from "../../convex/_generated/api";

function ARView() {
  const sp = useSearchParams();
  const src = sp.get("src");
  const token = sp.get("token");
  const poster = sp.get("poster");
  const shared = useQuery(api.models.getSharedModel, token ? { token } : "skip");
  const resolvedSrc = token ? shared?.url : src;
  const pending = Boolean(token) && shared === undefined;
  const valid = Boolean(resolvedSrc && /^https:\/\//i.test(resolvedSrc));
  if (pending) return <main className="ar-page"><div className="model-viewer-loading" role="status"><Loader2 className="spin" aria-hidden />Loading shared model…</div></main>;
  if (!valid) return <main className="ar-page"><header className="ar-page-header"><Link className="ar-page-brand" href="/">Housora</Link></header><section className="ar-empty"><div className="ar-empty-card"><span className="ar-empty-icon"><Box aria-hidden /></span><h1>No model was provided</h1><p>{token ? "This share link is invalid, expired, or has been revoked." : "Generate a 3D furniture model in Housora, then open its secure share link here."}</p><Link className="ar-return" href="/?view=projects">Return to Projects</Link></div></section></main>;
  return (
    <main className="ar-page">
      <header className="ar-page-header"><Link className="ar-page-brand" href="/">Housora</Link><span className="ar-device-note"><Smartphone aria-hidden size={17} /><span>Open on a compatible phone for AR</span><Monitor aria-hidden size={17} /></span></header>
      <div className="ar-stage">
        <ModelViewer src={resolvedSrc!} poster={poster} />
      </div>
    </main>
  );
}
export default function Page(){ return <Suspense fallback={<main className="ar-page"><div className="model-viewer-loading" role="status"><Loader2 className="spin" aria-hidden />Loading AR…</div></main>}><ARView/></Suspense>; }
