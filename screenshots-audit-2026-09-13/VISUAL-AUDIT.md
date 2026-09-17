# Housora — evidence-based visual audit

Date: 13 September 2026. Evidence: 102 archived desktop PNGs, individually inspected; prior browser interaction observations explicitly separated below. Audit only: no application code changed, no deploy or push.

## Verdict

**Not ready for confident public release.** The most consequential problems are the Edit/3D layout, unstyled AR state, unreliable gallery metadata, save-error recovery, checkout failure reported in the preceding interaction audit, and the deployment's own unfinished operator/legal-review notices.

This is a complete review of the **102 files in this archive**, not a claim of complete coverage of the website or every possible bug. Some images capture transitional/stale states instead of the state named in the filename. Several assets load in later frames. Mobile, completed generation, populated segmentation, completed 3D/AR, authentication and important error states are not covered. The older user-provided mockups/screenshots are requirements context, not proof of the present deployment's behavior.

There are **43 actionable finding groups**, including **3 explicit retest hypotheses**, not43 confirmed software bugs. Counts: P2: 24; P1: 13; P3: 3; RETEST: 3. P1 = fix/resolve before release; P2 = important usability/polish; P3 = lower-risk refinement; RETEST = insufficient evidence for a confirmed defect. Priority is not a measured probability or security severity.

## What is worth keeping

- Four clear entry points (Create/Edit/3D/AR), recognizable sidebar labels and consistent basic dark palette.
- Real photography and a consistent gallery grid when images have loaded.
- Library source badges, search and counts; project thumbnails and dates.
- Credit confirmations clearly show cost, balance and remaining balance. Preserve explicit spending consent.
- Honest unavailable-feature and draft disclosures: repair the underlying readiness gaps, do not camouflage them.

## Screen health

| Flow | Current visual health | First action |
|---|---|---|
| New Project | Usable, needs refinement | Scope copy and distinguish Recent items |
| Create | Significant UX gaps | Visible Generate, contained preview, correct visual selectors/popovers |
| Edit | Blocking layout problems | Flexible centered canvas + actual right inspector; prompt docking |
| 3D | Major layout/content problems | Fill workspace, reduce instructions, keep actions visible |
| AR | Visibly unfinished | Restore styled container/preview/source-selection layout |
| Images | Data and loading problems | Reconcile photo/category/title/prompt records |
| Library | Mostly coherent; source-filter mismatch | Separate Uploaded from Saved and validate opening/persistence |
| Pricing | Release-path risk | Reproduce checkout error; repair scoped feedback |
| Projects | Usable but noisy | Compact header/action, correct terminology |
| Settings | Mixed; several ineffective/future controls | Remove contradictory states, fix save/recovery presentation |
| Legal | Readability and disclosed readiness blockers | Darken text; complete operator details and review |

## Evidence quality corrections

The previous archive README describes intended captures, not reliably verified rendered states. Its coverage should not be treated as a test-pass record.

- 002 is still New Project;004 is still the type chooser;007/008/011/014/015/018/019/020/024 do not show the menus/results their names suggest.
- 042 is gallery grid,043 is a material dialog with the prompt **collapsed**.
- **All ten044-gallery-detail files show gallery grids, not ten detail dialogs.**
- 066 is Library grid;067 is Create with a save error, not Pricing top;069 is Monthly,072 is Pricing,075 is Projects,076 is account menu, not Settings profile.
- 071 does not visibly show the reported checkout error. Use prior interaction evidence only, until correctly recaptured.
- Privacy and Terms last sections/footer are not fully covered by their three scroll frames.
- Transient double highlighting and blank images are not automatically permanent defects. Pointer overlays/hover and screenshot timing can explain them.

## Findings and exact repair checks

### G01 · P2 · Small text and weak hierarchy

**Observed:** Secondary labels, card metadata, sidebar credits and settings helper text are visually tiny/faint compared with large decorative headings. This increases reading effort; exact font sizes and contrast ratios have not been measured.

**Evidence:** [039-edit-empty.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/039-edit-empty.png), [063-library-all.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/063-library-all.png), [077-settings-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/077-settings-workspace.png).

**Fix / acceptance:** Use a shared type scale: proposed body 14–16 CSS px, helper text 12–14, line-height 1.45–1.6. Keep decorative serif for page titles, not tiny panel titles. Measure contrast in-browser and check 200% zoom; screenshots cannot establish accessibility compliance.

### G02 · P2 · Recent projects cannot be distinguished by name

**Observed:** Two sidebar entries both say Interior design without dates or previews. Main cards offer thumbnails/dates, but the fastest navigation path does not.

**Evidence:** [001-new-project.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/001-new-project.png), [087-projects-final.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/087-projects-final.png).

**Fix / acceptance:** Use meaningful default names from project context, preserve user names, and add a compact thumbnail or date. Test two projects with the same name and very long names without overflow.

### G03 · P1 · Implementation notes are exposed as product copy

**Observed:** Visible examples include 'Only real segmentation appears here', 'No fake result', 'parent applies via existing callback', 'real SAM mask', 'parent dialog', 'canonical Discover library', and 'Balances are formatted with tabular numbers'. These make the product read like an unfinished developer demo.

**Evidence:** [028-edit-spotlight.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/028-edit-spotlight.png), [033-edit-reframe-square.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/033-edit-reframe-square.png), [036-3d-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/036-3d-bottom.png), [043-material-prompt-expanded.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/043-material-prompt-expanded.png), [081-settings-billing.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/081-settings-billing.png).

**Fix / acceptance:** Replace with brief action-oriented language: Select an object; Mark an area to edit; Choose a photo of one object; Your balance. Move implementation details to documentation/logs. Search all visible copy, not just these examples.

### C01 · P2 · Create description undersells its scope

**Observed:** The tool chooser describes room redesign, although Create supports Interior, Exterior and Garden.

**Evidence:** [001-new-project.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/001-new-project.png).

**Fix / acceptance:** Use 'Redesign an interior, exterior or garden'. Keep the existing four-tool organization; do not add a fifth route or another onboarding step.

### C02 · P1 · Generate is not visibly discoverable in the empty composer

**Observed:** The prompt explicitly says to hit generate, but no visible Generate action appears at the right of the composer across the empty-state captures. A later confirmation exists, so this is not proof that generation is absent.

**Evidence:** [003-create-design-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/003-create-design-types.png), [018-interior-room-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/018-interior-room-types.png), [024-create-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/024-create-example.png).

**Fix / acceptance:** Keep a visible Generate control at the far right, disabled with an understandable reason before upload. Verify it remains visible before/after upload, at every design type and viewport width; horizontal scrolling must never hide the primary action.

