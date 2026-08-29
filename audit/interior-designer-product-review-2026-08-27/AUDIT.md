# Housora product audit for interior designers

Date: 2026-08-27

## Scope

Combined UX and visible-accessibility review of the live `/workspace` surface and its main professional workflow: Create, Projects, Project Design, Specification, Budget, Presentation, Clients, and Library.

The supplied URL returned a 500 error during the audit. Screens were therefore captured from an isolated temporary preview of the same source. This does not change the product findings, but the broken supplied URL is the first launch blocker.

## Overall verdict

Housora already has a compelling backbone: **Design → Specify → Budget → Present**. It connects creative work to products, costs, and client approval better than a generic inspiration platform. The product is not yet the one place an interior designer can run their whole practice because discovery, sourcing depth, documentation, procurement, and daily project control are still thin.

Do not build a Pinterest + Houzz + ArchDaily + Dezeen + Material Bank clone. Make Housora the workspace that connects the best parts of those products to a real project.

## Keep and strengthen

1. Keep the four-stage project workflow. It is the clearest differentiator.
2. Keep object-level AI editing and architecture protection, but explain and prove what is protected.
3. Keep the specification, budget, presentation, comments, and approvals in the same project.
4. Keep the restrained editorial visual language, but improve legibility and information density.
5. Keep the reusable studio library, but make it a true product/material/reference database.

## Add — priority order

### P0: make the current product trustworthy

- Fix the 500 error on the supplied workspace URL.
- Reconcile demo state: Projects says “No projects yet” while the sidebar shows recent projects and the complete example contains live project data.
- Add autosave state, sync/error recovery, undo history, permissions, and an activity log.
- Make every important action show a clear result, loading state, failure state, and recovery path.

### P1: complete the professional project system

- Add a project dashboard with rooms, milestones, tasks, deadlines, team owner, client status, budget health, and next decisions.
- Add a structured client brief: scope, rooms, measurements, lifestyle needs, must-keep items, budget bands, timeline, inspiration, and approval rules.
- Add floor-plan/CAD/PDF import, measurements, annotations, scale, and room relationships.
- Add schedules for furniture, finishes, lighting, plumbing, hardware, and procurement.
- Add quote comparison, purchase orders, order status, lead times, deliveries, returns, and installation tracking.
- Add revision history that connects a client comment to a design change, cost change, and final approval.

### P1: bring in the best of the five platforms

- **Pinterest:** visual search, collaborative mood boards, save-from-web browser clipper, similar-image discovery, and boards organized by project/room—not an endless generic feed.
- **Houzz:** public studio portfolio, designer profile, reviews, lead intake, client ideabooks, and a client portal. Keep leads separate from active clients.
- **ArchDaily:** structured project case studies with plans, elevations, dimensions, material credits, designer/supplier attribution, and filters by room, style, size, country, and budget.
- **Dezeen:** a curated trend/editorial layer with expert selection, studio profiles, new product launches, and trade-fair coverage. Keep it curated; do not create a noisy news feed.
- **Material Bank:** faceted material search, technical sheets, certifications, availability by region, sample ordering/tracking, and one-click addition to a project specification.

### P2: make discovery feed directly into work

- Create a Discover area with Projects, Products, Materials, Studios, and Editorial tabs.
- Every discovery item needs “Save to project,” “Add to mood board,” “Add to specification,” and source/credit metadata.
- Add image upload/reverse search so a designer can identify similar furniture, finishes, and projects.
- Personalize recommendations from the active brief, selected style, budget, room, location, and saved library—not engagement alone.
- Protect originality: include source attribution and warn when a concept is too close to a saved reference.

## Remove, merge, or demote

