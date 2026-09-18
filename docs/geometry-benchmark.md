# Housora Geometry & Edit-Quality Benchmark

Status: procedure defined; scored runs pending (requires curated image set + model access).
Owner: Housora founder

## Why this exists

A beautiful result that changes protected architecture is a failed result.
Every image-model provider/routing change must pass this benchmark before it
can serve production generations or edits.

## Test set (minimum 30 cases)

- 10 real interiors (living, kitchen, bedroom, bath, hallway)
- 10 real exteriors (house, townhouse, storefront, cabin)
- 10 real gardens (courtyard, patio, terrace, poolside)
- Each case: source photo + locked elements list (walls, openings, fixed cabinetry)

## Scoring rubric (weights)

| Criterion | Weight | Pass bar |
|---|---|---|
| Geometry preservation (walls/openings/ceiling lines within tolerance) | 40% | ≥ 8/10 human score |
| Protected-object survival (locked items unchanged) | 25% | 100% survival |
| Edit obedience (requested change present, nothing else changed) | 15% | ≥ 8/10 |
| Cross-version consistency (same room, same architecture) | 10% | ≥ 7/10 |
| Photorealism / designer preference | 10% | ≥ 7/10 |

Overall ship bar: weighted ≥ 8.0 AND zero protected-object failures.

## Procedure

1. Freeze provider routing + prompts in git (tag the run).
2. Generate 4 concepts per case; run 3 targeted edits per case (replace, recolor, remove).
3. Two raters score blind; disagreements resolved by founder.
4. Record per-case scores in `outputs/benchmark-<date>.json` (gitignored).
5. Provider with the highest weighted score becomes the default route.
   Tie-break: lower cost per approved concept.

## Automation hooks (existing)

- `tests/verify-workflows-layout.cjs` — layout/interaction sweep (no backend).
- `tests/spec-budget.test.ts`, `tests/invites.test.ts` — data-layer gates.
- Mask-fidelity unit checks: `lib/mask-alpha.ts`, `lib/mask-postprocess.ts`
  (assert outside-mask pixels are preserved after compositing).

## What blocks a public "verified" claim

A dated, tagged benchmark run with the full 30-case set and two-rater
scores. Until then, all AI output is labeled as unverified visualization
(see Present disclaimer + PDF footer).
