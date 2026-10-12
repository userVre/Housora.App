/**
 * Housora review screenshot capture — run while YOU are logged in.
 * Usage:
 *   1. npx playwright install chromium  (once)
 *   2. node review-sessions/capture.mjs            (chromium opens, log in manually, press ENTER in terminal)
 *   3. Script captures full-page screenshots per session into review-sessions/s01..s07
 *
 * App is a SPA: views are driven by ?view= (see HousoraApp navigate()).
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.HOUSORA_URL || "https://housora.vercel.app";

const SESSIONS = {
  "s01-entry": ["/", "/?view=projects"],
  "s02-create": ["/?view=album"],
  "s03-edit": ["/?view=album&tool=edit"],
  "s04-3d-ar": ["/?view=studio", "/ar"],
  "s05-spec-budget": ["/?view=album&step=specify", "/?view=album&step=budget"],
  "s06-present-share": ["/?view=album&step=present"],
  "s07-manage-billing": ["/?view=library", "/?view=discover", "/?view=pricing"],
};

const MOBILE = process.argv.includes("--mobile");

const q = readline.createInterface({ input: process.stdin, output: process.stdout });
const waitEnter = (msg) => new Promise((res) => q.question(msg, res));

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  ...(MOBILE ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", isMobile: true, hasTouch: true } : {}),
});
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await waitEnter("Log in to Housora in the opened browser, then press ENTER here...");

for (const [session, routes] of Object.entries(SESSIONS)) {
  const dir = join(ROOT, session + (MOBILE ? "-mobile" : ""));
  mkdirSync(dir, { recursive: true });
  for (const route of routes) {
    const name = route.replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "") || "home";
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2500);
    // Scroll top->bottom so lazy content renders, then full-page shot
    await page.evaluate(async () => {
      await new Promise((done) => {
        let y = 0;
        const t = setInterval(() => {
          y += 600; window.scrollTo(0, y);
          if (y >= document.body.scrollHeight) { clearInterval(t); window.scrollTo(0, 0); done(); }
        }, 120);
      });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(dir, name + ".png"), fullPage: true });
    console.log("saved", session + "/" + name + ".png");
  }
}
await browser.close();
q.close();
console.log("Done. Review folders: review-sessions/s01..s07");
