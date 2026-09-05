# Housora — mobile, visual direction and copy prompt pack

Prepared 5 September 2026. This is a research and implementation handoff, NOT a completed mobile visual audit. Browser control returned `Transport closed`; no fresh mobile screenshots or real-device AR checks were captured. No paid provider calls were made. Local baseline observed: `aedec7f`, with only `tsconfig.tsbuildinfo` modified. Production parity was not established.

## How to run these safely

Run prompts 1–8 in separate chats **and separate worktrees created from the same current source baseline**. A separate chat alone does not isolate edits. These workers create isolated modules or reports, not competing edits to the giant application file. Preserve all existing work. Do not copy secrets into prompts or handoffs. Run prompt 9 only after their handoffs are available; it is the sole owner of shared-file integration. Commit locally if needed for integration, but no worker is authorized to push or deploy. The final integrated application must be tested again; isolated worker tests are not sufficient.

No paid Grok, SAM, Tripo, CubiCasa or other provider requests, purchases, or plan changes. Existing assets and mocked network fixtures are suitable for UI tests; label mock tests accurately. A real mobile device is needed for physical AR placement verification.

## 1 — Browser audit and regression tests (parallel)

You are auditing Housora, a Next.js 15 / React 19 / Clerk / Convex interior, exterior and garden design app. Work from the latest local source, not an assumed older deployment. Your scope is only `tests/responsive-review/**` and `review-output/responsive/**`; do not edit application code or shared package files. Work in an isolated worktree.

Capture and inspect actual screenshots at 1440×900, 1024×768, 768×1024 and 390×844, plus a 320px-width overflow check. Cover public landing/sign-in, Projects empty/populated, new-project upload/example, Create, Edit and detection confirmation, existing detected objects, history, existing 3D model and AR fallback, Discover search/filter/detail, Saved tabs, Pricing monthly/yearly/packs, every Settings section, share/expired-share, Privacy, Terms and error states. Record URL, source commit, viewport, state and screenshot per finding. Keep local and deployed findings separate. Never label source-code inspection a visual test.

Check keyboard focus/Escape/return focus, 200% zoom, reduced motion, touch targets, bottom navigation and safe areas, long names, loading/empty/error states, sticky actions and software-keyboard obstruction. Use existing assets; do not generate paid images/models. Do not purchase checkout or change real account data. Physical AR remains unverified without a compatible device.

Use an available browser first; if tooling is missing, document the exact setup needed rather than claiming completion. Deliver prioritized reproducible issues and test files, with pass/fail/blocked status. No push/deploy.

## 2 — Landing and sign-in visual module (parallel)

Housora helps users redesign a space from a photo, edit detected objects, and create furniture models for AR. Build only `components/review-landing/**` with scoped styles; do not edit application entry points, global CSS, dependencies or lockfiles. Use an isolated worktree. Export a presentational component with callbacks for start/sign-in and try-example; the final integrator wires real actions. Never implement fake authentication.

Direction: architectural, warm charcoal, ivory text, restrained sage accents, real room photography. Use Aurora Beams only behind the public hero/sign-in area, not the workspace or image canvas. Reference https://auragradients.vercel.app/ and the supplied recipe at `C:/Users/LENOVO/.codex/attachments/d9a332ac-d2af-4635-a986-f602ad8799e1/pasted-text.txt`. Recipe summary: base #100e0b on a scoped page wrapper; transparent decorative stack with teal radial screen layer, blurred silver repeating-linear screen layer, dark radial multiply vignette and optional grain. Keep content above decoration; aria-hidden and pointer-events:none. Scope blend effects so they never affect photo colors or Clerk controls. Do not globally recolor body. Correct the recipe's invalid multiline JavaScript string instead of pasting it blindly. Reduce or omit expensive grain on mobile; no continuous animation required, no permanent unnecessary will-change.

Hero: “See what your space could become.” Body: “Upload a photo, explore a new look, and refine the details.” CTA “Start designing”; secondary “Try an example” only if it works. Show one real product preview. Below: Photo → Design → Refine, with optional furniture/AR explanation and concise FAQ. Borrow structure, not paid source code or claims, from https://rbp-ai-saas-template.vercel.app/. No fabricated testimonials, benchmarks or unlimited offers. Use lucide-react. Deliver responsive screenshots where possible and integration instructions. No paid calls/push/deploy.

## 3 — Mobile workspace shell and editor layout (parallel)

Build responsive presentation components for Housora in `components/review-workspace/**` only, with scoped styles and typed props/callbacks. Read existing `components/housora-app.tsx` to preserve its state and behavior; do not edit it, global CSS, API routes, billing or shared dependencies. Work in an isolated worktree. Provide precise integration instructions mapping current state/actions to your components.