### C03 · P2 · Visual choices have indistinguishable blank loading states

**Observed:** Design-type previews are blank in003 and loaded in004. Exterior style previews are mostly blank in006. This supports a weak loading presentation, not a proven permanent missing-asset bug.

**Evidence:** [003-create-design-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/003-create-design-types.png), [004-create-exterior.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/004-create-exterior.png), [006-exterior-styles.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/006-exterior-styles.png).

**Fix / acceptance:** Reserve image dimensions, show explicit skeleton/loading state and retry/fallback on actual failure. Capture after image decode at normal and throttled connection speeds. Verify each style asset instead of assuming a generic fallback is correct.

### C04 · P2 · Visual selection requirement is only partly represented

**Observed:** Building and Garden-area choices are text lists; Interior Details palettes are text chips without swatches. These are harder to compare visually and differ from the requested picture-led selection.

**Evidence:** [005-exterior-building-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/005-exterior-building-types.png), [013-garden-area.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/013-garden-area.png), [021-interior-details.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/021-interior-details.png).

**Fix / acceptance:** Add relevant thumbnails for type/style choices and palette swatches. Keep labels and selected checks. Palette also appears as a composer control and in Details: use one source of state and avoid contradictory selection.

### C05 · P2 · Popovers lose context and feel detached from their triggers

**Observed:** Details opens at the far-left content edge while its trigger sits farther right. Tall menus have their title/Close scrolled away, clipped edge rows and nested scroll areas.

**Evidence:** [009-exterior-details-scrolled.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/009-exterior-details-scrolled.png), [017-garden-details-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/017-garden-details-bottom.png), [023-interior-details-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/023-interior-details-bottom.png).

**Fix / acceptance:** Anchor near the trigger while clamping to viewport; keep title/Close fixed inside a max-height popover. Scroll only the choices. Proposed width320–420px for lists; larger only for image grids. Show selected-extra count on Details; verify Escape, outside-click and focus return.

### C06 · P2 · Upload and uploaded-image presentation do not match the requested stage

**Observed:** The empty dropzone is a wide landscape box, not the narrower paper-like treatment requested. In067 the selected photo is also a wide crop and the page still says Upload a picture despite already showing an image.

**Evidence:** [018-interior-room-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/018-interior-room-types.png), [024-create-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/024-create-example.png), [067-pricing-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/067-pricing-top.png).

**Fix / acceptance:** Use a contained preview that preserves source aspect ratio, with a narrower empty stage agreed from the reference. Change helper copy after upload to the next action. Preserve the bottom composer. Its fixed behavior still needs live viewport/scroll testing, not just these frames.

### C07 · P3 · Credit confirmations have excessive empty footer space

**Observed:** Cost, balance and remaining balance are clearly presented, which is good. The large dark footer block and repeated reassurance make a short confirmation taller than necessary.

**Evidence:** [025-create-generation-confirmation.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/025-create-generation-confirmation.png), [027-edit-scan-confirmation.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/027-edit-scan-confirmation.png).

**Fix / acceptance:** Keep cost and consent intact. Use a compact footer with24px padding and one concise reassurance. Replace 'room-type inference' with plain language. Verify Escape/focus trapping and no charge when Cancel is chosen.

### E01 · P1 · Edit workspace layout is visibly broken

**Observed:** A roughly450px-wide canvas sits beside an approximately400px inspector in the middle, with about420px of unused black area on the right in a1518px capture. A horizontal scrollbar is visible below the canvas. These are approximate image pixels, not measured CSS.

**Evidence:** [026-edit-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/026-edit-example.png), [028-edit-spotlight.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/028-edit-spotlight.png), [033-edit-reframe-square.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/033-edit-reframe-square.png).

**Fix / acceptance:** Use a flexible canvas column plus a right-edge inspector, min-width:0 on flexible children, and contain the entire image. Proposed inspector360px,400px only on wide screens. No page/canvas horizontal scrollbar at fit-to-screen. Retest landscape and portrait images.

### E02 · P1 · Editing prompt competes with unrelated stacked panels

**Observed:** The source image, scan empty state and version history consume the inspector; Spotlight/Draw prompt sits low and requires internal scrolling. In028 the current-image card content is visibly clipped.

**Evidence:** [026-edit-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/026-edit-example.png), [028-edit-spotlight.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/028-edit-spotlight.png), [030-edit-draw.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/030-edit-draw.png).

**Fix / acceptance:** Make the objects list the scrollable area and dock the active prompt/actions at the bottom. Compact source-image row and version history. Keep the prompt and Apply reachable without scrolling past Scan while using manual tools.

### E03 · P2 · Toolbar is too compressed for a central editing control

**Observed:** Small icons, two-line labels and tiny shortcut letters create a dense miniature toolbar under a large image. This does not match the simple readable reference.

**Evidence:** [026-edit-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/026-edit-example.png), [031-edit-drawn-mask.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/031-edit-drawn-mask.png).

**Fix / acceptance:** Use proposed44px hit areas inside a52–56px floating bar,20px icons and8px spacing. Keep one-line tool names or accessible tooltips with shortcuts. Match SelectV, SpotlightS, DrawD, ReframeR and Fullscreen consistently.

### E04 · RETEST · Multiple tools appear highlighted in transitional frames

**Observed:** 028 shows Select and Spotlight tinted;030 shows Spotlight and Draw. This can be hover/focus/transition, not necessarily two active tools.

**Evidence:** [028-edit-spotlight.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/028-edit-spotlight.png), [030-edit-draw.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/030-edit-draw.png), [032-edit-reframe.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/032-edit-reframe.png).

**Fix / acceptance:** Recapture with pointer away after rendering settles. Ensure persistent selection has a distinct single treatment and hover/focus does not imply another active tool. Confirm keyboard shortcuts do not fire while typing.

### E05 · P2 · Spotlight interaction differs from the requested local editor

**Observed:** The visible rectangle has its instructions in the remote inspector rather than a compact Describe edits control next to the region. The screenshot does not prove the mask is sent correctly.

**Evidence:** [029-edit-spotlight-selection.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/029-edit-spotlight-selection.png).

**Fix / acceptance:** Show the selected region clearly, with local prompt or obvious linked selection chip and clear/remove action. Preserve the same region/prompt in the inspector. Test drag in every direction, resize, tiny selections and coordinate mapping after zoom.

### E06 · P2 · Draw lacks visible adjustment tools

**Observed:** A stroke is visible, but no nearby brush-size, eraser or stroke undo controls appear. A single Clear action in the inspector is not equivalent.

