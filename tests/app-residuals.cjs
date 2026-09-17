// Residual polish verification on the REAL HousoraApp (mocked Convex/Clerk
// providers, real components). Covers: very-long project names without
// overflow (G02 acceptance), Settings tabs incl. Billing (S01/S05),
// New-Project launcher at desktop + mobile, and the Edit scanning state.
// No credits spent, no purchases, no real AI (fixtures are test-only).
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
  if (ref === 'models.list') return [];
  if (ref === 'furniture.list') return [];
  if (ref === 'roomVersions.list') return [];
  if (ref === 'jobs.listRecent') return [];
  return undefined;
}
export function useMutation(ref) {
  if (ref === 'savedDesigns.save') return async (args) => {
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
export function useUser() { return { isLoaded: true, isSignedIn: true, user: { fullName: 'Residual Tester', username: 'residual', firstName: 'Residual', lastName: 'Tester', primaryEmailAddress: { emailAddress: 'residual@example.com' }, imageUrl: null } }; }
export function useClerk() { return { signOut: async () => {}, openUserProfile: () => {} }; }
`;

(async () => {
  const build = await esbuild.build({
    absWorkingDir: root,
    stdin: { contents: ENTRY, resolveDir: root, loader: "tsx" },
    bundle: true, write: false, platform: "browser", jsx: "automatic",
    plugins: [{
      name: "residual-adapters",
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
    // Test-only fixture: slow segmentation so the scanning state is capturable.
    await page.route("**/api/ai/segment", async (route) => {
      await new Promise((r) => setTimeout(r, 6000));
      await route.fulfill({ json: { objects: [{ id: "obj-sofa", label: "sofa", score: 0.94, box: [0.08, 0.45, 0.4, 0.85], mask: `${base}/photo.png`, thumbnail: `${base}/photo.png` }] } }).catch(() => {});
    });
    await page.route("**/api/assets/image", (route) => route.fulfill({ json: { url: `${base}/photo.png` } }));

    // ---- 1. One project via gallery direction ----
    await page.goto(`${base}/?view=discover`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByPlaceholder("Search rooms, styles, or materials").waitFor({ timeout: 15000 });
    await page.locator(".inspiration-card").first().click();
    await page.getByRole("button", { name: /Use this direction/ }).click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    await page.locator(".album-save-state.is-saved").waitFor({ timeout: 10000 });

    // ---- 2. Very-long name: rename via rail, prove no overflow + ellipsis ----
    const longTitle = "Limestone kitchen and sunlit open-plan living space with oak slats, travertine island, linen drapes and garden view at golden hour";
    assert.ok(longTitle.length > 120, "test title is genuinely long");
    await page.locator(".rail-recent-more").first().click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    const renameInput = page.locator(".rail-recent-rename");
    await renameInput.waitFor({ timeout: 5000 });
    await renameInput.fill(longTitle);
    await page.keyboard.press("Enter");
    await page.locator(".rail-recent-rename").waitFor({ state: "detached", timeout: 8000 });
    const stored = await page.evaluate(() => window.__store.designs.map((d) => d.title));
    assert.ok(stored.some((t) => t === longTitle), `long title persisted (${JSON.stringify(stored)})`);
    // Rail rename while the project is open must sync the editor header (stale-title fix).
    const headerTitle = await page.locator(".album-project-title").innerText().catch(() => "");
    assert.equal(headerTitle, longTitle, "open editor header syncs after rail rename");
    const ellipsis = await page.evaluate(() => {
      const el = document.querySelector(".rail-recent-label > span");
      if (!el) return "missing";
      const cs = window.getComputedStyle(el);
      return `${cs.textOverflow}/${cs.whiteSpace}`;
    });
    assert.equal(ellipsis, "ellipsis/nowrap", `rail title truncates (${ellipsis})`);
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(500);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `long-name ${w}x${h} no-overflow`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(shots, "residual-longname-1440x900.png") });

    // ---- 3. New-Project launcher at desktop + mobile ----
    await page.getByRole("button", { name: "Back to tools" }).click();
    await page.locator(".project-workflow-grid").waitFor({ timeout: 8000 });
    assert.equal(await page.locator(".project-workflow-grid button").count(), 4, "four workflow entries");
    await page.screenshot({ path: path.join(shots, "residual-launcher-1440x900.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "launcher mobile no-overflow");
    await page.screenshot({ path: path.join(shots, "residual-launcher-390x844.png") });
    await page.setViewportSize({ width: 1440, height: 900 });

    // ---- 4. Edit scanning state (slow fixture) ----
    await page.getByRole("button", { name: "View all projects" }).click();
    await page.locator(".album-card").first().click();
    await page.locator(".album-workspace").waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "Back to tools" }).click();
    await page.locator(".project-workflow-grid").getByRole("button", { name: /Edit/ }).click();
    const scanDialog = page.getByRole("dialog", { name: /Detect objects/ });
    await scanDialog.waitFor({ timeout: 8000 });
    await scanDialog.getByRole("button", { name: /Detect objects/ }).click();
    await page.getByText("Finding objects").first().waitFor({ timeout: 10000 });
    await page.screenshot({ path: path.join(shots, "residual-scanning-1440x900.png") });
    await page.locator(".ew-object-row").first().waitFor({ timeout: 30000 });
    assert.ok((await page.locator(".ew-object-row").count()) >= 1, "scan completes after spinner");

    // ---- 5. Settings tabs incl. Billing ----
    await page.getByRole("button", { name: "Back to tools" }).click();
    await page.locator(".profile-button").click();
    await page.getByRole("menuitem", { name: /Settings/ }).click();
    await page.locator(".settings-page, .settings-panel").first().waitFor({ timeout: 10000 });
    for (const tab of ["Profile", "Workspace", "AI defaults", "Team", "Notifications", "Billing", "Privacy & data"]) {
      await page.locator(".settings-nav button", { hasText: tab }).click();
      await page.waitForTimeout(400);
      const sel = await page.locator(".settings-nav button.active").innerText().catch(() => "");
      assert.ok(sel.includes(tab), `${tab} tab active (${sel})`);
      await page.screenshot({ path: path.join(shots, `residual-settings-${tab.toLowerCase().replace(/[^a-z]+/g, "-")}-1440x900.png`) });
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `settings ${tab} no-overflow`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "settings mobile no-overflow");
    await page.screenshot({ path: path.join(shots, "residual-settings-390x844.png") });
    await page.setViewportSize({ width: 1440, height: 900 });

    assert.deepEqual(errors, [], `page errors: ${errors.join("; ")}`);
    console.log("PASS: residuals (long names, launcher, scanning state, settings tabs)");
  } finally {
    await browser?.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
