# Housora UX Contract

## Canonical entry flow

The signed-in default route is Projects. New work begins from the New album card, while returning users can reopen saved albums from the same page.

The minimum path is upload or paste photo → optional prompt → Interior/Exterior/Garden mode → Generate four concepts. Housora automatically creates an untitled project and draft brief.

## Composer states

- Empty: visible upload target, editable prompt, mode selection, disabled Generate.
- Uploading: stable image region, real progress when available, cancel, preserved prompt.
- Ready: photo preview, detected mode/space, correction action, enabled Generate.
- Generating: named stages rather than fake percentages; user can leave and return.
- Completed: four concepts plus optional refinement and editor entry.
- Recoverable error: retained photo and prompt, precise reason, Retry and Replace photo.

The Create composer uses two local tabs. Design brief contains mode, room/building/garden type, style, prompt, optional mode-specific details, aspect ratio, resolution, and model. Detected objects is empty before upload. On entering Edit with a new image, offer a credit confirmation before sending pixels to SAM. Never render hard-coded/demo detections. Show only returned masks with real crops, confidence and normalized bounds; a scan may miss objects. Switching tabs retains results; replacing the image resets them.

## Detection and 3D actions (September 2026)

- Costs are owned by `lib/ai-costs.ts` and enforced server-side. Detection costs 1 Housora credit; image editing 4; 3D generation 12. Provider credits are separate.
- `CreditConfirmation` and `WorkspaceDialog` own costly-action confirmation, live balance, keyboard focus, inert background and cancellation. Consent is required even when older preferences disable high-cost prompts.
- No request on Cancel. A synchronous client lock and server credit-event deduplication prevent a repeated detection/3D request ID from dispatching twice.
- Empty/failed detection returns its credit. 3D terminal failure is refunded through the verified task tracking route; temporary polling failures never trigger a replacement generation. Keep the studio open while running. Download completed models because provider URLs are temporary.
- Album header owns the 3D studio entry. A detected object's 3D action passes its actual masked crop to the same studio; upload/replacement remains available. Opening the studio itself costs nothing.
- Selection highlights follow actual normalized image coordinates. Object edits reuse detection without another segmentation charge.
- Canonical owners: object forms/list = `components/detected-objects.tsx`; dialogs = `components/credit-confirmation.tsx`; visual tokens/scrollbars = `app/globals.css`; feature rules = `app/object-tools.css`; balance/refunds = `convex/credits.ts` and `lib/credits.ts`. English product copy is retained.

## Progressive disclosure

Room type, style, references, protected objects, measurements, household needs, budget, sustainability, and accessibility are optional refinement before or after the first draft. Only uncertain detection or unsafe/insufficient input may interrupt generation.

After a concept is selected, professional work follows four project-local steps: Design → Specify → Budget → Present. Design owns object-level editing, protected elements, comparison, measurements, floor plans, and version history. Specify owns products, materials, supplier links, samples, and schedules. Budget owns estimates, quotes, approvals, contingency, and export. Present owns branded delivery, comments, revisions, PDF export, sharing, and recorded approval. The current step is always visible; no professional capability is added to the global navigation.

## Navigation

Global navigation: Projects, Discover, and Saved. Starting a new design is an action inside Projects, not a separate destination. Desktop uses a persistent compact rail; mobile exposes the same destinations in bottom navigation. Profile menu: studio settings, privacy, billing/credits, help, sign out. Specifications, budget, presentations, approvals, files, tasks, and team coordination are project-local.

The active destination is stored in the `view` URL parameter. Discover search and space filters use `q` and `space`, so refresh, browser history, and shared links restore the same view.

## Saved content and project continuity

Saved contains two canonical collections: generated Designs and Discover Inspiration. Saving a generated design also makes it available as an album in Projects. Saving inspiration makes it visible under Saved → Inspiration. “Use this direction” transfers the chosen reference image and prompt into the new-project workspace.

Removing a generated design offers Undo through the shared status message. Modal dialogs trap focus, close on Escape, lock background scrolling, and return focus to the trigger.

New project, Invite client, Add team member, Account, and Credits use one consistent app-owned dialog pattern. Closing returns focus to the initiating context; successful demo submission keeps the dialog stable and changes the primary action to Done.

## Marketing-to-product transition

The public primary action and temporary Sign in action both enter `/workspace`. Authentication will later protect that route without changing the destination or the creation-first experience. Marketing explains professional depth, but never requires visitors to understand the full project system before trying a room.

## Feedback and recovery

Do not claim a project, upload, or generation is saved until confirmed. Prevent duplicate generation requests. Preserve the prompt and upload after failures. Long generation continues in the background and remains accessible from Recent.

## Accessibility

All actions have visible keyboard focus and accessible names. Touch targets are at least 44 by 44 pixels. Mode is communicated by text and selection state, not color alone. Reduced motion removes transforms and stagger. Errors use persistent inline messaging and never rely only on transient notifications.
# Billing and settings contracts

| Surface | Contract |
| --- | --- |
| Pricing layout | Start with live balance and Monthly/Yearly controls, without a marketing hero. Order: plans, extra-credit packs, then the read-only credit-cost table. Costs reuse `lib/ai-costs.ts`; selecting existing detections is free. |
| Checkout | A purchase button creates a server-side Whop checkout with the signed-in Clerk user and a fixed allow-listed offer. The browser never receives API secrets. |
| Fulfillment | Credits or plan access are added only after a verified `payment.succeeded` webhook. Repeated webhook IDs have no effect. Reversals remove only the associated grant or access. |
| Credit order | Plan credits are consumed first, then purchased credits by nearest expiry. Purchased credits expire after 12 months. |
| Settings | Native selects are intentionally used for language, currency, measurement, and AI defaults because they are compact, keyboard accessible, and map to short fixed option sets. |
| Analytics | PostHog remains inactive by default. Session replay requires analytics consent and masks page text and element attributes. Prompts and image content are not captured as analytics properties. |
| Legal | Privacy and Terms remain reachable without signing in. Public launch is blocked operationally until the operator’s legal entity, address, contact and governing jurisdiction are reviewed and inserted. |
