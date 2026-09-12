import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/housora-app.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
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
    expect(albumWorkspace).toContain('album-workspace-body${preview ? "" : " is-launcher"}');
    expect(albumWorkspace).toContain('{preview ? <aside className="album-control-panel">');
    expect(albumWorkspace).toContain("Create a complete space");
    expect(albumWorkspace).toContain("Detection costs 1 credit only after you confirm");
    expect(albumWorkspace).toContain("AR needs a finished 3D model");
    expect(styles).toContain(".album-workspace-body.is-launcher");
  });

  it("persists and restores the selected project workflow", () => {
    expect(productWorkspace).toContain("workflow: row.workflow as ProjectWorkflow | undefined");
    expect(albumWorkspace).toContain("workflowRef.current ?? selectedWorkflow");
    expect(albumWorkspace).toContain('initialDraft?.workflow === "edit" ? "objects" : "redesign"');
  });
});