**Evidence:** [031-edit-drawn-mask.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/031-edit-drawn-mask.png).

**Fix / acceptance:** Provide a compact contextual brush-size/eraser/undo row only when Draw is active. Verify pointer/touch drawing, image-bound clipping, undo and that edits target the actual mask rather than decorative strokes.

### E07 · RETEST · Reframe preview does not visibly communicate its bounds

**Observed:** In the narrow canvas only horizontal frame edges are apparent. Switching to1:1 does not visibly change them in033; a delayed screenshot or clipping could explain this.

**Evidence:** [032-edit-reframe.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/032-edit-reframe.png), [033-edit-reframe-square.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/033-edit-reframe-square.png).

**Fix / acceptance:** After layout repair, show all crop bounds, handles and dimmed outside area. Verify each ratio's actual geometry and the saved result. Keep explicit Apply/Cancel; do not claim a ratio works just because its button is selected.

### E08 · RETEST · Fullscreen was not demonstrated

**Observed:** 034 looks like the normal Reframe view. The preceding interaction reportedly produced no visible expansion, but this stale-prone archive cannot isolate the cause.

**Evidence:** [034-edit-fullscreen.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/034-edit-fullscreen.png).

**Fix / acceptance:** Test live with stable captures before/after, Escape and browser support. Expand the actual canvas, not an unchanged wrapper. If unavailable, provide a clear fallback rather than a silent button.

### E09 · P1 · Empty Edit exposes the entire editor before upload

**Observed:** 039 shows Objects & regions, Current image/No image, Scan1credit, version history and toolbar with no image. The requested flow was only a simple upload first.

**Evidence:** [039-edit-empty.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/039-edit-empty.png).

**Fix / acceptance:** Hide object tools, scan, versions and prompt until a valid image is loaded. Center a compact dropzone with one short helper. Then transition to the full editor; scan consent can occur after upload without showing meaningless empty controls.

### D01 · P1 · 3D repeats the broken column distribution

**Observed:** The preview and narrow settings card occupy only the left/middle; a huge unused right block remains. The action area is low or clipped while the preview itself is mostly empty.

**Evidence:** [035-3d-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/035-3d-workspace.png), [036-3d-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/036-3d-bottom.png).

**Fix / acceptance:** Use the full available workspace: flexible preview plus320px controls,24px gap, bottom action visible. Fit within viewport or scroll one intentional area. Test uploaded photo, working job, completed viewer and error states.

### D02 · P2 · 3D repeats instructions instead of guiding one action

**Observed:** Upload dropzone, introductory text, Best results bullets, a long paragraph, three large steps and Choose image repeat the same idea. Main action is visually de-emphasized.

**Evidence:** [035-3d-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/035-3d-workspace.png), [038-ar-create-from-photo.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/038-ar-create-from-photo.png).

**Fix / acceptance:** Keep one sentence: 'Upload one clearly visible object on a simple background.' One upload affordance, preview and Generate12credits action with confirmation. Collapse optional tips. When coming from Edit, show the actual selected crop rather than asking for another image.

### A01 · P1 · AR empty state looks unstyled

**Observed:** Content starts flush against the sidebar boundary; default-looking button, inconsistent type and the run-together 'Preview appears hereSelect...' make this screen visibly unfinished.

**Evidence:** [037-ar-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/037-ar-workspace.png).

**Fix / acceptance:** Apply the existing page/container/button styles. Proposed24px padding,24px column gap, a real preview card and compact model-source panel. Separate heading/body with8px. Fix styling before adding decorative content.

### A02 · P2 · AR has weak continuation context

**Observed:** The empty model path explains the dependency but has no clear visual model chooser/preview structure. Entering3D from AR shows the ordinary3D page without a visible return-to-AR intent.

**Evidence:** [037-ar-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/037-ar-workspace.png), [038-ar-create-from-photo.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/038-ar-create-from-photo.png).

**Fix / acceptance:** Keep two clear options: Choose a saved3D model / Create from a photo. Preserve return-to-AR intent through generation and show View in AR when ready. On desktop use a phone handoff only when supported; no fake camera preview. The completed-model path is not covered.

### I01 · P2 · Gallery loading appears as unexplained empty cards

**Observed:** Many screenshots show solid blank cards; subsequent frames load the same assets. There is no visible distinction between loading and failure.

**Evidence:** [040-images.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/040-images.png), [041-images-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-1.png), [041-images-scroll-6.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-6.png), [042-material-study-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/042-material-study-detail.png).

**Fix / acceptance:** Use consistent skeletons and error fallback/retry. Preload near-viewport images and preserve dimensions. Test a settled scroll pass and failed asset URL; don't label every blank as a broken source.

### I02 · P1 · Gallery image-to-metadata mapping is unreliable

**Observed:** Several unmistakable category/photo mismatches are visible. This undermines discovery and could pass wrong context into Create; the downstream payload is untested.

**Evidence:** [041-images-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-2.png), [044-gallery-detail-04.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-04.png), [044-gallery-detail-06.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-06.png), [044-gallery-detail-09.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-09.png).

**Fix / acceptance:** Audit every asset against stable record ID, title, category, style and prompt. Fix data, not just captions. Compare grid, dialog, search/filter and Use this direction payload. See the mismatch table below.

### I03 · P2 · Room inspiration and detail assets are mixed inconsistently

**Observed:** A shopping collage appears as Tactile kitchen and a brick close-up as a Bedroom card. Meanwhile the designated detail section shows a full kitchen and a garden. The explanation 'without deleting assets' is implementation language.

**Evidence:** [041-images-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-3.png), [044-gallery-detail-05.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-05.png), [042-material-study-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/042-material-study-detail.png).

**Fix / acceptance:** Classify imagery honestly: room photo vs material/detail vs moodboard. Keep correct source assets, replace unsuitable defaults and remove repository-maintenance explanations from UI.

### I04 · P2 · Gallery detail CTA overwhelms the panel

**Observed:** Use this direction is approximately128 screenshot pixels tall for a single-line action; save action and helper are tiny. The detail copy makes an unsupported 'verified mapping' claim even while visible gallery mappings disagree.

**Evidence:** [043-material-prompt-expanded.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/043-material-prompt-expanded.png).

**Fix / acceptance:** Use a48px primary button, normal secondary action and concise image-specific description. Keep photograph dominant. Verify prompt disclosure, bookmark state and the direction handoff. This frame's prompt is collapsed despite its filename.

### L01 · P2 · Library source categories differ from the requested distinction

**Observed:** Uploaded & saved combines user uploads and bookmarked inspiration, although the user requested Uploaded separately. Source badges help but the filter loses that distinction.

