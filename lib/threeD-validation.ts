import type { DetectedObject } from "./ai-costs";
export type ThreeDSourceKind = "sam-crop" | "furniture-upload";
export type ThreeDSource = { image: string; kind: ThreeDSourceKind; objectLabel?: string | null; objectBox?: DetectedObject["box"] | null; };
export function isValidThreeDSource(source: ThreeDSource | null | undefined): { valid: boolean; reason?: string } {
  if (!source || !source.image) return { valid: false, reason: "Choose a furniture image to create a 3D model." };
  if (source.kind === "sam-crop") {
    const box = source.objectBox;
    if (!box) return { valid: false, reason: "Select a detected furniture object (SAM crop) before generating. The full room photo cannot be used for image-to-3D." };
    const [x0,y0,x1,y1]=box; const w=x1-x0; const h=y1-y0;
    if (!(w>0&&h>0&&w<=1&&h<=1)) return { valid: false, reason: "Invalid crop. Pick a different furniture object or upload a clear furniture image." };
    if (w*h>0.85) return { valid: false, reason: "This selection looks like the full room. Choose a specific piece of furniture from Detected objects, or upload a clean furniture photo on a plain background." };
    return { valid: true };
  }
  if (source.kind==="furniture-upload") return { valid: true };
  return { valid: false, reason: "A room image cannot be used for 3D. Pick a detected furniture object (SAM) or upload a furniture-only image." };
}
export function guidanceForInvalid(): string { return "To create an accurate 3D model: 1) Open your room photo, wait for SAM to detect furniture, then choose one object — or 2) Upload a clean furniture-only image (one object, plain background, not cut off). Room photos with multiple items give poor 3D results."; }
