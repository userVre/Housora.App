# Reve product audit for Housora

Date: 2026-08-27

## Overall verdict

Reve is exceptionally strong at keeping the image central and making advanced generation feel conversational. The editor’s object detection, local prompting, references, drawing, effects, layers, and reframing create unusually direct control without presenting a traditional complex graphics application.

Housora should adopt that interaction principle, but not Reve’s generic album structure. Interior designers need a client → project → space → concept → specification → approval hierarchy, measurements and constraints, budgets, sourcing, and client records. Housora’s current four-step project studio is the right professional layer, while Reve is the better reference for the image editor itself.

## Captured flow

### 1. Marketing and product explanation — Healthy

Evidence: user-provided marketing screenshots and the current public page.

The page leads with the creative outcome and uses large live product demonstrations rather than abstract feature cards. Each section explains one capability: direct object editing, drawing, references, templates, effects, live layers, and reframing. Repeated Get started actions keep the path obvious.

Risk: the marketing page is broad and creator-oriented. Housora should keep the same product-demonstration clarity but replace generic creative examples with recognizable interior tasks and designer deliverables.

### 2. Workspace home and albums — Good, but generic

Evidence: `02-project-albums.png`.

The nearly empty dark canvas, large album thumbnails, and prominent new-album card are calm and easy to scan. Filters and search stay visually secondary.

Risk: project context is shallow. Albums do not communicate client, space, phase, budget, approval, deadline, or assigned designer. This would create manual organization work for a studio.

### 3. References — Clear but under-explained

Evidence: `03-references.png`.

Separating reusable references from generated albums is strong. The empty state offers one obvious action.

Risk: “Reuse styles and characters” is not tailored to architecture. Housora should categorize references as style, material, furniture, color palette, precedent, and client-approved direction.

### 4. New album / first creation — Very healthy

Evidence: `04-album-detail.png`.

The screen presents only two visual starting choices—Upload and edit, or Start from a template—while the persistent Ask Reve composer also supports immediate prompting. This is the clearest pattern to borrow for reducing time to first result.

Risk: users must understand what an album means before starting. Housora should auto-create the project/space record behind the scenes when someone uploads a room.

### 5. Direct editor — Excellent core interaction

Evidence: `01-workspace-home.png`.

The canvas dominates. Detected objects appear as named visual layers. The bottom toolbar keeps selection, drawing, objects, text, images, effects, and reframing close to the image. The side panel combines object structure with a natural-language command box. This is the strongest reference for Housora.

Risks: several icon-only tools need tooltips and strong keyboard states; long object lists can become hard to scan; and generic layers do not explain structural safety. Housora should group detected items into Structure, Surfaces, Furniture, Lighting, and Decor, with walls/windows/doors protected by default.

## What Housora should adopt

1. Make the uploaded room the visual center of the editor.
2. Put a persistent natural-language edit composer beside the canvas.
3. Detect objects automatically and let users select, protect, remove, replace, move, resize, or recolor them.
4. Support drawing/spotlight masks for edits that object detection misses.
5. Allow references to be attached with an @ interaction.
6. Add live text/image layers for presentation annotations and logos.
7. Add reframing and aspect-ratio controls for presentations and social output.
8. Stream edit results while preserving history and enabling undo/redo.

## What Housora should not copy

1. Do not make albums the main professional hierarchy.
2. Do not expose every tool before the first concept is generated.
3. Do not mix the image editor with budgets, sourcing, and approvals in one crowded panel.
4. Do not use generic object names without interior-specific grouping and structural protection.
5. Do not hide client status, space status, and approvals inside image collections.

## Evidence limits

The public marketing page was reviewed from the current page structure and user-provided screenshots because the signed-in browser redirects the root URL to the workspace. The signed-in project home, References, creation entry, and editor were directly inspected and captured. Destructive actions, billing, team permissions, generation submission, upload transfer, and full keyboard/screen-reader behavior were not exercised.
