# Housora Competitive Research

Reviewed: 26 August 2026

This benchmark uses the principal product, feature, workflow, help, and pricing pages of ten relevant products. Marketing claims are treated as product signals, not independent proof of performance.

## Ten reference products

| Product | What it proves | Adopt for Housora | Avoid or postpone |
|---|---|---|---|
| Reve | A generated image can behave like an editable scene: semantic objects, selection, drawing, insertion, reframing, chat edits, and versions. | Simple image-first canvas, contextual editing, semantic object list, non-destructive versions. | API dependency; Reve discontinued its public API in August 2026. Generic creative tooling that does not serve design work. |
| Planner 5D | Designers value photo, sketch, PDF, and floor-plan inputs; editable plans; model catalogs; budgets; presentations; and separate homeowner/pro experiences. Its AI Studio also validates model routing rather than dependence on one image provider. | Multi-input brief, floor-plan constraints, budget widget, homeowner/progressive professional modes, replaceable model providers. | Building a complete CAD/3D engine before the image workflow is trusted. |
| Homestyler | A free entry tier, large catalog, own-model/material uploads, 2D/3D planning, construction exports, team libraries, and render/AI credit allowances attract both enthusiasts and professionals. | Free trial, private product/material library, team workspace, branded outputs, transparent credit use. | Huge technical surface—plumbing, electrical, roofs, stairs, tiling, and 12K panoramas—at launch. |
| Coohom | Fast plan import, 3D furnishing, photoreal renders, templates, and walkthrough sharing create an end-to-end visualization story. | Fast import, reusable templates, shareable visual review. | Manufacturing and full 3D production depth before the core photo editor succeeds. |
| Foyr Neo | Designers want measured 2D plans, quick 3D conversion, customizable products/materials, high-quality rendering, walkthroughs, and professional exports without specialist training. | Measurement-aware generation, custom assets, clear render modes, low-learning-curve workflow. | Complex modeling controls in the primary flow. |
| Houzz Pro | The strongest validated workflow is moodboard -> selections -> client comments/approval -> live budget -> proposal/invoice. Web clipping and reusable product data prevent duplicate entry. | Connected concepts, selections, approvals, sourcing, specifications, and budgets; control what a client can see. | CRM, lead generation, advertising, contractor scheduling, accounting, and full procurement in the initial product. |
| Mydoma Studio | Interior designers pay for a branded client portal, design boards, product linking, approvals, sourcing, proposals, and centralized communication. | Designer branding, granular client visibility, product-linked boards, decision history. | General studio administration until the visual-to-package workflow is established. |
| Spoak | A lighter, friendlier suite can combine moodboards, layouts, sourcing, budgets, and presentations for pros and design enthusiasts. | Friendly language, templates, visual organization, fast onboarding. | Letting playful simplicity reduce professional precision. |
| Morpholio Board | Designers need multipage boards, layers, web clipping, personal libraries, background removal, sourcing lists, cut sheets, and PDF/Excel presentation packages. | Automatic product capture, multipage presentation builder, background removal, cut sheets, flexible export. | Apple-only interaction assumptions and a separate collage workflow disconnected from the generated room. |
| REimagineHome | Photo-first redesign can serve interiors, exteriors, landscaping, staging, and floor plans. Its emphasis on preserving walls/windows/doors and using real, local, budget-aware products closely matches Housora's opportunity. | Architectural protection by default, real-product alternatives, budget/locality filters, low-friction trials. | One-click novelty generations with no professional decision trail. |

## Market conclusions

1. The market is split between fast AI image generators, precise but complex 3D planners, and business-management suites. Housora should connect the best parts without becoming all three at once.
2. The defensible product is not simply a beautiful render. It is an editable, constraint-aware design whose approved elements become usable project information.
3. The core professional loop is: understand the real space -> define constraints -> produce alternatives -> refine objects and surfaces -> compare -> obtain approval -> specify products -> control budget -> export a branded package.
4. Geometry preservation, consistency, edit control, and traceability matter more to professionals than unlimited style presets.
5. Product data should be captured once and reused everywhere. A chosen sofa should remain the same object in the image, selection board, specification, and budget.
6. Client access should be deliberately simpler than the designer workspace and should expose only what the designer chooses.
7. Credits are familiar for costly generation, but ordinary organization, editing, comments, and exports should not unexpectedly consume credits.
8. Desktop is the primary creation environment. Mobile should initially focus on capture, review, comments, approvals, and presenting—not full editing.

