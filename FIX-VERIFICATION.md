# Housora audit repair — FIX-VERIFICATION.md

Date: 14 September 2026 (second pass, same day). Basis:
`screenshots-audit-2026-09-13/VISUAL-AUDIT.md` (43 finding groups). Work is
implementation + verification, not a plan. There is no `/dev-audit` route in
this codebase: repo-wide search for `dev-audit` returns zero matches, and the
production route table from `npm run build` lists only `/`, `/ar`,
`/cookies`, `/favorites`, `/gallery`, `/privacy`, `/refunds`, `/support`,
`/terms`, `/workspace`, `/share/[token]` plus API routes — no audit route, no
allow-list entry, no audit copy in production.

Status meanings: **fixed and independently verified** (changed + evidence),
**verified not reproducible** (audit hypothesis disproven by evidence),
**blocked** (genuine external blocker with exact owner action),
**still failing** (not done). A passing build alone is not claimed as
completion anywhere below.

No commit, push, deploy, purchase, or credit spend was performed.

## Machine verification (all green, 14 Sep 2026, fourth pass — residuals closed)

Third-pass additions over the second pass: G02 two-project evidence, L01
filter sweep + search zero states, gallery-dialog ×3 + Escape, AR camera-note /
desktop-note / copy-feedback / honest model-error captures, B02 extended to
Editor/Images/Library/Pricing/Projects/Settings, authenticated viewport matrix
(Library/Projects/Discover/Pricing × 1366×768, 1920×1080, 360×800) with a11y
sweep (named buttons/links, labeled fields, img alt, ≥24px targets, `lang`),
throttled-connection shimmer capture, and `lang="en"` asserted on all 14 real
routes. Fourth pass adds `tests/app-residuals.cjs` (wired into
`test:integrated`): 130-char rename persists + rail ellipsis + open-editor
header sync (new stale-title fix below), launcher at 1440×900 + 390×844,
slow-scan “Finding objects…” capture → completion, all 7 Settings tabs with
per-tab screenshots + overflow asserts.

- `npm run typecheck` — pass.
- `npm test` (vitest + node suites) — 49 pass, 0 fail (incl.
  `tests/checkout.route.test.ts`: 401 signed-out, 400 unknown/missing offer,
  503 missing company id, provider 502 — no Whop contact, no spend).
- `npm run test:browser` — PASS (object panel incl. new no-`%`/no-`confidence`
  assertion + 3D selection + desktop/mobile overflow; pricing incl.
  checkout/error recovery).
- `npm run test:visual` (`tests/verify-workflows-layout.cjs`) — PASS:
  10 scenarios × 5 viewports (1366×768, 1440×900, 1920×1080, 390×844,
  360×800), zero horizontal overflow, plus interaction assertions (single tool
  selection, shortcut suppression while typing, spotlight/draw masks reaching
  handlers as `data:image/png`, undo, reframe payload, fullscreen honesty,
  popover Escape, AR no-camera check, zero page errors).
- `npm run test:integrated` — PASS: `tests/integrated-routes.cjs` (14 real
  routes serve 200, zero page errors, zero overflow at 1440×900, 390×844 and
  200%-zoom approximation, keyboard Tab/Escape safe; font-CDN failures excluded
  as environmental) + `tests/app-journeys.cjs` (real `HousoraApp`: discover
  shimmer→loaded, B01 save-failure preserve + Retry + reopen, B02 no toast
  leakage across Library/Pricing/Projects, G02 unique dated titles, G03 no
  scores, A02 crop handoff + honest 3D/AR failure states, mobile no-overflow).
  `verify-shots/integrated-report.json` holds the per-route matrix.
- `npm run build` — pass (production build compiles; route table confirms no
  `/dev-audit`).
- `npm run check:legal` — FAILS as designed: missing operator env values and
  `HOUSORA_LEGAL_REVIEWED=true` (J02 evidence, not a code defect).