On phones use one column: compact project header, photo preview, Create/Edit controls, then the active editing panel. Avoid multiple competing vertical scrollers. Keep the main paid action visible in a bottom action region that does not cover content, navigation, focus or the keyboard. Show its real supplied credit cost; tapping it opens the existing confirmation, not an API call. Keep cancel free. Project title truncates safely with a way to view/rename it. Move secondary download/share/history tools into a labelled More menu on narrow screens. Remove the Space/Direction/Result ornament; do not remove actual create/edit/result functionality. Do not hide 3D entirely to solve overflow.

Use neutral opaque canvas surroundings, no Aurora overlay. Progressive disclosure for advanced design settings; preserve selected values. Room-type auto inference should be labelled “Choose for me,” distinct from paid “Detect objects.” Use Lucide icons, accessible labels, 44px target goal, visible focus, 16px mobile inputs, safe-area padding and dynamic viewport sizing. Test at the four supplied viewport sizes and 200% zoom. No sample masks, fake progress or provider calls. Hand off modules plus integration map; no push/deploy.

## 4 — 3D and AR mobile presentation (parallel)

Housora already uses Tripo and Google model-viewer. Improve their presentation only in `components/review-3d/**`, with scoped styles and typed props/callbacks. Read existing Tripo/model-viewer/AR code; do not replace provider logic, create a second generation workflow, edit shared application files or dependencies. Use an isolated worktree.

Phones: single-column image/crop preview, concise guidance, model status, action. A wide modal must become a usable full-height sheet/page with visible close/back, one scrolling content region and non-overlapping actions. Never squeeze two desktop columns onto a phone. Keep existing object crop and generation state when closing/reopening if supported. Explain: “Choose one furniture item. A clear, tightly cropped photo works best.” Show actual supplied cost before confirmation. Do not say “accurate replica”; say “AI-generated approximation. Check dimensions before purchase.” Only display real progress/state from existing jobs.

When an existing model is ready: rotate/zoom controls, download if implemented, and “View in your room.” Unsupported desktop AR should explain compatible-phone use and offer a working share/link flow only if available. Invalid/missing/expired models need clear recovery to the project, not a dead-end sentence. Physical AR scale accuracy must not be promised without calibrated dimensions. Keep Google model-viewer; do not replace it with the similarly named React Bits component.

Test using existing models or explicit local test fixtures; no paid generations. Distinguish browser 3D rendering from real-device AR placement. Deliver integration map and blocked checks. No push/deploy.

## 5 — Projects, Discover and Saved presentation (parallel)

Work only in `components/review-library/**`, using scoped styles, typed data and action props. Housora has Projects, Discover inspiration and Saved designs/inspiration. Read existing components but do not edit their shared file or application behavior. Use an isolated worktree; no provider calls, shared dependency changes, push or deploy.

Create compact page headers with one clear primary action; avoid large empty hero areas inside a productivity workspace. Grid cards need a real image, useful title, readable type/status and accessible actions available on touch, not hover only. Long project names must not break layout. Empty states should explain the next action, not resemble broken loading. Image failure should keep a useful label and recovery.

Discover: visible search, usable horizontally scrollable filter chips, result count, clear filters, accurate image/title/category pairings, no-results recovery. A detail sheet must scroll correctly and expose close and “Use this style” without obscuring the image. Saved should be called “Saved” or “Saved items” when it includes inspiration, with clear tabs/counts. Do not invent an image-label match: check actual assets and metadata.

Use a stable responsive grid by default. React Bits Masonry is an optional reference, not mandatory: preserve logical DOM/focus order, reserve image dimensions and prevent layout shifts. Reject Drift Wall, Infinite Spiral and depth effects for working galleries. Use Lucide icons. Inspect phone/tablet/desktop screenshots and hand off the exact mapping to existing data/actions. Do not create fake projects or change real saved data during testing.

## 6 — Pricing and Settings presentation cleanup (parallel)

Build only `components/review-commerce/**` with scoped styles and callback props. Read `components/billing-settings.tsx`, but leave it and backend/package files untouched for the integrator. Work in an isolated worktree. Preserve actual prices, credit charges, checkout routes and entitlement rules; no purchases or provider calls.

Pricing order stays: compact balance + monthly/yearly controls → plans → extra credits → credit-cost reference. Avoid repeating the same long allowance sentence in both summary and feature list. Clearly explain one shared balance; “up to X images OR Y models” is not additive. Keep the existing data source authoritative. Annual price must disclose upfront billing and real credit-refresh timing. Never invent premium features or change plan access to make cards look better.

Confirmed source issue: 150 credits/$25 is marked Best value, but 400/$55 has a lower price per credit ($0.1375 versus approximately $0.1667). Move “Lowest price per credit” to the actual cheapest pack, or remove the claim. Do not call a pack Most popular without evidence. Phone credit costs should use readable rows/cards or a proper accessible table, not compressed long descriptions. Keep action names and costs visible together. Show checkout errors near the triggering purchase area.

Settings: simplify mobile tabs and pair fields into one column. Do not expose pretend-working notification/invitation controls; use a short unavailable explanation. Clarify confirmation settings against actual behavior. Avoid a fake language/currency change if the application does not support it. Deliver screenshots where available and integration instructions. No push/deploy.

