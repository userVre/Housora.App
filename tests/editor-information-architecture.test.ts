import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/housora-app.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const workflowStyles = readFileSync("app/workflow-studio.css", "utf8");
const createWorkflow = readFileSync("components/workflows/create-workflow.tsx", "utf8");
const createStyles = readFileSync("app/workflows/create-workflow.css", "utf8");
const editWorkflow = readFileSync("components/workflows/edit-workflow.tsx", "utf8");
const editStyles = readFileSync("app/workflows/edit-workflow.css", "utf8");
const threeDWorkflow = readFileSync("components/workflows/three-d-workflow.tsx", "utf8");
const arWorkflow = readFileSync("components/workflows/ar-workflow.tsx", "utf8");
const albumWorkspace = source.slice(
  source.indexOf("function AlbumWorkspace("),
  source.indexOf("function ClientsPage("),
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
    expect(albumWorkspace).toContain("CreateWorkflow");
    expect(albumWorkspace).toContain("EditWorkflow");
    expect(albumWorkspace).toContain("ThreeDWorkflow");
    expect(albumWorkspace).toContain("ArWorkflow");
    expect(albumWorkspace).not.toContain("<span>3D models</span></button>");
    expect(albumWorkspace).not.toContain("<span>View in AR</span></button>");
    expect(albumWorkspace).toContain("headerBackLabel");
    expect(albumWorkspace).toContain("Back to tools");
    expect(albumWorkspace).toContain("Back to Projects");
  });

  it("opens 3D as a project action and leaves AR inside the model viewer", () => {
    expect(albumWorkspace).toContain("handleHeaderBack");
    expect(albumWorkspace).toContain("Back to tools");
    expect(albumWorkspace).not.toContain('aria-label="Open 3D models"');
    expect(threeDWorkflow).toContain("ThreeDWorkflow");
    expect(arWorkflow).toContain("ArWorkflow");
    expect(arWorkflow).toContain("model-viewer");
  });

  it("keeps mobile project actions available without crowding the header", () => {
    expect(albumWorkspace).toContain('aria-label="More project actions"');
    expect(albumWorkspace).toContain('id="mobile-project-actions"');
    expect(albumWorkspace).not.toContain('aria-label="Compare with original"');
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
    expect(albumWorkspace).toContain('requestUpload("edit")');
    expect(albumWorkspace).toContain("handleArStart3D");
    expect(albumWorkspace).toContain("handleCreate3DFromObject");
  });

  it("uses a launcher-only layout and explains each workflow before upload", () => {
    expect(albumWorkspace).toContain('album-workspace-body workflow-${selectedWorkflow || "launcher"}');
    expect(createWorkflow).toContain("Redesign any space from a photo");
    expect(createStyles).toContain("clamp(320px, 38vw, 560px)");
    expect(createWorkflow).toContain("create-workflow-dropzone");
    expect(editWorkflow).toContain("edit-workflow-empty-dropzone");
    expect(editWorkflow).toContain("Drag a photo here");
    expect(arWorkflow).toContain("Create one from a photo");
    expect(styles).toContain(".album-workspace-body.is-launcher");
  });

  it("keeps 3D creation and AR placement as one clear connected pipeline", () => {
    expect(albumWorkspace).toContain('selectedWorkflow === "3d"');
    expect(albumWorkspace).toContain('selectedWorkflow === "ar"');
    expect(albumWorkspace).toContain("arReturnPending");
    expect(albumWorkspace).toContain("newlyGeneratedModel");
    expect(albumWorkspace).toContain("createShare");
    expect(albumWorkspace).toContain("/ar?token=");
    expect(source).not.toContain("/ar?src=");
    expect(arWorkflow).not.toContain('document.querySelector("model-viewer")');
    expect(arWorkflow).toContain("viewerRef");
  });

  it("ships functional edit tools and explicit paid confirmations", () => {
    expect(editWorkflow).toContain('Select (V)');
    expect(editWorkflow).toContain('Spotlight (S)');
    expect(editWorkflow).toContain('Draw (D)');
    expect(editWorkflow).toContain('Reframe (R)');
    expect(editWorkflow).toContain('Full screen');
    expect(editWorkflow).toContain("buildCropDataUrl");
    expect(editWorkflow).toContain("mask");
    expect(albumWorkspace).toContain("scanConfirmOpen");
    expect(albumWorkspace).toContain("editConfirmOpen");
    expect(albumWorkspace).toContain("threeDConfirmOpen");
    expect(editStyles).toContain(".edit-workflow-toolbar");
  });

  it("persists and restores the selected project workflow", () => {
    expect(productWorkspace).toContain("workflow: row.workflow as ProjectWorkflow | undefined");
    expect(albumWorkspace).toContain("workflowRef.current ?? selectedWorkflow");
    expect(source).toContain("initialDraft?.workflow");
  });
});
