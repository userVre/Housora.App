import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/housora-app.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const albumWorkspace = source.slice(
  source.indexOf("function AlbumWorkspace("),
  source.indexOf("function RedesignField("),
);

describe("project editor information architecture", () => {
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
});
