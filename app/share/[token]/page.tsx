import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export default async function Page({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const url=process.env.NEXT_PUBLIC_CONVEX_URL!;
  const client=new ConvexHttpClient(url);
  const link=await client.query((api as any).collab.getShareLink,{token});
  if(!link) return <div style={{padding:40}}>Invalid or expired link.</div>;
  if(link.expiresAt && link.expiresAt < Date.now()) return <div style={{padding:40}}>Link expired.</div>;
  return <div style={{padding:40, fontFamily:"system-ui"}}><h1>Review — Project {link.projectId}</h1><p>Role: {link.role}. This is a shareable browser review — no app needed. Comments/approvals load via Convex real-time.</p><p>AR previews use Google model-viewer free tier.</p></div>;
}