- Demote **Exterior** and **Garden** from the main creation choice if interior designers are the primary customer. Put them under “More project types” or add them later; they weaken the focused promise.
- Do not make AI image generation the default home for returning professionals. The default should be a project dashboard and today’s decisions; “Create concept” remains a prominent action.
- Remove the vague “Architecture protected by default” claim unless it opens an explanation of protected geometry, limitations, and a comparison view.
- Merge the shallow Clients page into a useful CRM/client portal or keep it out of the main navigation until it contains briefs, communication, decisions, approvals, and project value.
- Replace the current Library’s repeated lifestyle cards with real data-rich products, materials, references, collections, and filters. A beautiful card without supplier, price, dimensions, finish, lead time, and project usage is not useful enough.
- Avoid a broad social feed, likes, follower counts, and trend chasing. They add noise without advancing a project.
- Hide resolution, aspect ratio, and generation-speed controls behind Advanced settings for most users; keep the initial concept flow focused on brief, room, style, and constraints.

## Screen findings

### 1. Create workspace — needs refinement

Strengths: clear upload-first entry, strong visual example, and sensible room/style controls.

Risks: creation dominates the product before project context exists; the main image consumes much of the viewport; tiny low-contrast labels and controls are difficult to scan. The advanced generation choices compete with the brief.

### 2. Projects empty state — unhealthy/inconsistent

Strengths: friendly onboarding and a useful example-project escape hatch.

Risks: “No projects yet” contradicts visible recent spaces. This damages trust immediately. The page also lacks the dashboard information a working designer needs every morning.

### 3. Project design — strong concept, needs production depth

Strengths: object selection, protected elements, versions, compare, measurement access, and the four-step workflow form an excellent core.

Risks: editing tools and detected-object controls are very small; the canvas is cropped at the fold; it is unclear how selection, edit scope, undo, and generated variants affect the approved design and specification.

### 4. Specification — promising but too shallow

Strengths: product/material table, supplier, estimate, status, import, and export align with real design work.

Risks: missing quantities, dimensions, finish/SKU, room/location, source URL, trade price versus retail, tax, lead time, sample status, attachment, alternatives, sustainability data, and procurement owner.

### 5. Budget — good executive view

Strengths: budget, current estimate, approved spend, remaining amount, categories, quotes, and contingency are easy to understand.

Risks: it needs committed versus paid versus forecast cost, tax/shipping/installation, allowances, change orders, currency rules, quote expiry, and links back to the exact specification items causing changes.

### 6. Client presentation — strong differentiator

Strengths: branded presentation, comment, approval, PDF, and project history connect design work to client decisions.

Risks: comments need pins on exact objects/areas, version context, due dates, resolved state, and approval scope. “Record client approval” must clearly state exactly what the client is approving.

### 7. Clients — visually clean but not yet useful enough

Strengths: easy scanning and visible project state.

Risks: no next action, decision count, budget value, last contact, portal status, brief, files, or activity. The separate screen adds navigation without enough depth.

### 8. Library — attractive but structurally weak

Strengths: large imagery makes saved inspiration approachable.

Risks: repeated imagery and broad labels make it feel like a demo gallery. Products, materials, references, and studio standards require different metadata, filters, and actions.

## Visible accessibility risks

- Secondary text, uppercase labels, dividers, and inactive controls appear too low-contrast against the dark background.
- Several controls and table labels are very small and may not meet comfortable target or text sizes.
- Selected states sometimes rely heavily on subtle color/border changes.
- Dense horizontal project steps and toolbars may not reflow well at narrow widths or high zoom.
- The DOM includes a skip link and useful landmarks/labels, which is a strong foundation.

Screenshots alone cannot confirm keyboard order, visible focus, screen-reader announcements, color contrast ratios, reduced motion, error messaging, or responsive behavior. Those need direct implementation testing.

## Recommended product structure

1. **Home:** today’s tasks, approvals, deliveries, overdue decisions, budget alerts, recent projects.
2. **Projects:** brief → mood board → design → specification → procurement → budget → presentation/approval.
3. **Discover:** projects, products, materials, studios, editorial; every item can enter a project.
4. **Library:** saved references, products, materials, templates, and studio standards.
5. **Clients:** leads, active clients, briefs, portal, communication, approvals, history.

## Best first release

Focus the next release on one complete professional loop:

**Client brief → mood board → AI concept → object edits → real products/materials → live budget → pinned client feedback → approval → specification/PDF export.**

That loop is valuable, defensible, and much more coherent than trying to launch a social network, magazine, supplier marketplace, and studio-management suite simultaneously.