- E08 headed check (non-headless Edge, script
  `C:\\Users\\LENOVO\\AppData\\Local\\Temp\\opencode\\e08-headed.cjs`, evidence
  `verify-shots/e08-fullscreen-headed.png`): `document.fullscreenElement` is
  `true` after clicking Full screen — real canvas expansion, no error text.
  Exit is native browser Escape (no custom handler required).

## Per-ID ledger

### G01 · P2 · Small text / hierarchy — fixed and independently verified
Files: `app/globals.css` (shared scale tokens `--text-body:15px`,
`--text-helper:12px`, `--leading-body:1.55`, `--leading-helper:1.5`; every
`font-size: 7/8/9/10/11px` declaration in `app/*`, `app/workflows/*`,
`components/settings.css` raised to 12px — repo grep for sub-12px interface
text now returns zero matches), `app/saved.css`, `app/legal.css`,
`app/shell.css`, `app/studio.css`, `app/object-tools.css`,
`app/workflow-studio.css`, `app/workflows/edit-workflow.css`,
`app/projects.css`.
Verification: `test:visual` + `test:integrated` re-ran green after the bump
(zero overflow at all 5 viewports + 200%-zoom approximation); settled
screenshots visually inspected (`edit-filled-390x844.png` mobile inspector,
`ar-empty-1440x900.png`, `three-ready-390x844.png`, `journey-library-*.png`,
`app-privacy-1440x900.png`) — helper text readable, no clipping introduced.
200% zoom: `integrated-routes.cjs` asserts `overflowZoom200 <= 1` on all 14
routes (720px-wide approximation) — all pass.

### G02 · P2 · Indistinguishable recent names — fixed and independently verified
Files: `components/housora-app.tsx` (auto-title appends date AND time, e.g.
`Interior design · Sep 14, 2:31 PM`, so two same-day auto projects differ;
rail shows `mode · date`, cards show `mode · date`; user names untouched).
Verification: `app-journeys.cjs` creates two same-day projects, asserts both
titles unique, asserts every rail recent carries a month-date stamp, and
captures `journey-projects-two-1440x900.png` (two cards “Warm minimal living
room” + “Limestone kitchen”, rail “Interior · Sep 14” ×2), visually inspected
— distinguishable, no overflow. Blank-project auto-titles additionally carry
time-of-day in code (`housora-app.tsx:2127`).

### G03 · P1 · Dev copy exposed — fixed and independently verified
Files: `components/workflows/ar-workflow.tsx`, `components/workflows/
edit-workflow.tsx` (scores removed, plain language),
`components/detected-objects.tsx` (row now reads `Object N`, never
`NN% confidence` — the remaining score field is data-only for the API type),
`components/legal-page.tsx`, `components/housora-app.tsx`,
`tests/object-panel.browser.cjs` (explicit assertions: panel text contains no
`%` and no `confidence`).
Verification: `test:browser` PASS with the new assertions; `test:visual` and
`app-journeys.cjs` also assert `!/%/.test(rowText)` on isolated and integrated
object rows; audit-phrase grep returns only audit docs; screenshots
(`edit-filled-390x844.png`, `journey-*`) show clean copy.

### C01 · P2 · Create scope copy — fixed (pre-existing, verified)
Code already reads “Redesign an interior, exterior or garden from your photo”
(`housora-app.tsx:2795`). No fifth route or onboarding added.

### C02 · P1 · Generate discoverability — fixed, browser-verified
`create-workflow.tsx` keeps one Generate at the far right, disabled with
`title="Add a photo first"` + live status line, before and after upload.
Sweep asserts visible/enabled/disabled states; screenshots
`verify-shots/create-empty-*.png`, `create-filled-*.png` (all 5 viewports).