**Evidence:** [063-library-all.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/063-library-all.png), [066-library-item-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/066-library-item-detail.png).

**Fix / acceptance:** Keep All / Generated / Uploaded as requested, with Saved as a separate filter if retained. Show counts and persistent selection consistently. Test search+filter combinations and zero states; transitional highlights in064/065 need recapture.

### B01 · P1 · Opening a saved image reports failure to save the project

**Observed:** 067 clearly shows the image opened but the project could not be saved. This is a real user-facing failure message, not proof of its backend cause or actual data loss.

**Evidence:** [067-pricing-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/067-pricing-top.png).

**Fix / acceptance:** Reproduce safely, preserve image/prompt locally, provide Retry save and visible saving/saved/error status. Verify a refresh and reopen restores the image/settings. Diagnose network/backend/auth only with evidence; do not blame the user's device from this toast.

### B02 · P1 · Save-error notification leaks into unrelated pages

**Observed:** The same project error persists across Pricing, Projects and Settings and covers content/actions. It tells users to save in an editor they are no longer viewing, without a visible recovery button.

**Evidence:** [068-pricing-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/068-pricing-scroll-2.png), [074-project-rename.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/074-project-rename.png), [080-settings-notifications.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/080-settings-notifications.png).

**Fix / acceptance:** Keep persistent unsaved status attached to its project; provide a direct recovery route. Make transient toasts dismissible and scoped, avoid covering sticky composers/footers, and ensure subsequent errors are not masked.

### B03 · P1 · Checkout failed in the preceding interaction audit

**Observed:** Prior browser feedback reported 'Whop could not open checkout. Please wait a moment and try again.'070 shows loading;071 does NOT show that error, only the unrelated save toast. This is prior interaction evidence, not screenshot verification.

**Evidence:** [070-pricing-creator-checkout.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/070-pricing-creator-checkout.png), [071-pricing-checkout-error.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/071-pricing-checkout-error.png).

**Fix / acceptance:** Reproduce checkout creation without making a purchase, inspect the actual failure and capture the correct error state. Provide Retry and useful support context. Verify monthly/yearly and credit-pack paths separately before accepting payments.

### P01 · P2 · Pricing alignment and billing context need cleanup

**Observed:** Free price is lower than paid prices due different intro height. Monthly state069 includes an upfront-yearly explanation. Credit allowances in070 look clipped but072 renders fully, so truncation needs a settled check.

**Evidence:** [069-pricing-yearly.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/069-pricing-yearly.png), [070-pricing-creator-checkout.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/070-pricing-creator-checkout.png), [072-projects.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/072-projects.png).

**Fix / acceptance:** Align intro/price/allowance/action rows, show billing-period explanation conditionally, retain clear upfront annual total and monthly credit refresh. Verify slow-render and long localized copy. Do not treat this screenshot as current verified price guidance.

### P02 · P2 · Projects page has oversized CTA and contradictory navigation language

**Observed:** A page-width New project bar dominates two small cards. Several explanatory paragraphs mention Saved, which is not a visible main navigation item. Header, divider and helper rows push actual projects down.

**Evidence:** [087-projects-final.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/087-projects-final.png).

**Fix / acceptance:** Use compact heading and New project action on one row, then projects. Refer to Library/Saved consistently with real navigation. Remove repetitive housekeeping copy; retain thumbnails and dates.

### P03 · P3 · Inline rename has little completion guidance

**Observed:** The input and focus outline are clear, but screenshot074 has no visible save/cancel cue. This is an affordance issue, not proof that Enter/Escape are broken.

**Evidence:** [074-project-rename.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/074-project-rename.png).

**Fix / acceptance:** Provide subtle Enter to save/Escape to cancel or compact confirm/cancel controls. Verify blur behavior, empty names, duplicates, persistence and keyboard navigation without accidental project opening.

### S01 · P2 · Settings spend too much space on title and push actions below viewport

**Observed:** The huge heading plus local navigation consumes space; Workspace Save changes is partially below the captured view and the unrelated toast obscures it. Current/previous nav items look similarly highlighted in several transition frames.

**Evidence:** [077-settings-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/077-settings-workspace.png).

**Fix / acceptance:** Compact the header, maintain a reachable save footer, and show unsaved state clearly. Recapture after transitions to verify only one persistent selected tab. Test unsaved navigation rather than relying on static Saved text.

### S02 · P2 · AI confirmation preference is contradictory

**Observed:** The control is disabled and labelled required, while helper text discusses turning it off and says that doing so changes nothing. It presents an ineffective preference.

**Evidence:** [078-settings-ai-defaults.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/078-settings-ai-defaults.png).

**Fix / acceptance:** Use a simple informational statement 'We ask before spending credits' with no toggle if mandatory. Keep only preferences that actually affect behavior.

### S03 · P3 · Team tab is a prominent dead end

**Observed:** The page honestly says unavailable, but uses a full settings destination and several paragraphs for a feature with no available action.

**Evidence:** [079-settings-team.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/079-settings-team.png).

**Fix / acceptance:** Hide until available or mark Coming soon compactly. Do not replace it with fake invitations or imply that project-sharing links are team permissions.

### S04 · P2 · Checked notification settings imply functionality that is not delivered

**Observed:** Several checked options are shown while the screen states no email/push/alerts are sent. Users can reasonably expect a checked Generation updates option to notify them.

**Evidence:** [080-settings-notifications.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/080-settings-notifications.png).

**Fix / acceptance:** Do not present future-only preferences as active. Disable with a concise Not available label or omit until delivery works. Test one real notification end-to-end before enabling the setting.

### S05 · P2 · Billing recovery and subscription management are indirect

**Observed:** The UI points to receipt/support for cancellation and invoices, while the main CTA only opens plans. A free plan also says credits renew with plan; the very high test balance alone is not a defect.

**Evidence:** [081-settings-billing.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/081-settings-billing.png).

**Fix / acceptance:** For paid accounts provide a direct authenticated Manage billing route if supported; for free accounts tailor copy to one-time starter credits. Preserve accurate balances; remove typography implementation notes.

### S06 · P2 · Privacy guidance contradicts unavailable session replay

**Observed:** Session replay is declared unavailable, but nearby copy instructs users to enable analytics first. Cookie copy also discusses replay exclusions despite disabled status.

**Evidence:** [082-settings-privacy.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/082-settings-privacy.png), [086-cookies-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-scroll-1.png).

**Fix / acceptance:** Use one accurate statement for current behavior, remove dependency instructions for unavailable features, and verify actual consent behavior independently. This is a product-copy consistency audit, not a privacy compliance certification.