## 7 — Whole-site copy inventory (parallel, copy deliverable)

Review Housora's current user-facing copy in code. Write only `review-output/copy/**`; no component or backend edits. Use an isolated worktree. Deliver a complete location-indexed old → proposed copy table or structured registry, grouped by landing/auth, Projects, Create, Edit/detection, history, 3D/AR, Discover, Saved, Pricing, Settings, share, legal navigation and all loading/error/empty/confirmation states. Label unreachable legacy text separately; verify reachability before calling it a live bug.

Tone: direct, warm, professional, specific. Avoid jargon, “revolutionary,” “magic,” guaranteed accuracy or a promise to refine “every detail.” Use consistent verbs: Upload photo, Generate design, Detect objects, Edit object, Create 3D model, View in your room. Clarify room-type “Choose for me” versus paid detection. CTA costs should come from actual constants, not new hardcoded numbers.

Suggested hero: “See what your space could become.” Body: “Upload a photo, explore a new look, and refine the details.” Empty Projects: “Your next design starts with a photo.” Detection: “Find editable objects in this photo.” Keep the original image preservation claim only if verified. Errors must explain recovery and must not claim a refund unless confirmed by the backend. AR text must state device support and approximate scale when relevant.

Inspect legacy source claims such as “200 generations · 4K exports · 5 team members” and “Direction approved by Emma”; remove from reachable real-user UI unless substantiated. Do not invent legal business details, security guarantees, delivery services or testimonials. Include evidence/owner questions for unresolved policy claims. Other workers retain provisional copy; final integrator applies this registry last. No push/deploy.

## 8 — Purposeful React Bits motion (parallel)

Build only `components/review-motion/**` and its scoped styles/documentation in an isolated worktree. Do not edit application files, package manifests or lockfiles; report any dependency request to the final integrator. Housora is a room-design productivity app, not an animation showcase. Sources: https://reactbits.dev/components/animated-list, https://reactbits.dev/components/depth-carousel, https://github.com/DavidHDev/react-bits and https://rbp-ai-saas-template.vercel.app/.

Provide an optional short entrance treatment for newly returned real detected-object rows or completed job rows: roughly 120–180ms opacity/translate, no fake items, no stagger that delays use, no repeated animation on every render, no automatic reordering or focus theft. A simple CSS implementation is acceptable if it avoids adding a motion dependency. Expose a reduced-motion static state.

Optionally supply a manual, accessible landing-only example carousel: named previous/next buttons, position announcement, no autoplay, stable dimensions and a simple scroll-snap phone fallback. It must not be required to understand the product. Do not add it if a single useful before/after preview communicates better.

Do not use Infinite Spiral, Particle Text, Split Flap Text, custom cursors, magnetic buttons, scroll hijacking or animated financial balances. Do not use Drift Wall as an interactive project library. Critical text must remain immediately readable. Review source licensing and retain required notices; do not scrape/copy paid Pro source or import template testimonials/benchmarks. Deliver isolated optional modules and usage guidance. No paid calls/push/deploy.

## 9 — Integrate, verify and prepare release (run LAST)

You are the sole integrator for Housora after eight isolated review workers finish. Collect their modules, copy registry and audit findings. Preserve the latest baseline and existing working Clerk, Convex, Grok-only, SAM, Tripo, billing and job flows. Review diffs before integration; do not reset user changes. Only you may wire the shared `components/housora-app.tsx`, `components/billing-settings.tsx`, `app/globals.css`, entry imports and necessary package/lockfile updates. Resolve overlaps deliberately, not by accepting whole conflicting files. Remove superseded reachable UI without deleting working behavior. Apply the copy registry after layout integration.

Prioritize reproduced mobile blockers before decorative effects. Integrate Aurora only on the public entry area; neutral editing surfaces. Keep one clear 3D entry per context, usable paid-action confirmations, no Space/Direction/Result decorative stepper. Use the already installed lucide-react. Do not change commercial prices/entitlements or add fake integrations.

Run actual typecheck, test suite and production build; document exact results. Capture final local screenshots at 1440×900, 1024×768, 768×1024, 390×844, plus 320px overflow and 200% zoom. Test real navigation and non-billable UI interactions; mocked provider tests must be labelled. Verify reduced motion, focus, safe areas, keyboard overlap, long names, errors and existing-model rendering. No paid Grok/SAM/Tripo retests. Real physical AR, authenticated deployed authorization, checkout/webhooks and production version parity remain explicit gates if not tested.

Prepare, but do not execute, Convex/Vercel deployment steps. List missing legal environment variable NAMES only; never invent business identity or declare legal approval. Keep generated tsconfig.tsbuildinfo out of the implementation changes without deleting unrelated user work. No push/deploy until approval. Final report: implemented, tested with evidence, blocked, and exact owner actions before launch. Do not call the site 10/10 or production-ready with unresolved gates.