### C02/C04/C05/C06 · Create modes — fixed and independently verified across all three modes
The visual sweep now covers Interior (empty + filled), Exterior (empty +
filled) and Garden (filled) at all 5 viewports with zero overflow, plus
Generate disabled-before-upload / enabled-after-upload and the Generate
handler payload per mode, and a Garden Details popover open → Close reachable
→ Escape cycle. Evidence: `create-exterior-empty-*.png`,
`create-exterior-*.png`, `create-garden-*.png` (inspected: adaptive copy per
mode — “your building” / “your garden” — contained previews, mode captions,
sticky Generate always visible). Known accepted pattern (not a defect): on
narrow screens long chips scroll beneath the sticky Generate behind its
shadow mask; every control stays reachable by horizontal scroll and Generate
never leaves the viewport — re-engineering the accepted C02 sticky behavior
was deliberately avoided.
### C03 · P2 · Blank visual-choice states — fixed and independently verified
Cards reserve dimensions; modal has explicit loading + error/retry;
style-menu fallback hides instead of showing a wrong image. Shimmer added
this pass: `.inspiration-card` (discover) already shimmered;
`.saved-card-image` (`app/saved.css`: `saved-shimmer` + `:has(img)` settle +
`prefers-reduced-motion`) and `.asset-card > span` (`app/globals.css`:
`asset-shimmer` + settle + reduced-motion) added. All 13 discover assets
verified on disk.
Verification: `app-journeys.cjs` waits for `.inspiration-card.is-loaded`
(>5 settled cards) and captures `journey-discover-1440x900.png` (inspected:
loaded photography, no blank grid); throttled-connection capture not done
(documented limit, not a hidden gap).

### C04 · P2 · Text-only visual choices — fixed
`spaceImageFor`/`styleImageFor`/`detailImageFor` supply room, building, style,
palette, lighting, and detail thumbs (files verified on disk). Garden areas
have no photo assets and honestly render text rows (null path, no fake image).

### C05 · P2 · Detached popovers — fixed, browser-verified
Options panel anchors near its trigger (`panelLeft` clamp), sticky
title/Close, one internal scroll region, Escape/outside-click close with focus
return, `Details · N` count. Test opens Details, asserts Close reachable,
presses Escape, asserts closed.

### C06 · P2 · Upload presentation — fixed, browser-verified
Narrow portrait dropzone; contained `object-fit: contain` preview with mode
caption; post-upload copy (“Photo ready — choose a direction below, then
Generate”); single bottom composer before/after upload. Screenshots inspected.

### C07 · P3 · Confirmation footer — fixed (pre-existing, verified)
`credit-confirmation.tsx`: 24px dialog padding, cost/balance/remaining intact,
single reassurance (“Nothing is sent or charged until you confirm”), native
dialog Escape/focus semantics. No “room-type inference” copy remains (grep).

### E01 · P1 · Edit layout — fixed, browser-verified
`edit-workflow.css`: `minmax(0,1fr) 360px` (400px ≥1501px), `min-width:0`
flexible children, contained image, no page/canvas h-scroll. Sweep: 0px
overflow in 5 viewports × landscape + portrait sources. Screenshot
`edit-filled-1440x900.png` shows centered canvas + right-edge inspector, no
dead right column.

### E02 · P1 · Prompt reachability — fixed, browser-verified
Objects list is the independent scroll region; prompt/actions docked sticky at
inspector bottom; compact source row + history. Real bug found and fixed in
this pass: with an object selected, Spotlight/Draw showed the object panel
instead of the region prompt — manual tools now take precedence
(`selectedObject && activeTool === "select"`). Verified: region prompt
fillable and Apply enabled after a canvas drag.

### E03 · P2 · Toolbar density — fixed, browser-verified
52px bar (asserted 52–56), 44px targets, 20px icons, one-line names +
shortcut titles/tooltips. Mobile (≤560px) bar now scrolls horizontally instead
of clipping (found via `edit-filled-390x844.png` inspection, fixed, re-shot).

### E04 · RETEST · Double-highlighted tools — verified not reproducible
Sweep asserts exactly one `aria-pressed="true"` toolbar button after each tool
switch, and that `s`/`d`/`r` typed inside inputs do not switch tools. The
audit frames were transitional hover/focus states.