### J01 · P1 · Legal-page body copy has very weak visual contrast

**Observed:** Light-gray paragraphs on cream are visibly difficult to read across every legal page. Important notices are similarly faint; this is a legibility risk, not a measured WCAG result.

**Evidence:** [083-privacy-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-scroll-2.png), [084-terms-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-scroll-2.png), [085-refunds-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-scroll-1.png).

**Fix / acceptance:** Use a substantially darker body color and measure contrast, including notices. Proposed16px body,1.6 line-height, readable line width and32px section spacing. Keep legal pages calm without sacrificing readability.

### J02 · P1 · The deployment explicitly declares unfinished operator details and review

**Observed:** Privacy/Terms/Refunds/Cookies show Legal draft, review required and missing operator details; contact tables say Pending. This alone prevents confidently calling this release ready.

**Evidence:** [083-privacy-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-top.png), [085-refunds-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-scroll-2.png), [086-cookies-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-top.png).

**Fix / acceptance:** Owner must provide real operator/contact information and obtain appropriate review. Do not merely hide warnings or flip a reviewed flag. Validate the actual public contact route. No legal sufficiency conclusion is made by this visual audit.

### J03 · P2 · Raw escape sequences appear in Terms

**Observed:** The suspension paragraph visibly contains literal backslash-u2014 text instead of punctuation.

**Evidence:** [084-terms-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-scroll-3.png).

**Fix / acceptance:** Correct escaping/rendering and scan visible copy for other raw escapes, placeholders or implementation strings. Verify rendered prose, not only source text.

## Gallery mapping examples that need reconciliation

These describe visible imagery, not a claim about the source-code cause. Verify all records, including any not shown here.

| Card metadata | Visible image | Evidence |
|---|---|---|
| Stone and shadow · Bathroom | Empty glazed room, no bathroom fixtures visible | [041-images-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-1.png) |
| Sculptural entry · Hallway | Dining table/chairs | [041-images-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-2.png) |
| Sunlit kitchen · Kitchen | Living-room seating | [041-images-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-2.png) |
| Tactile kitchen · Kitchen | Annotated living-room shopping collage | [044-gallery-detail-04.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-04.png) |
| Textural bath · Bathroom | Bed/bedroom | [044-gallery-detail-04.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-04.png) |
| Earthy dining · Dining room | Sofa/chair and coffee table | [044-gallery-detail-05.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-05.png) |
| Gentle color · Bedroom | Brick close-up | [044-gallery-detail-05.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-05.png) |
| Layered neutrals · Bedroom | Bathtub/bathroom | [044-gallery-detail-06.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-06.png) |
| Sculptural table · Dining room | Sofa/coffee table | [044-gallery-detail-06.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-06.png) |
| Daylight studio · Home office | Living seating, no desk visible | [044-gallery-detail-07.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-07.png) |
| The reading room · Living room | Dining table/chairs | [044-gallery-detail-07.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-07.png) |
| Balanced palette · Living room | Kitchen | [044-gallery-detail-08.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-08.png) |
| Monochrome corner · Living room | Wood door detail | [044-gallery-detail-09.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-09.png) |
| Light and line · Hallway | Living room | [044-gallery-detail-09.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-09.png) |
| Soft contrast · Bedroom | Sofa/living seating | [044-gallery-detail-10.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-10.png) |
| Material study · Detail | Full kitchen | [042-material-study-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/042-material-study-detail.png) |
| Crafted corner · Detail | Garden | [042-material-study-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/042-material-study-detail.png) |

## Proposed spacing specification — not measurements of current CSS

Use these as implementation acceptance targets, then validate visually at actual CSS viewport sizes. Do not blindly apply them as global overrides.

| Element | Proposed target |
|---|---|
| Spacing scale |4,8,12,16,24,32,48px; avoid arbitrary per-screen offsets |
| Desktop workspace padding |24px; main column min-width0 |
| Canvas/inspector |flexible canvas +360px inspector,400px only on wide screens |
| 3D control panel |320px with24px column gap;12–16px internal gaps |
| Bottom composer |18px above bottom, width min(1280px, available content width−56px), controls8px apart |
| Mobile composer |8px safe-area-aware margins; only optional controls may scroll horizontally |
| Icon controls |44px hit area,20px icons; clear accessible names and focus state |
| Toolbar |52–56px high,8px gaps; do not cover image or prompt |
| Normal primary actions |44–48px high, not128px-tall blocks |
| Popovers |Viewport-clamped,8px trigger gap, sticky title/Close, one internal scroll region |
| Dialogs |24px padding,16–24px section gaps, compact footer; max-height with reachable actions |
| Body/helper |14–16px /12–14px, readable contrast; legal body16px with1.6 line-height |
| Gallery/project cards |Consistent12–16px gutters; contained metadata, correct asset pairing |

## Repair order and publication gate

1. **Layout foundation:** E01,E02,E09,D01,A01. Repair shared layout constraints before tuning individual margins. Capture both portrait and landscape images at1366×768,1440×900,1920×1080 plus390×844 and360×800 CSS viewports.
2. **Core action reliability:** B01,B02,B03,C02. Verify upload → settings → confirmation → result → save → refresh/reopen; errors must preserve user work and expose a real retry.
3. **Content integrity:** I02,I03,G03,J03. Reconcile every gallery record and remove implementation prose/raw escapes.
4. **Tool behavior:** E04–E08,A02,D02. Test real masks, crop geometry, keyboard, selected-object3D handoff and model lifecycle. Do not substitute screenshots of disabled controls for a passed test.
5. **Polish:** C03–C07,G01–G02,I01,I04,L01,P01–P03,S01–S06. Apply shared spacing/type rules while preserving requested flow.
6. **Owner readiness:** J02 and actual billing/support configuration. Do not invent legal entity/address or mark review complete on the owner's behalf.
7. **Re-run with settled screenshots:** Move pointer off controls, wait for intended state and images to render, inspect each saved file, and name it after the pixels actually captured. Track pass/fail per requirement.

Publication gate: no unresolved P1 findings; each critical end-to-end path passes with saved evidence; no horizontal overflow at agreed viewports; keyboard/focus and measured contrast checked; errors/cancellation/retry tested; actual operator/support information and review completed. This supports a release decision, not a guarantee of zero bugs.

## Functional tests still required — not proven by screenshots

