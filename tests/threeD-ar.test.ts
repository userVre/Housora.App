import { describe, expect, test } from "vitest";
import { guidanceForInvalid, isValidThreeDSource } from "../lib/threeD-validation";

describe("3D source validation", () => {
  test("accepts a furniture upload", () => {
    expect(isValidThreeDSource({ image: "data:image/jpeg;base64,eA==", kind: "furniture-upload" })).toEqual({ valid: true });
  });
  test("accepts a bounded SAM furniture crop", () => {
    expect(isValidThreeDSource({ image: "data:image/png;base64,eA==", kind: "sam-crop", objectBox: [.1, .2, .7, .8] }).valid).toBe(true);
  });
  test("blocks missing, invalid, and full-room sources", () => {
    expect(isValidThreeDSource(null).valid).toBe(false);
    expect(isValidThreeDSource({ image: "x", kind: "sam-crop", objectBox: [0, 0, 1, 1] }).valid).toBe(false);
    expect(isValidThreeDSource({ image: "x", kind: "sam-crop", objectBox: [.8, .2, .2, .7] }).valid).toBe(false);
    expect(guidanceForInvalid()).toContain("furniture-only image");
  });
});