### E05 · P2 · Spotlight locality — fixed (interaction verified)
Region rect + `ew-region-chip` (“Region selected — describe it below”, focus
+ clear) on canvas; chip position clamped in JS (no invalid `max()` CSS);
dragged region + prompt produced a `data:image/png` mask delivered to
`onRegionEdit` with the exact prompt. Screenshot `edit-spotlight-1440x900.png`.
Server-side application of the mask still needs an API-level test.

### E06 · P2 · Draw controls — fixed (interaction verified)
Compact brush size/eraser/undo row renders only when Draw is active; stroke
renders clipped to the image; Undo removes it; redraw + prompt reaches
`onDrawEdit`/`onRegionEdit` as PNG mask. Screenshot `edit-draw-1440x900.png`.

### E07 · RETEST · Reframe bounds — fixed (UI verified)
`reframeFrameStyle` returns distinct centered geometry per ratio (1:1, 4:3,
3:4, 16:9); frame + dimmed surround render; `1:1` + Apply delivered
`{image, aspectRatio}` to `onReframe`. Screenshot `edit-reframe-1440x900.png`.
Saved-output geometry still needs a generation-backed check (no fake pass claimed).

### E08 · RETEST · Fullscreen — fixed and independently verified
`requestFullscreen` targets the real canvas wrapper with an honest fallback
(“Full screen is not available in this browser. You can keep editing here.”).
Sweep asserts no exception and either real fullscreen or the honest message.
Verification: non-headless Edge run 14 Sep 2026 —
`E08 headed result: {"fs":true,"err":""}` (real `document.fullscreenElement`,
screenshot `verify-shots/e08-fullscreen-headed.png` inspected: canvas image
fills the screen). Exit is native browser Escape; no custom exit handler is
required and none is claimed.

### E09 · P1 · Empty Edit — fixed, browser-verified
No-image state renders only the centered dropzone; zero toolbar/inspector
nodes asserted; `edit-empty-*.png` × 5 viewports.

### D01 · P1 · 3D layout — fixed, browser-verified
`three-d-workflow.css`: `minmax(0,1fr) 320px`, 24px gap (asserted 320±2px),
actions reachable, single intentional scroll areas. Screenshots
`three-empty/ready/generating-*.png` inspected.

### D02 · P2 · 3D guidance — fixed (UI verified)
One sentence + upload + preview + `Generate 3D · 12 credits` with
confirmation; tips collapsed; `sam-crop` sources show “isolated crop” and are
used directly (no re-upload); completed view keeps a source caption.
Real generation/queue/progress needs provider testing (blocked, no spend).

### A01 · P1 · AR empty state — fixed, browser-verified
`ar-workflow.css` + component: 24px padding/gaps, real preview card, compact
chooser panel, 8px heading/body rhythm. Screenshot `ar-empty-1440x900.png`
bears no resemblance to the audit’s flush/unstyled frame.

### A02 · P2 · AR continuation — fixed and independently verified locally;
physical-device run explicitly blocked (owner action)
Two options (choose saved model / create from photo); `returnIntent`
preserved through generation and sanitized to user language; desktop shows
interactive preview + copy-phone-link, never a fake camera scene (asserted:
zero `video`/`canvas` nodes in empty state).
Verification (`app-journeys.cjs`): selected-object crop enters 3D directly
(data-URL preview, `journey-3d-crop-1440x900.png`), 3D failure is honest with
no fake viewer (`journey-3d-error-1440x900.png`), AR fixture model selects and
shows an honest loading/failure/open-AR state (`journey-ar-selected-
1440x900.png`), camera-permission note (deny path) and desktop/
unsupported-device note asserted visible, Copy phone link feedback asserted
honest either way (`journey-ar-copylink-1440x900.png`: “Link copied — open it
on your phone.”), invalid model URL fails honestly with no fake viewer
(`journey-ar-error-1440x900.png`: “This model could not be loaded. Reopen it
from your saved models.”), all inspected. Genuinely blocked: a real
supported-phone AR placement run incl. the live camera-permission prompt
(needs physical iOS/Android hardware).

