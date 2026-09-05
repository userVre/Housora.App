import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("components/housora-app.tsx"), "utf8");
const billing = readFileSync(resolve("components/billing-settings.tsx"), "utf8");

describe("production UI contract", () => {
  test("all 41 Discover entries have complete metadata and real local assets", () => {
    const block = app.match(/const inspirationReferences:[\s\S]*?= \[([\s\S]*?)\n\];/)?.[1] ?? "";
    const entries = [...block.matchAll(/title:\s*"([^"]+)"[\s\S]*?room:\s*"([^"]+)"[\s\S]*?style:\s*"([^"]+)"[\s\S]*?image:\s*"([^"]+)"[\s\S]*?prompt:\s*\n?\s*"([^"]+)"/g)];
    expect(entries).toHaveLength(41);
    for (const [, title, room, style, image, prompt] of entries) {
      expect(title.trim().length).toBeGreaterThan(2);
      expect(room.trim().length).toBeGreaterThan(2);
      expect(style.trim().length).toBeGreaterThan(2);
      expect(prompt.trim().length).toBeGreaterThan(20);
      expect(existsSync(resolve("public", image.replace(/^\//, "")))).toBe(true);
    }
  });
  test("editor exposes one named canvas toolbar and explains the disabled Edit state", () => {
    expect(app).toContain('aria-label="Canvas tools"');
    expect(app).toContain("edit-disabled-reason");
    expect(app).not.toContain("creation-progress\"");
  });
  test("Discover and Saved retain recovery and explicit open actions", () => {
    expect(app).toContain("Show all inspiration");
    expect(app).toContain("saved-card-open");
    expect(app).toContain('className="saved-card-open"');
  });
  test("pricing explains mixed usage and never promises a priority queue", () => {
    expect(billing).toContain("Mixed actions share one balance");
    expect(billing).toContain("AR viewing is free");
    expect(billing).not.toContain("Priority generation queue");
  });
});
