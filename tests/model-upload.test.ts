import { describe, expect, test } from "vitest";
import { MODEL_MAX_BYTES, isGlbBuffer, isGltfText, modelExtension, validateModelFileMeta } from "../lib/model-upload";

describe("model upload validation", () => {
  test("accepts glb and gltf within limits", () => {
    expect(validateModelFileMeta("chair.glb", 1_000_000)).toEqual({ valid: true, reason: "" });
    expect(validateModelFileMeta("CHAIR.GLTF", 1_000)).toEqual({ valid: true, reason: "" });
  });
  test("rejects photos, empties, and oversized files", () => {
    expect(validateModelFileMeta("room.png", 500).valid).toBe(false);
    expect(validateModelFileMeta("chair.glb", 0).valid).toBe(false);
    expect(validateModelFileMeta("chair.glb", MODEL_MAX_BYTES + 1).valid).toBe(false);
    expect(validateModelFileMeta("noext", 100).valid).toBe(false);
  });
  test("detects binary glTF magic", () => {
    expect(isGlbBuffer(new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0, 0]))).toBe(true);
    expect(isGlbBuffer(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(modelExtension("https://cdn.example/a/chair.glb?x=1")).toBe("glb");
  });
  test("detects JSON glTF asset version", () => {
    expect(isGltfText(JSON.stringify({ asset: { version: "2.0" } }))).toBe(true);
    expect(isGltfText("{not json")).toBe(false);
    expect(isGltfText(JSON.stringify({ scenes: [] }))).toBe(false);
  });
});