- Upload via drop and picker; invalid/oversized file; portrait/landscape; cancellation; replacing image; no lost work on navigation.
- Correct dynamic Interior/Exterior/Garden options, selected-state persistence, prompt payload, visible Generate before/after upload.
- Object detection with actual results; empty/error cases; hover mask matches row and object; no fabricated objects; selected crop enters3D without re-upload.
- Spotlight rectangle and Draw mask coordinates after scaling; prompt applies to right region; crop ratios and saved output; Undo/Redo and shortcuts while typing.
-3D queue/progress/completion/failure/retry/cancel; repeated-click protection; refresh while working; download valid model; restore project source.
-AR existing model, photo-to-model continuation, desktop handoff, supported iOS/Android device, denied camera permission, unsupported device; no claim of phone AR success from desktop images.
- Project create/rename/pin/archive/delete/share and access rules using disposable test data; direct URLs and refresh; private links must not expose unintended images.
- Library filters/search/empty states and saved-item persistence; gallery detail/use/save for every record, not only grid tiles.
- Checkout creation for each billing period/pack; provider errors; test-mode payment lifecycle, cancellation/refund and balance reconciliation without accidental real purchases.
- Login/signup/session expiry, slow/offline network,404/error boundaries; accessibility labels, tab order, focus trap/return, contrast and200% zoom.
- Profile/account-security/support screens and final legal sections missing from archive; mobile/tablet; device safe areas and virtual keyboard.

Do not attribute failures to the user's device or external provider without logs/reproduction. No security audit, code audit, legal opinion, performance benchmark or backend correctness certification was performed in this visual-only review.

## Per-image review ledger —102/102 inspected

Each row records the actual saved image. Repeated findings are linked by ID instead of counting one layout problem as many separate bugs. 'Not shown' is an evidence gap, not proof that the feature does not exist.