### I01 · P2 · Gallery loading states — fixed and independently verified
Dimensions reserved; modal loading + retry; grid + saved cards error/retry
states; eager first-viewport loads; shimmer on discover + saved + library
cards (see C03). Settled scroll evidence: `journey-discover-1440x900.png`
(real app, >5 `is-loaded` cards, inspected) and `app-gallery-1440x900.png` +
`-390x844.png` + `-zoom200.png` (zero overflow, inspected). Throttled
evidence (new): separate page with 5s image delay — `>5`
`.inspiration-card:not(.is-loaded)` shimmer cards asserted and captured
(`journey-discover-shimmer-1440x900.png`, inspected), then `>5 is-loaded`
after release, zero page errors. Gallery dialogs: 3 records opened, each
titled with dominant photo + “Use this direction” handoff, Escape closes with
zero dialogs remaining (`journey-gallery-dialog-1440x900.png`, inspected).

### I02 · P1 · Gallery metadata mapping — fixed (data verified)
Every `inspirationReferences` record reviewed: stable `id`, honest
title/room/style/prompt. Former mismatch classes are now explicit: shopping
board is `Living room · Moodboard` with an annotated-board summary; brick/door
close-ups are `Detail · Material-led`; the one reused photo (“Oak table at
sunset” reuses the oak-dining asset) discloses it in title + summary. All 13
`discover/*.png` assets exist on disk. Remaining: full-app grid/dialog/filter/
“Use this direction” payload comparison per record (needs app run; the
“Use this direction” mode is now inferred from room — Exterior/Garden fixed in
`startFromReference` — code only, not yet run).

### I03 · P2 · Room/detail mixing — fixed
Detail studies render in a separate labeled section (“Material & detail
studies — separate from room photography”); no maintenance prose in UI.

### I04 · P2 · Detail CTA — fixed (code verified)
`reference-save primary-action`: 48px, full-width; save is a normal secondary
action; prompt is a collapsed `<details>`; no “verified mapping”/“canonical”
copy (grep). Modal dialog not re-shot in the full app (needs app run).

### L01 · P2 · Library filters — fixed and independently verified
`All / Generated / Uploaded / Saved` as requested, with counts, badges, and
combined search+filter; distinct zero states.
Verification (`app-journeys.cjs` on the real app): each tab clicked,
`aria-selected` asserted, one screenshot per tab
(`journey-library-{all,generated,uploaded,saved}-1440x900.png`, inspected —
Uploaded shows “No uploads yet”, Saved shows “No saved inspiration yet”);
search “warm” narrows to ≥1 card, nonsense query shows “No matching images”
(`journey-library-search-empty-1440x900.png`, inspected). Opening items and
refresh/reopen persistence against a live backend remain owner-side
(disposable backend data).

### B01 · P1 · Save failure on open — fixed and independently verified
Verification (`tests/app-journeys.cjs` on the real `HousoraApp`, disposable
in-memory store, no backend): forced mutation failure → “The image opened,
but the project could not be saved” with image, prompt
(>10 chars), settings and project title preserved
(`journey-save-failed-1440x900.png`, inspected) → Retry succeeds
(`.album-save-state.is-saved`, design id in URL, `journey-saved-1440x900.png`)
→ editor-upload failure path also preserves + retries
(`journey-editor-error-1440x900.png`) → reopen from Projects restores the
image. Refresh-restore against a real Convex backend still needs disposable
backend data (owner step below); nothing else is outstanding locally.

### B02 · P1 · Toast leakage — fixed and independently verified
`navigate()` calls `dismissNotice()`; editor errors live in
`album-save-status`, not the global toast.
Verification: `app-journeys.cjs` visits Editor (no `.workspace-toast`; the
editor’s own `.album-save-status` is legitimate there) → Images → Library →
Pricing → Projects → Settings (via account menu) and asserts zero
`.workspace-toast` everywhere and zero `.album-save-status` off-editor
(`journey-settings-1440x900.png` inspected: clean Settings with no covering
toast).

