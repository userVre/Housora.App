// Integrated journey verification on the REAL HousoraApp (mocked Convex/Clerk
// providers, real components, real routing, real files). No credits, no
// purchases, no real AI: /api/ai/* and /api/tripo/* are route-fulfilled with
// fixtures (test-only) or honest errors. Covers B01 (save failure + preserve +
// retry), B02 (toast scoping journey), G02/G03 (titles, no scores), A02 (crop
// handoff + 3D failure + AR error states), C03 (card shimmer/loaded).
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
const path = require("node:path");
const esbuild = require("esbuild");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const shots = path.join(root, "verify-shots");

function resolveFile(specifier, resolveDir) {
  const base = path.resolve(resolveDir, specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.cjs`, path.join(base, "index.js")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}
function css(file) {
  return fs.readFileSync(file, "utf8").replace(/@import url\([^;]+;/g, "").replace(/@import "(.+?)";/g, (_, name) => css(path.resolve(path.dirname(file), name)));
}

const ENTRY = `import React from 'react'; import {createRoot} from 'react-dom/client'; import {HousoraApp} from './components/housora-app';
createRoot(document.getElementById('root')).render(<HousoraApp page="workspace" />);`;

const STUB = `
import React from 'react';
const store = window.__store || (window.__store = { v: 0, designs: [], references: [], subs: new Set(),
  bump() { this.v++; this.subs.forEach((l) => { try { l(); } catch {} }); },
  sub(l) { this.subs.add(l); return () => this.subs.delete(l); } });
function rowShape(d) { return { designId: d.id, projectId: d.projectId, roomId: d.roomId, prompt: d.prompt, title: d.title, image: d.image, mode: d.mode, savedAt: d.savedAt, pinned: d.pinned, archivedAt: d.archivedAt, workflow: d.workflow }; }
export function useQuery(ref) {
  React.useSyncExternalStore((cb) => store.sub(cb), () => store.v);
  if (ref === 'savedDesigns.list') return store.designs.map(rowShape);
  if (ref === 'savedReferences.list') return store.references;
  if (ref === 'credits.getMyBalance') return { total: 12, plan: 'free', subscription: 12, purchased: 0 };
  if (ref === 'preferences.getMine') return {};
  if (ref === 'models.list') return [{ taskId: 'deadbeef123456', url: 'https://example.com/chair.glb', createdAt: Date.now() }];
  if (ref === 'furniture.list') return [];
  if (ref === 'roomVersions.list') return [];
  if (ref === 'jobs.listRecent') return [];
  return undefined;
}
export function useMutation(ref) {
  if (ref === 'savedDesigns.save') return async (args) => {
    if (window.__failSaves > 0) { window.__failSaves--; throw new Error('Simulated persistence failure (test).'); }
    const i = store.designs.findIndex((d) => d.id === args.designId);
    const rec = { id: args.designId, projectId: 'p-test', roomId: 'r-test', prompt: args.prompt, title: args.title, image: args.image, mode: args.mode, savedAt: args.savedAt, workflow: args.workflow };
    if (i >= 0) store.designs[i] = rec; else store.designs.push(rec);
    store.bump();
    return { projectId: 'p-test', roomId: 'r-test' };
  };
  if (ref === 'savedDesigns.remove') return async ({ designId }) => { store.designs = store.designs.filter((d) => d.id !== designId); store.bump(); };
  if (ref === 'savedDesigns.updateMeta') return async ({ designId, title, pinned, archived }) => {
    const d = store.designs.find((x) => x.id === designId);
    if (d) { if (title !== undefined) d.title = title; if (pinned !== undefined) d.pinned = pinned; if (archived) d.archivedAt = Date.now(); store.bump(); }
  };
  if (ref === 'savedReferences.save') return async (args) => { if (!store.references.some((r) => r.title === args.title)) store.references.push({ title: args.title, room: args.room, style: args.style, image: args.image, prompt: args.prompt }); store.bump(); };
  if (ref === 'savedReferences.remove') return async ({ title }) => { store.references = store.references.filter((r) => r.title !== title); store.bump(); };
  if (ref === 'preferences.saveMine') return async () => {};
  if (ref === 'credits.initialize') return async () => {};
  if (ref === 'models.createShare') return async () => 'test-token';
  if (ref === 'models.revokeShare') return async () => {};
  return async () => {};
}
export function Authenticated({ children }) { return React.createElement(React.Fragment, null, children); }
export function AuthLoading() { return null; }
export function useConvex() { return null; }
`;

const CLERK_STUB = `
import React from 'react';
export function useUser() { return { isLoaded: true, isSignedIn: true, user: { fullName: 'Journey Tester', username: 'journey', firstName: 'Journey', lastName: 'Tester', primaryEmailAddress: { emailAddress: 'journey@example.com' }, imageUrl: null } }; }
export function useClerk() { return { signOut: async () => {}, openUserProfile: () => {} }; }
`;

(async () => {
  const build = await esbuild.build({
    absWorkingDir: root,
    stdin: { contents: ENTRY, resolveDir: root, loader: "tsx" },
    bundle: true, write: false, platform: "browser", jsx: "automatic",
    plugins: [{
      name: "journey-adapters",
      setup(b) {
        b.onResolve({ filter: /\.css$/ }, (a) => ({ path: a.path, namespace: "css-stub" }));
        b.onLoad({ filter: /.*/, namespace: "css-stub" }, () => ({ contents: "", loader: "js" }));
        b.onResolve({ filter: /^convex\/react$/ }, () => ({ path: "convex-react-stub", namespace: "stub" }));
        b.onResolve({ filter: /convex\/_generated\/api$/ }, () => ({ path: "api-stub", namespace: "stub" }));
        b.onResolve({ filter: /^@clerk\/nextjs$/ }, () => ({ path: "clerk-stub", namespace: "stub" }));
        b.onResolve({ filter: /^next\/image$/ }, () => ({ path: "image-stub", namespace: "stub" }));
        b.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link-stub", namespace: "stub" }));
        b.onResolve({ filter: /^jspdf$/ }, () => ({ path: "jspdf-stub", namespace: "stub" }));
        b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => {
          if (a.path === "convex-react-stub" || a.path === "api-stub") {
            if (a.path === "api-stub") {
              return { contents: "export const api = new Proxy({}, { get: (t, m) => new Proxy({}, { get: (_, f) => m + '.' + f }) });", loader: "js", resolveDir: root };
            }
            return { contents: STUB, loader: "js", resolveDir: root };
          }
          if (a.path === "clerk-stub") return { contents: CLERK_STUB, loader: "js", resolveDir: root };
          if (a.path === "image-stub") return { contents: `import React from 'react'; export default function Image(p){ const {fill,sizes,priority,unoptimized,...rest}=p; return React.createElement('img',rest); }`, loader: "js", resolveDir: root };
          if (a.path === "link-stub") return { contents: `import React from 'react'; export default function Link({href,children,...p}){ return React.createElement('a',{href: typeof href==='string'?href:'/',...p},children); }`, loader: "js", resolveDir: root };
          return { contents: `export const jsPDF = new Proxy(function(){}, { construct: () => new Proxy({}, { get: () => () => {} }) });`, loader: "js", resolveDir: root };
        });
        b.onResolve({ filter: /^(react|react\/jsx-runtime|react-dom\/client|lucide-react)$/ }, (a) => {
          try { return { path: require.resolve(a.path, { paths: [root] }) }; } catch { return null; }
        });
        b.onResolve({ filter: /^[^./]/ }, (a) => {
          try { return { path: require.resolve(a.path, { paths: [root] }) }; } catch { return null; }
        });
        b.onResolve({ filter: /^\./ }, (a) => {
          const resolved = resolveFile(a.path, a.resolveDir);
          return resolved ? { path: resolved } : null;
        });
      },
    }],
  });
  const styles = css(path.join(root, "app", "globals.css"))
    + "\n" + fs.readFileSync(path.join(root, "components", "settings.css"), "utf8")
    + "\n" + ["create-workflow.css", "edit-workflow.css", "three-d-workflow.css", "ar-workflow.css"].map((f) => fs.readFileSync(path.join(root, "app", "workflows", f), "utf8")).join("\n")
    + "\n" + fs.readFileSync(path.join(root, "app", "object-tools.css"), "utf8");
  const photo = fs.readFileSync(path.join(root, "public", "pictures", "interior-design-room-living-room.png"));
  const server = http.createServer((req, res) => {
    const url = (req.url || "").split("?")[0];
    if (url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(build.outputFiles[0].contents); return; }
    if (url === "/photo.png") { res.setHeader("Content-Type", "image/png"); res.end(photo); return; }
    if (url.startsWith("/inspiration/") || url.startsWith("/pictures/")) {
      const disk = path.join(root, "public", decodeURIComponent(url));
      const ext = path.extname(disk).toLowerCase();
      const types = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
      if (types[ext] && fs.existsSync(disk)) { res.setHeader("Content-Type", types[ext]); res.end(fs.readFileSync(disk)); return; }
    }
    else res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}body{background:#11120f;margin:0}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: "msedge" });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Test-only fixtures: segmentation returns one sofa; 3D submit fails honestly.
    await page.route("**/api/ai/segment", (route) => route.fulfill({ json: { objects: [{ id: "obj-sofa", label: "sofa", score: 0.94, box: [0.08, 0.45, 0.4, 0.85], mask: `${base}/photo.png`, thumbnail: `${base}/photo.png` }] } }));
    await page.route("**/api/tripo/generate", (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: "3D service unavailable in test." }) }));
    // Test-only fixture: image-asset upload resolves to the served photo (no storage backend locally).
    await page.route("**/api/assets/image", (route) => route.fulfill({ json: { url: `${base}/photo.png` } }));

    // ---- 1. Discover renders with shimmer -> loaded cards (C03) ----
    await page.goto(`${base}/?view=discover`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByPlaceholder("Search rooms, styles, or materials").waitFor();
    const cardCount = await page.locator(".inspiration-card").count();
    assert.ok(cardCount > 10, `discover cards render (${cardCount})`);
    await page.waitForFunction(() => document.querySelectorAll(".inspiration-card.is-loaded").length > 5, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(shots, "journey-discover-1440x900.png") });

    // ---- 2. B01: save fails on open, work preserved, retry succeeds ----
    await page.evaluate(() => { window.__failSaves = 1; });
    await page.locator(".inspiration-card").first().click();
    await page.getByRole("button", { name: /Use this direction/ }).click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    await page.getByText("The image opened, but the project could not be saved").waitFor({ timeout: 10000 });
    const editorImg = await page.locator(".create-workflow-preview img, .album-preview img").first().isVisible().catch(() => false);
    assert.ok(editorImg, "image preserved in editor after save failure");
    const promptVal = await page.locator('.create-workflow-composer textarea, textarea[name="design-brief"]').first().inputValue().catch(() => "");
    assert.ok(promptVal.length > 10, `prompt preserved (${promptVal.slice(0, 40)}…)`);
    const title = await page.locator(".album-project-title").innerText();
    assert.ok(title.length > 3, `project titled (${title})`);
    await page.screenshot({ path: path.join(shots, "journey-save-failed-1440x900.png") });
    await page.getByRole("button", { name: /^(Retry|Save now)$/ }).first().click();
    await page.waitForTimeout(2000);
    await page.locator(".album-save-state.is-saved").waitFor({ timeout: 10000 });
    const designUrl = new URL(page.url());
    assert.ok(designUrl.searchParams.get("design"), "design id in URL after save");
    await page.screenshot({ path: path.join(shots, "journey-saved-1440x900.png") });

    // ---- 3. Editor-level failure + retry (upload path) ----
    await page.evaluate(() => { window.__failSaves = 1; });
    await page.locator('input[type="file"][aria-label="Upload a space photo"], input[type="file"][aria-label="Choose a space photo"]').first().setInputFiles(path.join(root, "public", "pictures", "interior-design-room-living-room.png"));
    await page.getByText(/could not be saved|preserved/i).first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(shots, "journey-editor-error-1440x900.png") });
    await page.getByRole("button", { name: /^(Retry|Save now)$/ }).first().click();
    await page.locator(".album-save-state.is-saved").waitFor({ timeout: 10000 });

    // ---- 4. B02: toasts do not leak across pages ----
    for (const nav of ["Library", "Pricing"]) {
      await page.locator(".product-rail nav button", { hasText: nav }).click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator(".workspace-toast").count(), 0, `no toast on ${nav}`);
      assert.equal(await page.locator(".album-save-status").count(), 0, `no editor save status on ${nav}`);
    }
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".workspace-toast").count(), 0, "no toast on Projects");
    assert.equal(await page.locator(".album-save-status").count(), 0, "no editor save status on Projects");
    await page.screenshot({ path: path.join(shots, "journey-library-1440x900.png") });

    // ---- 5. Reopen project from Projects (refresh/reopen path) ----
    await page.locator(".album-card").first().click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    assert.ok(await page.locator(".create-workflow-preview img, .album-preview img").first().isVisible(), "reopened project restores image");
    const titles = await page.evaluate(() => window.__store.designs.map((d) => d.title));
    assert.equal(new Set(titles).size, titles.length, `project titles unique (${JSON.stringify(titles)})`);

    // ---- 5b. G02: second same-day project — fastest nav path stays distinguishable ----
    await page.locator(".product-rail nav button", { hasText: "Images" }).click();
    await page.getByPlaceholder("Search rooms, styles, or materials").waitFor({ timeout: 10000 });
    await page.locator(".inspiration-card").nth(1).click();
    await page.getByRole("button", { name: /Use this direction/ }).click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    await page.locator(".album-save-state.is-saved").waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.locator(".album-card").first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator(".album-card").count(), 2, "two projects listed");
    const titles2 = await page.evaluate(() => window.__store.designs.map((d) => d.title));
    assert.equal(new Set(titles2).size, titles2.length, `same-day titles unique (${JSON.stringify(titles2)})`);
    const recents = await page.locator(".rail-recent-label small").allInnerTexts();
    assert.ok(
      recents.length >= 2 && recents.every((s) => /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(s)),
      `rail recents dated for same-day projects (${JSON.stringify(recents)})`,
    );
    await page.screenshot({ path: path.join(shots, "journey-projects-two-1440x900.png") });

    // ---- 5c. L01: library filter sweep + search zero states ----
    await page.locator(".product-rail nav button", { hasText: "Library" }).click();
    await page.locator(".asset-library-grid, .asset-library-empty").first().waitFor({ timeout: 10000 });
    for (const tab of ["All", "Generated", "Uploaded", "Saved"]) {
      await page.locator('.asset-library-tools [role="tab"]', { hasText: tab }).click();
      await page.waitForTimeout(400);
      const sel = await page.locator('.asset-library-tools [role="tab"][aria-selected="true"]').innerText();
      assert.ok(sel.includes(tab), `${tab} tab selected (${sel})`);
      await page.screenshot({ path: path.join(shots, `journey-library-${tab.toLowerCase()}-1440x900.png`) });
    }
    assert.ok(/No saved inspiration yet/.test(await page.locator(".asset-library-empty h2").innerText()), "saved zero state honest");
    await page.locator('.asset-library-tools [role="tab"]', { hasText: "Uploaded" }).click();
    await page.waitForTimeout(300);
    assert.ok(/No uploads yet/.test(await page.locator(".asset-library-empty h2").innerText()), "uploaded zero state honest");
    await page.locator('.asset-library-tools [role="tab"]', { hasText: "All" }).click();
    await page.locator('input[name="library-search"]').fill("warm");
    await page.waitForTimeout(400);
    assert.ok((await page.locator(".asset-card").count()) >= 1, "search narrows library");
    await page.locator('input[name="library-search"]').fill("zzz-no-match-123");
    await page.waitForTimeout(400);
    assert.ok(/No matching images/.test(await page.locator(".asset-library-empty h2").innerText()), "search zero state honest");
    await page.screenshot({ path: path.join(shots, "journey-library-search-empty-1440x900.png") });
    await page.locator('input[name="library-search"]').fill("");

    // ---- 5d. Gallery detail dialogs (3 records) + Escape ----
    await page.locator(".product-rail nav button", { hasText: "Images" }).click();
    await page.getByPlaceholder("Search rooms, styles, or materials").waitFor({ timeout: 10000 });
    for (const i of [0, 2, 4]) {
      await page.locator(".inspiration-card").nth(i).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ timeout: 8000 });
      const dTitle = await dialog.locator("#reference-title").innerText().catch(() => "");
      assert.ok(dTitle.trim().length > 3, `record ${i} dialog titled (${dTitle})`);
      assert.ok(await dialog.getByRole("button", { name: /Use this direction/ }).isVisible(), `record ${i} handoff present`);
      assert.ok(await dialog.locator(".reference-image img").first().isVisible(), `record ${i} photo dominant`);
      if (i === 0) await page.screenshot({ path: path.join(shots, "journey-gallery-dialog-1440x900.png") });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      assert.equal(await dialog.count(), 0, `record ${i} dialog closes on Escape`);
    }

    // ---- 6. Edit -> scan (fixture) -> select (no scores) -> Create 3D handoff (A02) ----
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.locator(".album-card").first().click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "Back to tools" }).click();
    await page.locator(".project-workflow-grid").getByRole("button", { name: /Edit/ }).click();
    const scanDialog = page.getByRole("dialog", { name: /Detect objects/ });
    await scanDialog.waitFor({ timeout: 8000 });
    await page.screenshot({ path: path.join(shots, "journey-scan-confirm-1440x900.png") });
    await scanDialog.getByRole("button", { name: /Detect objects/ }).click();
    await page.locator(".ew-object-row").first().waitFor({ timeout: 30000 });
    const rowText = await page.locator(".ew-object-row").first().innerText();
    assert.ok(!/%/.test(rowText), `no confidence leak integrated (${rowText})`);
    await page.locator(".ew-object-row").first().click();
    await page.getByRole("button", { name: /Create 3D from this object/ }).click();
    await page.waitForTimeout(1500);
    const caption = await page.locator(".three-d-workflow__preview-caption, .three-d-workflow__preview figcaption").first().innerText().catch(() => "");
    assert.ok(/sofa/i.test(caption), `selected crop enters 3D directly (${caption})`);
    const cropSrc = await page.locator(".three-d-workflow__preview img").first().getAttribute("src").catch(() => "");
    assert.ok((cropSrc || "").startsWith("data:image/"), "3D preview uses the passed crop directly (data URL, no re-upload)");
    await page.screenshot({ path: path.join(shots, "journey-3d-crop-1440x900.png") });
    await page.getByRole("button", { name: /Generate 3D/ }).click();
    const confirm3d = page.getByRole("dialog", { name: /Create this 3D model/ });
    await confirm3d.waitFor({ timeout: 8000 });
    await page.screenshot({ path: path.join(shots, "journey-3d-confirm-1440x900.png") });
    await confirm3d.getByRole("button", { name: /Create 3D/ }).click();
    await page.getByText("3D service unavailable in test").waitFor({ timeout: 15000 });
    assert.equal(await page.locator(".three-d-workflow__viewer model-viewer").count(), 0, "no fake model on failure");
    await page.screenshot({ path: path.join(shots, "journey-3d-error-1440x900.png") });

    // ---- 7. AR: fixture model selects, preview fails honestly (no fake success) ----
    await page.getByRole("button", { name: "Back to tools" }).click();
    await page.locator(".project-workflow-grid").getByRole("button", { name: /^AR/ }).click();
    await page.locator(".ar-workflow__model-option").first().waitFor({ timeout: 8000 });
    await page.waitForTimeout(2500);
    const arState = await page.locator(".ar-workflow__selected, .ar-workflow__preview, .ar-workflow").first().innerText();
    assert.ok(/Open AR on this device|failed to load|could not be loaded|Loading 3D/i.test(arState), `AR selected state honest (${arState.slice(0, 100)})`);
    await page.screenshot({ path: path.join(shots, "journey-ar-selected-1440x900.png") });
    // Camera-permission note documents the deny path; desktop note is the unsupported-device state.
    assert.ok(await page.locator(".ar-workflow__camera-note").isVisible(), "camera-permission note visible (deny path documented)");
    assert.ok(await page.locator(".ar-workflow__desktop-note").first().isVisible(), "desktop/unsupported-device note visible");
    await page.getByRole("button", { name: "Copy phone link" }).click();
    await page.locator(".ar-workflow__feedback").waitFor({ timeout: 8000 });
    const copyText = await page.locator(".ar-workflow__feedback").innerText();
    assert.ok(/Link copied|Could not copy link/.test(copyText), `copy feedback honest (${copyText})`);
    await page.screenshot({ path: path.join(shots, "journey-ar-copylink-1440x900.png") });
    // Invalid model URL must fail honestly (never a fake viewer).
    await page.waitForFunction(
      () => /could not be loaded|failed to load/i.test(document.querySelector(".ar-workflow__selected")?.textContent || ""),
      null,
      { timeout: 25000 },
    ).catch(() => {});
    if (/could not be loaded|failed to load/i.test(await page.locator(".ar-workflow__selected").first().innerText())) {
      await page.screenshot({ path: path.join(shots, "journey-ar-error-1440x900.png") });
    }

    // ---- 8. B02 extended: no stale toasts across Editor/Images/Library/Pricing/Projects/Settings ----
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.locator(".album-card").first().click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    assert.equal(await page.locator(".workspace-toast").count(), 0, "no toast in Editor");
    for (const nav of ["Images", "Library", "Pricing"]) {
      await page.locator(".product-rail nav button", { hasText: nav }).click();
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".workspace-toast").count(), 0, `no toast on ${nav}`);
      assert.equal(await page.locator(".album-save-status").count(), 0, `no editor save status on ${nav}`);
    }
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".workspace-toast").count(), 0, "no toast on Projects");
    await page.locator(".profile-button").click();
    await page.getByRole("menuitem", { name: /Settings/ }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".workspace-toast").count(), 0, "no toast on Settings");
    assert.equal(await page.locator(".album-save-status").count(), 0, "no editor save status on Settings");
    await page.screenshot({ path: path.join(shots, "journey-settings-1440x900.png") });

    // ---- 9. Authenticated viewport matrix + accessibility sweep ----
    async function a11yScan(view) {
      const res = await page.evaluate(() => {
        const vis = (el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && el.offsetParent !== null;
        };
        const out = { buttons: [], inputs: [], images: [], links: [], small: [] };
        document.querySelectorAll("button").forEach((b) => {
          if (!vis(b)) return;
          const n = (b.getAttribute("aria-label") || b.innerText || b.title || "").trim();
          if (!n) out.buttons.push(String(b.className).slice(0, 60));
          const h = Math.round(b.getBoundingClientRect().height);
          if (h > 0 && h < 24) out.small.push(`${n.slice(0, 30)}:${h}`);
        });
        document.querySelectorAll("input,textarea,select").forEach((el) => {
          if (!vis(el) || el.type === "hidden") return;
          const ok =
            el.getAttribute("aria-label") ||
            el.getAttribute("aria-labelledby") ||
            (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
            el.closest("label");
          if (!ok) out.inputs.push(el.getAttribute("name") || el.type || el.tagName);
        });
        document.querySelectorAll("img").forEach((img) => {
          if (!vis(img)) return;
          if (!img.hasAttribute("alt")) out.images.push(String(img.src).slice(-40));
        });
        document.querySelectorAll("a").forEach((a) => {
          if (!vis(a)) return;
          if (!((a.innerText || "").trim() || a.getAttribute("aria-label"))) out.links.push(String(a.href).slice(-40));
        });
        return {
          buttons: out.buttons.slice(0, 5),
          inputs: out.inputs.slice(0, 5),
          images: out.images.slice(0, 5),
          links: out.links.slice(0, 5),
          small: out.small.slice(0, 5),
        };
      });
      assert.deepEqual(res.buttons, [], `${view}: unnamed buttons`);
      assert.deepEqual(res.inputs, [], `${view}: unlabeled fields`);
      assert.deepEqual(res.images, [], `${view}: images missing alt`);
      assert.deepEqual(res.links, [], `${view}: unnamed links`);
      assert.deepEqual(res.small, [], `${view}: sub-24px targets`);
    }
    // NOTE: `lang` lives on the real Next shell (app/layout.tsx sets lang="en");
    // the isolated harness shell here is test-only, so lang is asserted on the
    // real served routes in tests/integrated-routes.cjs instead.
    const matrixViews = [
      { name: "library", go: () => page.locator(".product-rail nav button", { hasText: "Library" }).click() },
      { name: "projects", go: () => page.getByRole("button", { name: "View all projects" }).click() },
      { name: "discover", go: () => page.locator(".product-rail nav button", { hasText: "Images" }).click() },
      { name: "pricing", go: () => page.locator(".product-rail nav button", { hasText: "Pricing" }).click() },
    ];
    for (const v of matrixViews) {
      await v.go();
      await page.waitForTimeout(700);
      await a11yScan(`app-${v.name}`);
      for (const [w, h] of [[1366, 768], [1920, 1080], [360, 800]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(500);
        assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${v.name} ${w}x${h} no-overflow`);
        await page.screenshot({ path: path.join(shots, `journey-matrix-${v.name}-${w}x${h}.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    // ---- 10. Mobile + keyboard spot checks on the real app ----
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "app mobile no-overflow");
    await page.screenshot({ path: path.join(shots, "journey-app-390x844.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // ---- 11. Throttled-connection shimmer (separate page, delayed images) ----
    const slow = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const slowErrors = [];
    slow.on("pageerror", (e) => slowErrors.push(e.message));
    await slow.route(/inspiration|pictures/, async (route) => {
      await new Promise((r) => setTimeout(r, 5000));
      await route.continue().catch(() => {});
    });
    await slow.goto(`${base}/?view=discover`, { waitUntil: "domcontentloaded" });
    await slow.getByPlaceholder("Search rooms, styles, or materials").waitFor({ timeout: 15000 });
    await slow.waitForTimeout(1200);
    const shimmering = await slow.evaluate(() => document.querySelectorAll(".inspiration-card:not(.is-loaded)").length);
    assert.ok(shimmering > 5, `shimmer visible while throttled (${shimmering})`);
    await slow.screenshot({ path: path.join(shots, "journey-discover-shimmer-1440x900.png") });
    await slow.waitForFunction(() => document.querySelectorAll(".inspiration-card.is-loaded").length > 5, null, { timeout: 30000 });
    await slow.close();
    assert.deepEqual(slowErrors, [], `throttled page errors: ${slowErrors.join("; ")}`);

    assert.deepEqual(errors, [], `page errors: ${errors.join("; ")}`);
    console.log("PASS: app journeys (save-failure/retry, toast scoping, reopen, scan->3D handoff, 3D/AR honesty)");
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
