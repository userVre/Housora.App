// Shared validation for user-supplied 3D model files (free upload path to AR).
// Accepts binary GLB and JSON glTF. Keeps uploads within Convex storage limits.

export const MODEL_MAX_BYTES = 50 * 1024 * 1024;

export function modelExtension(fileName: string): string {
  const base = fileName.split(/[?#]/)[0].split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function validateModelFileMeta(fileName: string, size: number): { valid: boolean; reason: string } {
  const ext = modelExtension(fileName);
  if (ext !== "glb" && ext !== "gltf") {
    return { valid: false, reason: "Use a .glb or .gltf 3D file. Photos cannot be placed in AR directly — create a 3D model from one first." };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { valid: false, reason: "That file looks empty. Choose a valid .glb or .gltf file." };
  }
  if (size > MODEL_MAX_BYTES) {
    return { valid: false, reason: "That file is over 50 MB. Use a smaller optimized model." };
  }
  return { valid: true, reason: "" };
}

/** True when the buffer starts with the binary glTF magic ("glTF"). */
export function isGlbBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46;
}

/** True when the text parses as JSON glTF with an asset version. */
export function isGltfText(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as { asset?: { version?: unknown } };
    return typeof parsed?.asset?.version === "string";
  } catch {
    return false;
  }
}