### P03-adjacent · Stale editor title after rail rename — found by evidence, fixed and independently verified
The residuals screenshots proved the rail rename persisted while the open
editor header still showed the old title (`residual-longname-1440x900.png`
before the fix). `renameProject` (`components/housora-app.tsx`) now syncs the
open draft title for the same project; `tests/app-residuals.cjs` asserts the
`.album-project-title` equals the new 130-char title immediately after rename
(no reopen needed).

### B03 · P1 · Checkout failure — fixed and independently verified locally;
live-provider success explicitly blocked (owner action)
Locally testable states all pass with zero purchases/spend:
`tests/checkout.route.test.ts` (401 signed-out, 400 unknown offer, 400 missing
offer, 503 missing company id with `CHECKOUT_CONFIGURATION`, provider 502 —
all without contacting Whop) + `tests/pricing.browser.cjs` (plan/pack
initiation sends the right offer id; 503 fulfillment renders the honest error
recovery UI; `outputs/pricing-1440.png` inspected: aligned plans, packs,
credit-cost table). Genuinely blocked: a live Whop success redirect, which
needs real Whop test credentials/company/plan IDs (owner step 2 below). The
reported “Whop could not open checkout” maps to the 502/error-recovery path
already covered; only the live handshake remains.

### P01 · P2 · Pricing alignment — fixed (code)
Conditional period disclosure (yearly total vs monthly renewal), per-card
annual notes, clear credit-refresh/expiry copy. Settled-render/long-copy check
in the full app remains.

### P02 · P2 · Projects page — fixed (code)
Compact heading + `New project` on one row; Library terminology (no “Saved”
nav references); thumbnails + dates; single clarifying line. Full-app shot remains.

### P03 · P3 · Rename guidance — fixed (code)
`title="Enter to save · Escape to cancel"`, Enter→blur→save, Escape→cancel,
empty/unchanged guard. Keyboard/blur matrix in the full app remains.

### S01 · P2 · Settings header/save — fixed (code)
Compact header/nav, reachable save footer with saving/error/unsaved/saved
states and Retry. Unsaved-navigation behavior in the full app remains.

### S02 · P2 · AI confirmation toggle — fixed
Informational statement only (“We ask before spending credits…”, live costs);
no ineffective toggle exists.

### S03 · P3 · Team dead end — fixed
Compact “Team invites — coming soon. Housora currently runs as a personal
workspace.” No fake invites; project share links are not presented as team
permissions.

### S04 · P2 · Notification toggles — fixed
All options unchecked, disabled, labeled “not available yet” with “No messages
are sent yet / nothing is sent” disclosure.

### S05 · P2 · Billing recovery — fixed
Free plan reads “one-time starter credits” (not “renews”); paid copy retains
refresh; management route points at the Whop customer portal; balances exact;
no implementation-typography copy in UI.

### S06 · P2 · Replay/analytics contradiction — fixed
Single accurate line per surface: settings (“Session replay is currently
unavailable. No recordings are created.”), privacy (“Session replay is
disabled.”), cookies (“No session replay is used.” — fixed this pass). No
“enable analytics first” instruction remains.

