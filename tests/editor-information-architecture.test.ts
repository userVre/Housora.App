import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/housora-app.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const workflowStyles = readFileSync("app/workflow-studio.css", "utf8");
const albumWorkspace = source.slice(
  source.indexOf("function AlbumWorkspace("),
  source.indexOf("function RedesignField("),
);
const productWorkspace = source.slice(source.indexOf("export function HousoraApp("), source.indexOf("function DesignHome("));

describe("project editor information architecture", () => {
  it("reopens projects as stable workspaces and supports inline recent renaming", () => {
    expect(productWorkspace).toContain('key={`${projectDraft?.id || "new-project"}:${projectDraft?.projectId || "draft"}`}');
    expect(productWorkspace).toContain("onDoubleClick={() => beginRecentRename(design)}");
    expect(productWorkspace).toContain('className="rail-recent-rename"');
    expect(productWorkspace).toContain("void saveDesign({ ...draft, id: draftId })");
  });

  it("keeps only peer image workflows in the contextual inspector", () => {
    expect(albumWorkspace).toContain('type EditorMode = "redesign" | "objects"');
    expect(albumWorkspace).toContain("Design room");
    expect(albumWorkspace).toContain("Edit objects");
    expect(albumWorkspace).not.toContain("<span>3D models</span></button>");
    expect(albumWorkspace).not.toContain("<span>View in AR</span></button>");
  });

  it("opens 3D as a project action and leaves AR inside the model viewer", () => {
    expect(albumWorkspace).toContain('aria-label="Open 3D models"');
    expect(albumWorkspace).toContain("<WorkspaceDialog open={threeDOpen}");
    expect(albumWorkspace).toContain("<ThreeDWorkspace initialSource={threeDSource}");
  });

  it("keeps mobile project actions available without crowding the header", () => {
    expect(albumWorkspace).toContain('aria-label="More project actions"');
    expect(albumWorkspace).toContain('id="mobile-project-actions"');
    expect(albumWorkspace).toContain("Compare with original");
    expect(albumWorkspace).toContain("Download image");
    expect(albumWorkspace).toContain("Share design");
  });

  it("protects unsaved project work before navigation", () => {
    expect(albumWorkspace).toContain('window.addEventListener("beforeunload"');
    expect(albumWorkspace).toContain('title="Leave without saving?"');
    expect(albumWorkspace).toContain("setLeaveConfirmOpen(true)");
  });

  it("uses the compact mobile action menu and keeps tabs below the sticky header", () => {
    expect(styles).toContain(".album-bar-actions { display:none; }");
    expect(styles).toContain(".album-mobile-actions { display:block; position:relative; }");
    expect(styles).toContain(".product-shell.is-editor .editor-mode-tabs { top:60px; }");
  });

  it("starts new projects from four clear workflows", () => {
    expect(albumWorkspace).toContain('aria-label="Choose a project workflow"');
    expect(albumWorkspace).toContain("<b>Create</b>");
    expect(albumWorkspace).toContain("<b>Edit</b>");
    expect(albumWorkspace).toContain("<b>3D</b>");
    expect(albumWorkspace).toContain("<b>AR</b>");
    expect(albumWorkspace).toContain('workflowRef.current = "edit"');
    expect(albumWorkspace).toContain('requestUpload("objects", "edit")');
    expect(albumWorkspace).toContain("openArWorkflow");
    expect(albumWorkspace).toContain("onSourceSelected");
  });

  it("uses a launcher-only layout and explains each workflow before upload", () => {
    expect(albumWorkspace).toContain('album-workspace-body workflow-${selectedWorkflow || "launcher"}');
    expect(albumWorkspace).toContain('preview && selectedWorkflow === "edit" ? <aside className="album-control-panel is-edit-inspector"');
    expect(albumWorkspace).toContain("Redesign any space from a photo");
    expect(albumWorkspace).toContain("create-dropzone");
    expect(albumWorkspace).toContain("<CreateComposer");
    expect(albumWorkspace).toContain('className="studio-composer"');
    expect(albumWorkspace).toContain('["Interior", "Exterior", "Garden"]');
    expect(albumWorkspace).toContain("Describe the redesign you want, then hit generate");
    expect(albumWorkspace).toContain("Edit any part of your image");
    expect(albumWorkspace).toContain("edit-dropzone");
    expect(albumWorkspace).not.toContain("edit-start-steps");
    expect(albumWorkspace).not.toContain("edit-credit-note");
    expect(albumWorkspace).toContain("<ArWorkspace onCreateModel=");
    expect(styles).toContain(".album-workspace-body.is-launcher");
    expect(workflowStyles).toContain(".studio-composer-anchor { position:relative; flex:none;");
  });

  it("keeps 3D creation and AR placement as one clear connected pipeline", () => {
    expect(albumWorkspace).toContain('selectedWorkflow === "3d"');
    expect(albumWorkspace).toContain('selectedWorkflow === "ar"');
    expect(source).toContain("Turn furniture into a 3D model.");
    expect(source).toContain("Furniture photo → 3D model");
    expect(source).toContain("AR needs a finished 3D model — not a flat JPG or PNG.");
    expect(source).toContain("No AR-ready models yet");
    expect(source).toContain("Create from a furniture photo");
    expect(source).toContain("<ModelViewer src={selectedModel.url}");
    expect(styles).toContain(".ar-workspace-layout");
  });

  it("ships functional Reve-style edit tools and explicit paid confirmations", () => {
    expect(albumWorkspace).toContain('type CanvasEditTool = "select" | "spotlight" | "draw" | "reframe"');
    expect(albumWorkspace).toContain('className="edit-canvas-toolbar"');
    expect(albumWorkspace).toContain('title="Select object (V)"');
    expect(albumWorkspace).toContain('title="Reframe (R)"');
    expect(albumWorkspace).toContain("createRegionMask");
    expect(albumWorkspace).toContain('mask: canvas.toDataURL("image/png")');
    expect(albumWorkspace).toContain('title={activeTool === "reframe" ? "Apply this reframe?"');
    expect(styles).toContain(".canvas-spotlight-region");
    expect(styles).toContain(".canvas-draw-overlay");
  });

  it("persists and restores the selected project workflow", () => {
    expect(productWorkspace).toContain("workflow: row.workflow as ProjectWorkflow | undefined");
    expect(albumWorkspace).toContain("workflowRef.current ?? selectedWorkflow");
    expect(albumWorkspace).toContain('initialDraft?.workflow === "edit" ? "objects" : "redesign"');
  });
});
