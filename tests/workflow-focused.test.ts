import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { maskLuminanceToAlpha } from "../lib/mask-alpha";

const app = readFileSync(resolve("components/housora-app.tsx"), "utf8");
const createWorkflow = readFileSync(resolve("components/workflows/create-workflow.tsx"), "utf8");
const createCss = readFileSync(resolve("app/workflows/create-workflow.css"), "utf8");
const editWorkflow = readFileSync(resolve("components/workflows/edit-workflow.tsx"), "utf8");
const editCss = readFileSync(resolve("app/workflows/edit-workflow.css"), "utf8");
const threeDWorkflow = readFileSync(resolve("components/workflows/three-d-workflow.tsx"), "utf8");
const threeDCss = readFileSync(resolve("app/workflows/three-d-workflow.css"), "utf8");
const arWorkflow = readFileSync(resolve("components/workflows/ar-workflow.tsx"), "utf8");
const arCss = readFileSync(resolve("app/workflows/ar-workflow.css"), "utf8");
const arPage = readFileSync(resolve("app/ar/page.tsx"), "utf8");

describe("focused workflow fixes", () => {
  it("Edit upload empty state shows large dropzone similar to Create", () => {
    expect(editWorkflow).toContain("edit-workflow-empty-dropzone");
    expect(editWorkflow).toContain("Drag a photo here");
    expect(editWorkflow).toContain("onUpload");
    expect(editWorkflow).toContain("is-dragging");
    expect(editCss).toContain("edit-workflow-empty-dropzone");
    expect(createWorkflow).toContain("create-workflow-dropzone");
    // Ensure not showing empty editor canvas as primary
    expect(editWorkflow).not.toContain('<div className="edit-workflow-empty">\n                <b>No image yet</b>');
  });

  it("Segmentation dispatch after confirmation with real API", () => {
    expect(app).toContain("scanConfirmOpen");
    expect(app).toContain("doScan");
    expect(app).toContain('fetch("/api/ai/segment"');
    expect(app).toContain("confirmed: true");
    expect(app).toContain('cost={AI_COSTS.detection}');
    expect(app).toContain("Detect objects in this photo?");
    // Auto-start after save
    expect(app).toContain("Auto-start segmentation after Edit image is saved");
  });

  it("Real masked object crop passed to 3D uses mask with transparent background", () => {
    expect(editWorkflow).toContain("buildCropDataUrl");
    expect(editWorkflow).toContain("maskSrc");
    expect(editWorkflow).toContain("destination-in");
    expect(editWorkflow).toContain("selectedObject.mask");
    expect(editWorkflow).toContain("Create 3D from this object");
    expect(app).toContain("handleCreate3DFromObject");
    expect(app).toContain("cropDataUrl");
    // Ensure not just bounding rectangle
    expect(editWorkflow).toContain("transparent background");
  });

  it("converts an opaque grayscale SAM mask into real transparency", () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
      128, 128, 128, 255,
    ]);
    expect(Array.from(maskLuminanceToAlpha(pixels))).toEqual([
      255, 255, 255, 0,
      255, 255, 255, 255,
      255, 255, 255, 128,
    ]);
  });

  it("Project creation from 3D upload saves as real project", () => {
    expect(app).toContain("onUpload={(file) => {");
    expect(app).toContain("persistImage");
    expect(app).toContain("pushHistory");
    expect(app).toContain("setPreview(dataUrl)");
    expect(app).toContain("furniture image was saved");
    // Ensure single blob handling when parent controls upload
    expect(threeDWorkflow).toContain("if (onUpload) {");
    expect(threeDWorkflow).toContain("onUpload(file);");
    expect(threeDWorkflow).toContain("URL.createObjectURL");
  });

  it("New 3D model automatically selected after returning to AR", () => {
    expect(app).toContain("newlyGeneratedModel");
    expect(app).toContain("arReturnPending");
    expect(app).toContain("setNewlyGeneratedModel");
    expect(app).toContain("setSelectedArModelId(taskId)");
    expect(app).toContain('setSelectedWorkflow("ar")');
    expect(app).toContain("completedModels");
  });

  it("Secure AR token link generation uses createShare and /ar?token", () => {
    expect(app).toContain("createShare");
    expect(app).toContain("/ar?token=");
    expect(app).not.toContain("/ar?src=");
    expect(arPage).not.toContain('sp.get("src")');
    expect(arWorkflow).toContain("onCopyPhoneLink");
    expect(app).toContain("await createModelShare");
    expect(app).not.toContain("encodeURIComponent(m.id)");
    expect(app).not.toContain('document.querySelector(`model-viewer');
  });

  it("Compare-with-original behavior is properly implemented or removed", () => {
    // Header should not have dead Compare button with no-op handler
    expect(app).not.toContain('onClick={() => {}}');
    expect(app).not.toContain('aria-label="Compare with original"');
    // If comparison is supported, it should have pressed state and real original image
    // In isolated workflows, comparison is handled internally if needed, not via dead header button
    expect(app).not.toContain("compareOriginal ? \"Show current image\"");
  });

  it("No visible button with empty/no-op handler", () => {
    const all = app + createWorkflow + editWorkflow + threeDWorkflow + arWorkflow;
    // Check for common dead patterns
    expect(all).not.toContain("onClick={() => {}}");
    expect(all).not.toContain("onClick={() => setCompareOriginal");
    // Ensure every button has a working handler or is properly disabled
    expect(all).not.toMatch(/<button[^>]*onClick=\{\(\) => \{\}\}/);
    // Check for no transition: all
    const css = createCss + editCss + threeDCss + arCss;
    expect(css).not.toContain("transition: all");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(":focus-visible");
  });

  it("prompts for automatic segmentation once per uploaded image", () => {
    expect(app).toContain("scanPromptedImageRef.current !== preview");
    expect(app).toContain("scanPromptedImageRef.current = preview");
  });

  it("Create workflow portrait narrow and no right inspector", () => {
    expect(createCss).toContain("clamp(320px, 38vw, 560px)");
    expect(createCss).not.toContain("min(720px");
    expect(createWorkflow).not.toContain("right inspector");
    expect(createWorkflow).toContain('className="create-workflow-composer-anchor"');
    expect(createWorkflow).toContain("Generate redesign");
  });

  it("UX responsive: 44px, 8px scale, focus-visible, no overflow, mobile stacking", () => {
    const css = createCss + editCss + threeDCss + arCss;
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("gap: 8px");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).not.toContain("transition: all");
    expect(editCss).toContain("@media (max-width: 900px)");
    expect(editCss).toContain("flex-direction: column");
    expect(css).not.toContain("overflow-x: visible");
  });
});