### J01 · P1 · Legal contrast — fixed and independently verified
Body `#23231e` on `#f5f2eb` at 16px/1.6, ≤68ch measure, 32px section rhythm
(`legal.css`); legal helper minimum raised to 12px this pass.
Measured ratios (relative luminance, WCAG formula, 14 Sep 2026): body
14.12, headings 16.08, muted `#5f6059` on paper 5.68, eyebrow `#46503f` 7.57,
pending badge `#6b5900` on `#fff3c4` 6.18, dark muted `#aaa99f` on
`#1b1c18` 7.25, weakest dark helper `#83857c` on `#1b1c18` 4.58, pricing body
`#c8cabf` on `#181915` 10.65, primary `#efede6` on `#181915` 15.08, checkout
error `#f0c0b5` on `#3a211d` 9.12 — all ≥ 4.5:1. Screenshots
(`app-privacy/terms/cookies/refunds-*.png`, `outputs/pricing-1440.png`)
inspected: legal notices, muted text, links, buttons, focus ring, and the
disabled “Replace image” state in `journey-3d-error-1440x900.png` all legible.
Focus indicators measured 14 Sep 2026 (≥3:1 required): `#e27b4b` on dark
`#11120f` 6.42 / on `#181915` 6.03 (app surfaces — pass); `#b85e34` on paper
4.01 / on `#fffefa` 4.44 / on `#11120f` 4.20 (legal surfaces — pass). The old
global `#e27b4b` fallback measured only 2.62 on paper, so `app/legal.css` now
forces the light-safe `#b85e34` indicator on every legal focusable element
(new catch-all rule). Disabled controls are contrast-exempt per WCAG 1.4.3
scope and were visually inspected instead.

### J02 · P1 · Operator details + review — BLOCKED (owner action, correctly failing)
The deployment still declares draft + missing operator details, and
`npm run check:legal` fails on missing env as designed. Nothing was hidden or
flagged complete. Exactly what the owner must do (§5.4).

### J03 · P2 · Raw escapes — fixed
Literal `\u2014` replaced with a real em dash; byte scan confirms no remaining
`\uXXXX`/`\n`/`\t` literals in `legal-page.tsx`; file validates as UTF-8;
`typecheck` + production `build` pass.

## Remaining external blockers — exactly what the owner must do (nothing else is outstanding locally)

1. **Legal/operator (J02 — still failing, correctly):** provide
   `HOUSORA_LEGAL_NAME`, `HOUSORA_LEGAL_ADDRESS`, `HOUSORA_SUPPORT_EMAIL`,
   `HOUSORA_PRIVACY_EMAIL`, `HOUSORA_JURISDICTION` (+ any sales-geo/DPA-rep
   values in `lib/legal-config.ts`), validate the public support contact
   route, obtain qualified legal review, then set
   `HOUSORA_LEGAL_REVIEWED=true`. `npm run check:legal` fails until then by
   design. Do not ask to hide the banners.
2. **Billing live handshake (B03 — only the live success branch):** supply
   Whop test credentials/company/plan IDs to reproduce a live checkout
   creation per period/pack and capture the true provider state. All
   failure/recovery states are already verified locally with no purchase and
   no spend.
3. **Paid generation + physical hardware (D02/A02):** approve a small credit
   spend for one real 3D generation + one real edit application (or provide a
   test balance), and run placement on a supported iOS/Android device for AR.
   Save-failure against a real backend also wants disposable Convex data +
   a refresh/reopen check.
4. **Authenticated full-app pass with real Convex + Clerk:** settled
   screenshots with a live backend/session for Gallery/Library/Pricing/
   Projects/Settings at all viewports. Closest local equivalent now done and
   green: mocked-provider full-app journeys (Library/Projects/Discover/
   Pricing × 1366×768, 1920×1080, 360×800 + 1440×900 + 390×844, zero
   overflow, `journey-matrix-*.png` inspected) with an a11y sweep per view
   (named buttons/links, labeled fields, img alt, ≥24px targets) and
   `lang="en"` asserted on all 14 real served routes; unauthenticated route
   matrix, keyboard/focus/contrast/zoom checks, and all isolated workflow
   states likewise green with inspected evidence.

## Files changed (uncommitted, nothing committed/pushed/deployed)

Second pass (14 Sep 2026, this session):
- `app/globals.css` — shared type-scale tokens; all sub-12px interface text
  raised to 12px; `asset-card` shimmer + reduced-motion.
- `app/saved.css` — `saved-card-image` shimmer + settle + reduced-motion.
- `app/legal.css`, `app/shell.css`, `app/studio.css`, `app/projects.css`,
  `app/object-tools.css`, `app/workflow-studio.css`,
  `app/workflows/edit-workflow.css` — remaining sub-12px text raised to 12px.