## Housora's position

**The AI-native design decision workspace for interior designers.** Housora turns real spaces into controlled visual concepts, lets designers edit the scene at object and surface level, and carries approved decisions into products, specifications, budgets, and client-ready presentations.

The homeowner experience uses the same engine with a guided brief and fewer controls. It is a secondary path, not a separate product or marketplace at launch.

## Recommended product defaults

- Start with freelancers and small interior-design studios; support homeowners through a guided mode.
- Launch globally in English with configurable currency, units, tax labels, and designer branding.
- Instant upload creates an untitled project automatically; organization never blocks first value.
- Support photos, reference images, sketches, measurements, and floor-plan files. Full CAD authoring is later.
- Detect design type, room type, architecture, surfaces, furniture, lighting, and decor automatically; let the user correct detection.
- Interior, exterior, and garden use different room/area choices, styles, materials, and questions.
- Ask only the minimum brief initially: desired result, must-keep items, approximate dimensions, style/reference, budget range, and functional needs. Reveal advanced controls progressively.
- Generate four meaningfully different draft concepts by default. A separate final mode prioritizes fidelity and resolution.
- Rank model providers primarily by architectural/geometry preservation, then edit obedience, consistency, photorealism, speed, and cost.
- Protect walls, windows, doors, openings, fixed cabinetry, and explicitly locked objects by default.
- Maintain semantic objects, masks, source references, product metadata, and a complete version tree in Housora's own data model.
- Provide select, brush, add, remove, replace, move, resize, recolor/rematerial, reframe, compare, undo/redo, and conversational edit tools.
- Use real products through saved links/uploads first. Add retailer integrations after product-data quality and demand are proven.
- Support a designer library, web clipping, reusable style kits, brand standards, and project-specific references.
- Organize professional work as client -> property/project -> spaces -> concepts/versions -> selections -> package.
- Let clients view a branded presentation, comment on a precise item or image area, shortlist, approve/decline with a reason, and see only designer-approved prices/details.
- Keep an immutable decision history and never allow clients to directly change the designer's master design.
- Budget initially includes retail/client price, quantity, tax, delivery, contingency, room totals, and project totals. Designer cost, markup, purchase orders, and accounting come later.
- Export before/after images, branded presentations, selection schedules, product/material specifications, shopping lists, and budgets to PDF; structured spreadsheet export follows.
- Use a subscription plus included monthly generation credits. Do not charge credits for saving, organizing, comments, approvals, or basic exports.
- Offer a useful trial, a solo professional plan, and a studio plan with seats and shared libraries. Final prices require cost and willingness-to-pay testing.
- Store uploaded projects privately by default; state clearly whether provider data is retained or used for training, and offer deletion/export controls.
- Postpone marketplace, procurement, invoicing, accounting, construction scheduling, full CAD, and real-time 3D until the core workflow is validated.

## Product-quality gates

Before public launch, a benchmark set of real interiors, exteriors, and gardens must test geometry preservation, protected-object survival, edit accuracy, cross-version consistency, product likeness, and designer preference. A visually attractive result that violates fixed architecture fails.

The main product metric is the percentage of new projects that reach a client-shareable concept. Supporting metrics are time to first usable concept, accepted generations, number of targeted edits, client approval time, package completion, repeat weekly use, and generation cost per approved concept.

## Primary sources

- [Reve](https://reve.com/)
- [Planner 5D pricing and AI Studio](https://planner5d.com/pricing)
- [Homestyler plans and feature comparison](https://www.homestyler.com/pricing?lang=en_US)
- [Coohom](https://www.coohom.com/)
- [Foyr Neo](https://foyr.com/neo/)
- [Houzz Pro features](https://pro.houzz.com/for-pros/houzz-pro-features)
- [Houzz Pro selection workflow](https://pro.houzz.com/pro-learn/blog/go-from-concept-to-presentation-to-client-approval)
- [Mydoma design boards](https://mydomastudio.com/features/design-boards/)
- [Mydoma client portal](https://mydomastudio.com/features/client-portal/)
- [Morpholio Board](https://morpholioapps.com/board/)
- [REimagineHome](https://www.reimaginehome.ai/)
- [HomeByMe, used as an additional floor-planning check](https://home.by.me/en/features/)
