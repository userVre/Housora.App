# Housora implementation and release checks — 2026-09-04

## Evidence, not a launch approval

The working tree contains earlier uncommitted changes plus this implementation. Nothing was committed, pushed, or deployed in this run. Local results do not establish that the deployed website has these fixes.

### Provider checks (one authorized request each)

- Grok: HTTP 200, real edited image saved to `outputs/provider-check-2026-09-04/grok-edit.png`. The prompt-only result also recolored the matching chairs. Object edits now send the SAM mask to a local compositing step that preserves pixels outside the mask; that new step has an automated pixel test, not a second paid test.
- SAM: HTTP 200, `auto_detect:true`, 24 actual objects with masks and thumbnails. Inspected the coffee-table crop. Occluded areas remain holes; segmentation cannot reconstruct unseen furniture surfaces.
- Tripo: one task submitted and completed. Downloaded GLB 2.0, 744100 bytes, one mesh, one material, three textures. This is structural validation, not visual 3D/AR approval.
- These were direct provider calls using local server credentials. They did NOT test deployed Clerk authentication, Housora credit deductions, refunds, or permanent Convex storage. No credit purchases or plan changes were made.

## Stage status

1. Security: owner/table/role checks, membership upsert, cross-project room/version/approval guards, read-only expiring/revocable share previews, and owner-isolation tests implemented. Real deployed Clerk sessions remain untested.
2. Grok: Grok-only reference-image edits, selected-mask compositing, truthful storage failure handling. Provider works directly; the updated signed-in route still needs a deployed end-to-end test.
3. Core projects: stable design/project/room linkage, real versions, save/reopen URL, recovery from removed saved items without deleting history, and original-image comparison. Browser interaction and concurrent editing remain unverified.
4. Durable jobs: gated server enqueue atomically reserves credit and schedules work, one-time worker claim, stored results, read-only polling, timeout refund, and Recent tasks recovery. Off by default until deployment/configuration. Recovery opens a result as a new draft rather than automatically attaching it to a previous project. No real deployed scheduling run yet.
5. Cache: owner-scoped keys include image/prompt/model/aspect/mask. Large segmentation cache payloads use file storage. Daily bounded cleanup includes owned cache blobs. Cron execution and storage retention must be verified after deployment; uploaded project assets and completed-job retention need an explicit long-term policy.
6. 3D/AR: permanent GLB storage path, saved-model list, same-browser task recovery, model loading/error states, and public AR page. No automatic claim that a generated model has accurate physical dimensions. Real phone AR and live Convex persistence remain untested. A lost initial Tripo submit response still needs operator/provider reconciliation; do not blindly resubmit.
7. Optional features: unverified CubiCasa, Sketchfab and placeholder PDF API paths explicitly return unavailable without provider charges. Demo team invitations/connected badges removed. Share preview is read-only; it does not promise live comments/approvals. These optional features are disabled, not completed.
8. Billing: first-purchase identity bug fixed; duplicate event/payment deliveries tested; renewal, failed payment, usage and refund behavior tested locally. Real signed webhook/checkout lifecycle has not been tested; prices preserved.
9. UI: project continuity, recovery controls, AR feedback and scrollbar consistency improved. Required static design check passes. Desktop/mobile screenshot audit BLOCKED: browser tool initialization fails with missing kernel assets. No honest numeric visual rating can be given from this run.
10. Validation: run `npm test`, `npm run typecheck`, `npm run build`, and `npm audit --omit=dev`. Vitest uses an in-memory Convex implementation, not deployed Convex/Clerk. Node route tests mock providers. PostCSS override addresses current advisory while retaining Next 15.

## Coordinated deployment (requires owner approval)

1. Review the complete dirty-tree diff; it contains changes from more than one coding session. Regenerate Convex API types through the normal deployment workflow.
2. Deploy Convex schema/functions before deploying the new frontend. Image/model storage and new queries require the new backend.
3. Set server-only Convex environment variables: `GROK_IMAGE_KEY`, `MODAL_SAM_ENDPOINT`, `MODAL_PROXY_KEY`, `MODAL_PROXY_SECRET`, `WHOP_WEBHOOK_SECRET`. Keep the existing Clerk issuer configuration. Never put provider secrets in `NEXT_PUBLIC_*`.
4. In Vercel, preserve the current server keys and correct `NEXT_PUBLIC_CONVEX_URL`. Keep `DURABLE_AI_ENABLED=false` for the initial coordinated deployment; enable only after a controlled background-worker test. The backend Node configuration externalizes Sharp as required by Convex's bundling documentation.
5. Test signed-out, two separate accounts, collaborator/viewer permissions, project save/reopen, revoked share, insufficient credits, duplicate request IDs and webhook deliveries. Do not use real payment purchases without explicit authorization.
6. With separate approval for any additional paid requests, test the deployed Grok/SAM/Tripo flow, worker reload/recovery, output storage, failed/empty refunds and cache reuse. The one-per-provider allowance from this run is exhausted.
7. Repair browser tooling and inspect desktop/mobile screenshots; test camera/AR on a physical compatible phone. Fix any regressions before public launch.

## Known constraints

- Paid workers are feature-gated; enabling the flag is not proof that credentials/scheduling work.
- Legacy prototype components still exist in the codebase, but optional unverified API features are disabled. Do not expose unused prototype screens as production features.
- LocalStorage Tripo recovery is same-browser and token-lifetime limited, not cross-device recovery.
- No accessibility conformance, security certification, zero-bug claim, or 10/10 launch rating is implied.

Reference for Node dependency configuration: https://docs.convex.dev/functions/bundling