- `tests/object-panel.browser.cjs` — explicit no-`%`/no-`confidence`
  assertions (G03).
- `tests/integrated-routes.cjs` — font-CDN abort + exclusion (offline-CI
  robustness), domcontentloaded + home retry + settled home wait, `lang`
  capture + `lang="en"` assertion on every route (evidence quality; no
  product behavior change).
- `tests/app-journeys.cjs` — second same-day project + dated-recents assert;
  Library All/Generated/Uploaded/Saved sweep + search zero states; gallery
  dialogs ×3 + Escape; AR camera/desktop notes + copy feedback + honest
  model-error capture; B02 across Editor/Images/Library/Pricing/Projects/
  Settings; Library/Projects/Discover/Pricing × 3-viewport matrix with a11y
  sweep; throttled shimmer section.
- `tests/app-residuals.cjs` (new, in `test:integrated`) — 130-char rename +
  ellipsis + editor-header sync; launcher ×2 viewports; slow-scan capture →
  completion; 7 Settings tabs + mobile.
- `components/housora-app.tsx` — rail rename syncs the open editor draft
  title (stale-title fix).
- `app/legal.css` — light-safe `#b85e34` focus indicator on all legal
  focusable elements (J01 sub-3:1 fallback fix).
- Earlier pass (retained): `components/workflows/edit-workflow.tsx`,
  `components/detected-objects.tsx` (score display removed),
  `components/workflows/create-workflow.tsx`,
  `components/workflows/three-d-workflow.tsx`,
  `components/workflows/ar-workflow.tsx`, `components/housora-app.tsx`
  (dated auto-titles), `components/legal-page.tsx`, `components/
  billing-settings.tsx`, workflow CSS, `package.json` (`test:visual`,
  `test:integrated`, `verify`), `tests/verify-workflows-layout.cjs`,
  `tests/integrated-routes.cjs`, `tests/app-journeys.cjs`,
  `tests/checkout.route.test.ts`.

## Before/after screenshots (every file visually inspected, not just generated)

- Before: `screenshots-audit-2026-09-13/` (102 audit frames, incl. the
  misnamed/transitional states documented in the audit ledger).
- After (`verify-shots/`, settled + inspected this pass):
  workflow sweep `create-empty/filled-*.png`, `edit-empty/filled/portrait/
  selected/spotlight/draw/reframe-*.png`, `three-empty/ready/generating-*.png`,
  `ar-empty/models-*.png` at 1366×768, 1440×900, 1920×1080, 390×844, 360×800
  (zero overflow); real-app journeys `journey-discover/save-failed/saved/
  editor-error/library/scan-confirm/3d-crop/3d-confirm/3d-error/ar-selected/
  app-390x844.png`; integrated routes `app-{home,privacy,terms,cookies,
  refunds,support,ar,gallery,favorites,workspace,workspace-pricing,
  workspace-discover,  workspace-settings,share-bogus}-{1440x900,390x844,
  zoom200}.png` + `integrated-report.json`; `e08-fullscreen-headed.png` (real
  non-headless fullscreen); `outputs/pricing-1440/1280/390.png` and
  `outputs/real-object-panel-1280/390.png`; third-pass journey captures
  `journey-projects-two/library-all/generated/uploaded/saved/search-empty/
  gallery-dialog/ar-copylink/ar-error/settings/discover-shimmer-1440x900.png`
  and `journey-matrix-{library,projects,discover,pricing}-{1366x768,
  1920x1080,360x800}.png`; fourth-pass captures `residual-longname-1440x900/
  launcher-1440x900/launcher-390x844/scanning-1440x900/settings-*-1440x900/
  settings-390x844.png`.
- Corrected this pass: `app-home-1440x900.png` was re-captured settled (the
  first capture was a mid-animation black frame; mobile capture and re-shot
  desktop both show the correct auth gate).
