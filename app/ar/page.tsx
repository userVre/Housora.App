"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ModelViewer } from "../../components/model-viewer";

function ARView() {
  const sp = useSearchParams();
  const src = sp.get("src");
  const poster = sp.get("poster");
  if (!src) return <div style={{padding:40}}>No model provided. Generate a 3D model in Housora and share its link.</div>;
  return (
    <div style={{height:"100dvh", display:"grid", gridTemplateRows:"56px 1fr", background:"#11120f", color:"#f4f0e8"}}>
      <header style={{display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid #34362f"}}>Housora AR — open on phone for “View in your room”</header>
      <div style={{position:"relative"}}>
        <ModelViewer src={decodeURIComponent(src)} poster={poster ? decodeURIComponent(poster) : null} />
      </div>
    </div>
  );
}
export default function Page(){ return <Suspense fallback={<div style={{padding:40}}>Loading AR…</div>}><ARView/></Suspense>; }
