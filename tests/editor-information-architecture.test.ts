import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/housora-app.tsx", "utf8");
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
});