| # | Screenshot | Actual state and audit note |
|---|---|---|
| 1 | [001-new-project.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/001-new-project.png) | New Project chooser. Four clear paths; oversized introductory area, tiny descriptions, Create copy only mentions rooms. Recent titles are indistinguishable. G01,G02,C01. |
| 2 | [002-create.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/002-create.png) | Same tool chooser, NOT the Create upload state named by file. Evidence gap; same observations as 001. |
| 3 | [003-create-design-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/003-create-design-types.png) | Design-type chooser open. Preview areas blank in this frame; later 004 loads them. Bottom composer has no visible Generate action. C02,C03,C05. |
| 4 | [004-create-exterior.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/004-create-exterior.png) | Design-type chooser with Interior selected, NOT Exterior workspace. Loaded photographs improve comprehension; no visible Generate. C02,C05. |
| 5 | [005-exterior-building-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/005-exterior-building-types.png) | Exterior building-type list open. Text-only options, long scrolling popover and clipped final options. C04,C05. |
| 6 | [006-exterior-styles.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/006-exterior-styles.png) | Exterior style grid open. Most previews blank, loading/failure unproven; compare loaded states before declaring broken assets. C03. |
| 7 | [007-exterior-lighting.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/007-exterior-lighting.png) | Exterior empty upload; Lighting menu NOT shown. Wide upload target, no visible Generate, ambiguous Auto control. C02,C06. |
| 8 | [008-exterior-details.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/008-exterior-details.png) | Exterior empty upload; Details menu NOT shown. Same C02,C06. Do not infer failed click from one frame. |
| 9 | [009-exterior-details-scrolled.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/009-exterior-details-scrolled.png) | Exterior Details middle: header and Close have scrolled away; dense options and nested scrolling. C05. |
| 10 | [010-exterior-details-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/010-exterior-details-bottom.png) | Exterior Details bottom: same lost header/close and remote popover anchoring. C05. |
| 11 | [011-create-aspect-ratio.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/011-create-aspect-ratio.png) | Exterior empty upload; aspect-ratio menu NOT shown. C02,C06; aspect-ratio state unverified. |
| 12 | [012-create-garden.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/012-create-garden.png) | Design-type chooser, Exterior selected; Garden workspace NOT shown. C05; state-name mismatch. |
| 13 | [013-garden-area.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/013-garden-area.png) | Garden-area list visible; text-only rows and clipped last entry. Dynamic Garden upload copy is correct. C04,C05. |
| 14 | [014-garden-styles.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/014-garden-styles.png) | Garden empty upload; style menu NOT shown. C02,C06. |
| 15 | [015-garden-details.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/015-garden-details.png) | Garden empty upload; Details menu NOT shown. C02,C06. |
| 16 | [016-garden-details-middle.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/016-garden-details-middle.png) | Garden Details middle: lost header, low-contrast small labels, long scrolling choices. C05,G01. |
| 17 | [017-garden-details-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/017-garden-details-bottom.png) | Garden Details bottom: same; maintenance defaults and climate visible, no summary of extra selections. C05. |
| 18 | [018-interior-room-types.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/018-interior-room-types.png) | Interior empty upload; room-type menu NOT shown. C02,C06. |
| 19 | [019-interior-styles.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/019-interior-styles.png) | Interior empty upload; style menu NOT shown. C02,C06. |
| 20 | [020-interior-color-palette.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/020-interior-color-palette.png) | Interior empty upload; palette menu NOT shown. C02,C06. |
| 21 | [021-interior-details.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/021-interior-details.png) | Interior Details top: palette duplicated inside Details; palette represented only by text; header/close visible here. C04,C05. |
| 22 | [022-interior-details-middle.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/022-interior-details-middle.png) | Interior Details middle: header/close absent, nested scroll, many text chips. C05. |
| 23 | [023-interior-details-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/023-interior-details-bottom.png) | Interior Details bottom: door/stair choices; context and close not visible. C05. |
| 24 | [024-create-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/024-create-example.png) | Interior empty upload; example image NOT yet shown. C02,C06; cannot certify example success from this frame. |
| 25 | [025-create-generation-confirmation.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/025-create-generation-confirmation.png) | Generation confirmation visible. Cost and resulting balance clear; bulky footer and technical room-type inference copy. C07. Does not prove successful generation. |
| 26 | [026-edit-example.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/026-edit-example.png) | Edit with room photo: narrow left canvas, horizontal scrollbar, inspector in middle and large unused right block. Prompt not visible. E01,E02,G03. |
| 27 | [027-edit-scan-confirmation.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/027-edit-scan-confirmation.png) | Scan confirmation: cost and failure/empty refund explanation visible. Good consent; oversized modal spacing. C07. Scan result not tested. |
| 28 | [028-edit-spotlight.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/028-edit-spotlight.png) | Spotlight inspector: cropped current-image row, stacked scan panel, prompt crowded low; technical copy. Select and Spotlight both look highlighted, potentially transition/focus. E01,E02,E03,E04,G03. |
| 29 | [029-edit-spotlight-selection.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/029-edit-spotlight-selection.png) | Spotlight small rectangle visible. Cannot verify intended drag size, mask coordinate accuracy or submission. Same layout E01,E02; no local prompt near region (E05). |
| 30 | [030-edit-draw.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/030-edit-draw.png) | Draw inspector open. Same cramped layout and technical copy. Draw and Spotlight both look highlighted in this transitional frame; retest stable state. E01,E03,E04. |
| 31 | [031-edit-drawn-mask.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/031-edit-drawn-mask.png) | Draw stroke visible but no visible brush-size/eraser/undo controls adjacent to canvas. E06; functional mask correctness untested. |
| 32 | [032-edit-reframe.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/032-edit-reframe.png) | Reframe visible: only horizontal crop edges visible in narrow canvas; developer callback text exposed. E07,G03. |
| 33 | [033-edit-reframe-square.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/033-edit-reframe-square.png) | 1:1 chosen; preview still same visible horizontal bounds. A stable recapture/application test is needed before declaring ratio broken. E07. |
| 34 | [034-edit-fullscreen.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/034-edit-fullscreen.png) | Same Reframe layout, not visibly fullscreen. Prior click had no visible expansion; treat Fullscreen behavior as unverified/retest E08. |
| 35 | [035-3d-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/035-3d-workspace.png) | 3D empty workspace. Large unused right column, repeated instruction blocks, action below fold, technical SAM wording. D01,D02,G03. |
| 36 | [036-3d-bottom.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/036-3d-bottom.png) | 3D lower scroll. Content ends abruptly; instructions mention parent dialog/duplicate requests. No model preview or generation result verified. D01,D02,G03. |
| 37 | [037-ar-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/037-ar-workspace.png) | AR empty state: effectively unstyled text, no padding against left edge, default-looking button, joined preview heading/body. A01,A02,G03. |
| 38 | [038-ar-create-from-photo.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/038-ar-create-from-photo.png) | AR-to-3D route shows ordinary 3D empty workspace with no clear return-to-AR context. D01,D02,A02. |
| 39 | [039-edit-empty.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/039-edit-empty.png) | Edit empty state already exposes full inspector, scan action and toolbar before any image; sparse upload copy spread vertically. E09. |
| 40 | [040-images.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/040-images.png) | Images grid with several blank tiles. Subsequent 041-scroll-1 loads these. Loading presentation lacks distinct status. I01; Stone and shadow labeled Bathroom but shows empty room (I02). |
| 41 | [041-images-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-1.png) | Images upper grid loaded. Good consistent grid and photos. Stone and shadow metadata mismatch remains. I02. |
| 42 | [041-images-scroll-10.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-10.png) | Images bottom, blank material cards and last row; no loading/error explanation. Developer-ish material-section description. I01,I03. |
| 43 | [041-images-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-2.png) | Images next rows loaded: Sunlit kitchen is living room; Sculptural entry shows dining table. I02. |
| 44 | [041-images-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-3.png) | Images mid grid: Tactile kitchen is a shopping collage; Textural bath shows bedroom. I02,I03. |
| 45 | [041-images-scroll-4.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-4.png) | Images mid grid: Gentle color/Bedroom shows brick texture; Layered neutrals/Bedroom shows bathroom; several blanks. I01,I02. |
| 46 | [041-images-scroll-5.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-5.png) | Images mid grid: Daylight studio/Home office looks like living room, The reading room/Living room shows dining table; blanks below. I01,I02. |
| 47 | [041-images-scroll-6.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-6.png) | Images lower grid mostly blank; Balanced palette/Living room shows kitchen. I01,I02. |
| 48 | [041-images-scroll-7.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-7.png) | Images bottom blank material previews and developer-facing explanation. I01,I03. |
| 49 | [041-images-scroll-8.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-8.png) | Images bottom blank previews again; not proof that images permanently fail. I01,I03. |
| 50 | [041-images-scroll-9.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/041-images-scroll-9.png) | Images bottom blank previews again; state duplicates earlier bottom captures. I01,I03. |
| 51 | [042-material-study-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/042-material-study-detail.png) | Images bottom now loaded, NOT material detail. Material study is full kitchen; Crafted corner is garden, inconsistent with texture/detail-board framing. I02,I03. |
| 52 | [043-material-prompt-expanded.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/043-material-prompt-expanded.png) | Material detail dialog visible but prompt COLLAPSED, not expanded. Oversized Use this direction button; canonical/verified-mapping text shown to users. I04,G03. |
| 53 | [044-gallery-detail-01.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-01.png) | Gallery grid top, NOT detail dialog 01. Stone and shadow image/room mismatch. I02. Detail coverage missing. |
| 54 | [044-gallery-detail-02.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-02.png) | Gallery grid next rows, NOT detail dialog 02. Sunlit kitchen and Sculptural entry mismatches. I02. |
| 55 | [044-gallery-detail-03.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-03.png) | Gallery grid, NOT detail dialog 03. Useful full photos, same I02 mismatches visible at top; detail not captured. |
| 56 | [044-gallery-detail-04.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-04.png) | Gallery grid, NOT detail dialog 04. Tactile kitchen collage and Textural bath bedroom. I02,I03. |
| 57 | [044-gallery-detail-05.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-05.png) | Gallery grid, NOT detail dialog 05. Gentle color brick texture, Earthy dining living seating. I02. |
| 58 | [044-gallery-detail-06.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-06.png) | Gallery grid, NOT detail dialog 06. Layered neutrals bathroom mislabeled Bedroom; Sculptural table living seating mislabeled Dining. I02. |
| 59 | [044-gallery-detail-07.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-07.png) | Gallery grid, NOT detail dialog 07. Daylight studio and The reading room labels don't match room use. I02. |
| 60 | [044-gallery-detail-08.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-08.png) | Gallery grid, NOT detail dialog 08. Balanced palette kitchen mislabeled Living room; same photo reused elsewhere under different metadata. I02. |
| 61 | [044-gallery-detail-09.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-09.png) | Gallery grid, NOT detail dialog 09. Monochrome corner is a door detail, Light and line a living room labeled Hallway. I02,I03. |
| 62 | [044-gallery-detail-10.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/044-gallery-detail-10.png) | Gallery grid, NOT detail dialog 10. Soft contrast/Bedroom shows sofa; Gallery wall shows empty glazed room. I02. No ten-dialog evidence. |
| 63 | [063-library-all.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/063-library-all.png) | Library All state. Useful source badges, search and counts; Uploaded & saved combines different origins; very small metadata. L01,G01. |
| 64 | [064-library-generated.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/064-library-generated.png) | Library filtered to one generated image. Filter highlight looks transitional/hovered; don't call state bug without settled recapture. L01. |
| 65 | [065-library-uploaded-saved.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/065-library-uploaded-saved.png) | Library shows uploaded+saved two images; prior Generated tab still light in this frame. Transition uncertain; L01. |
| 66 | [066-library-item-detail.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/066-library-item-detail.png) | Library uploaded/saved grid, NOT opened-item detail. L01; detail capture absent. |
| 67 | [067-pricing-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/067-pricing-top.png) | Actually Create with Limestone kitchen, not Pricing top. Save-failure toast visible over composer; image cropped wide; upload instruction remains after image present. B01,B02,C06. |
| 68 | [068-pricing-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/068-pricing-scroll-1.png) | Pricing credit packs. Persistent unrelated save error; lower CTA cut in frame, need stable scroll recapture to determine clipping. B02. |
| 69 | [068-pricing-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/068-pricing-scroll-2.png) | Pricing costs table/footer. Clear cost breakdown, but persistent project toast covers page. B02; some small low-contrast text G01. |
| 70 | [068-pricing-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/068-pricing-scroll-3.png) | Pricing costs/footer repeated, unrelated toast persists. B02. |
| 71 | [068-pricing-scroll-4.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/068-pricing-scroll-4.png) | Pricing costs/footer repeated, unrelated toast persists. B02. |
| 72 | [069-pricing-yearly.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/069-pricing-yearly.png) | Monthly pricing shown, NOT yearly selected. Free price baseline lower than paid cards; yearly billing explanation appears above Monthly state. P01,B02. |
| 73 | [070-pricing-creator-checkout.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/070-pricing-creator-checkout.png) | Yearly selected, checkout loading visible. Credit allowances visually clipped in this frame; compare 072 where full. P01; B02 toast persists. |
| 74 | [071-pricing-checkout-error.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/071-pricing-checkout-error.png) | Yearly cards visible, NOT checkout error message. Prior browser interaction reported checkout failure; this file alone does not show it. B03,B02. |
| 75 | [072-projects.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/072-projects.png) | Yearly Pricing, NOT Projects. Fully rendered allowances clarify 070 clipping may be transient. B02,P01. |
| 76 | [073-project-actions.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/073-project-actions.png) | Projects with sidebar action menu visible. Useful destructive color separation. Duplicate recent names, overlarge New project bar, outdated Saved terminology, persistent toast. G02,P02,B02. |
| 77 | [074-project-rename.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/074-project-rename.png) | Inline rename input visible. Good focus outline; no visible confirm/cancel hint. Persistence/Enter/Escape not validated. P03. |
| 78 | [075-account-menu.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/075-account-menu.png) | Projects, account menu NOT open. Same P02 and B02. |
| 79 | [076-settings.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/076-settings.png) | Account menu actually open, NOT Settings profile. Very small email/secondary labels. G01. Profile screen absent. |
| 80 | [077-settings-workspace.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/077-settings-workspace.png) | Workspace settings content, prior Profile tab looks highlighted; don't infer stable selection bug. Save control partly below fold, huge header, persistent toast. S01,B02. |
| 81 | [078-settings-ai-defaults.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/078-settings-ai-defaults.png) | AI defaults: disabled required confirmation preference described as switchable but ineffective; technical assurances. S02,G03,B02. |
| 82 | [079-settings-team.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/079-settings-team.png) | Team settings: honest unavailable state but prominent dead-end feature with verbose explanation. S03,B02. |
| 83 | [080-settings-notifications.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/080-settings-notifications.png) | Notifications: checked controls for messages not delivered; invites/collaboration not available. S04,B02. |
| 84 | [081-settings-billing.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/081-settings-billing.png) | Billing: current free plan credited with test-sized balance (not proof of bug), says renews with plan; cancellation/invoice path indirect. Developer tabular-number copy. S05,G03,B02. |
| 85 | [082-settings-privacy.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/082-settings-privacy.png) | Privacy: session replay unavailable yet instructs enabling analytics first; conflicting guidance. Footer/account-security portion obscured/incomplete. S06,B02. |
| 86 | [083-privacy-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-scroll-1.png) | Privacy TOC and warning tail. Huge TOC, faint body text, admin health-endpoint wording. J01,J02,G03. |
| 87 | [083-privacy-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-scroll-2.png) | Privacy body sections1–3. Extremely faint paragraph text; readable headings but poor body legibility. J01. |
| 88 | [083-privacy-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-scroll-3.png) | Privacy sections4–6. Same faint text; final section7/footer not captured. J01; coverage gap. |
| 89 | [083-privacy-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/083-privacy-top.png) | Privacy top: draft/legal review and missing operator details clearly disclosed. Not launch-ready by its own notice. J01,J02. |
| 90 | [084-terms-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-scroll-1.png) | Terms TOC: large vertical list, faint warning text. J01,J02; later sections not all captured. |
| 91 | [084-terms-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-scroll-2.png) | Terms sections1–4: faint body text. J01. |
| 92 | [084-terms-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-scroll-3.png) | Terms sections4–7: literal backslash-u2014 sequences visible in suspension paragraph. J03,J01. End of document missing. |
| 93 | [084-terms-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/084-terms-top.png) | Terms top: draft and missing operator details warning. J01,J02. |
| 94 | [085-refunds-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-scroll-1.png) | Refunds sections1–3: faint text; clear support link but actual destination untested. J01,J02. |
| 95 | [085-refunds-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-scroll-2.png) | Refunds contact section: operator/address/support/privacy/jurisdiction Pending. J02; visible Back to Housora is useful. |
| 96 | [085-refunds-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-scroll-3.png) | Refunds footer: dark block differs from light document; draft disclosure persists. J01,J02; readable return navigation. |
| 97 | [085-refunds-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/085-refunds-top.png) | Refunds top: draft and operator missing warnings. J01,J02. |
| 98 | [086-cookies-scroll-1.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-scroll-1.png) | Cookies body: faint text; session replay wording differs from disabled feature language elsewhere, needs factual alignment. J01,S06. |
| 99 | [086-cookies-scroll-2.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-scroll-2.png) | Cookies contact: all operator details Pending. J02; contact route not exercised. |
| 100 | [086-cookies-scroll-3.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-scroll-3.png) | Cookies footer: draft disclosure and support navigation. J01,J02; no unique extra blocker visible. |
| 101 | [086-cookies-top.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/086-cookies-top.png) | Cookies top: draft and operator missing warnings. J01,J02. |
| 102 | [087-projects-final.png](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/087-projects-final.png) | Projects final without toast. Thumbnails/date useful; duplicated generic names, full-width CTA, repetitive explanatory copy and nonexistent Saved terminology. P02,G02. |

