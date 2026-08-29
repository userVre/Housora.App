# Housora Product Roadmap

Status: Product capability scope validated; workflow and information architecture next
Decision owner: Housora founder
Primary audience: Professional interior designers
Secondary audience: Homeowners

## Product promise

Housora is an AI design workspace that helps interior designers and homeowners transform real spaces, refine individual elements without losing the rest of the scene, and progress from concept to an approved, specified, and budgeted design package.

## Confirmed decisions

- Professional interior designers are the primary customer; homeowners receive a simpler experience built on the same product foundation.
- Housora covers interior, exterior, and garden design.
- Starting a design uses instant photo upload. Housora creates an untitled project automatically so speed does not sacrifice organization.
- Design controls adapt to the design type. Interior, exterior, and garden each expose relevant categories and details.
- The creation experience is followed by a dedicated canvas editor inspired by Reve's interaction model but specialized for interior design.
- The long-term product outcome is a complete package: visual concepts, client presentation and approval, products and materials, specifications, and budget.
- The initial implementation should protect the path to the complete package while sequencing capabilities to preserve product quality.
- Housora will accept room measurements and uploaded floor plans as AI and product-fit constraints. Full CAD drafting and real-time 3D modeling are postponed until validated.
- Housora owns its canvas, scene structure, masks, protected-element logic, versions, and interior workflow. Image-model providers remain replaceable.
- Reve remains a UX reference, not an API dependency; its public API was discontinued in August 2026.
- Provider selection will use an interior-specific benchmark. Geometry preservation is proposed as the highest-weight criterion.
- The first commercial target is freelance interior designers and small studios; homeowners use a simpler guided mode.
- Housora launches in English with configurable currency, measurement units, tax labels, and designer branding.
- The editor generates four meaningfully different draft concepts by default and uses a separate high-fidelity final mode.
- Fixed architecture and user-locked elements are protected by default. A beautiful result that changes protected geometry is a failed result.
- Real-product sourcing begins with saved web links and uploads. Live retailer integrations follow only after product-data quality and demand are validated.
- The initial budget supports client price, quantity, tax, delivery, contingency, room totals, and project totals. Cost/markup, purchasing, and accounting are later stages.
- Client collaboration includes precise comments, shortlisting, approve/decline with reasons, controlled visibility, and an immutable decision history. Clients do not directly edit the designer's master design.
- Desktop is the primary creation workspace. Mobile initially supports capture, presentation, comments, approvals, and review.
- Commercial packaging uses subscriptions with included monthly generation credits. Saving, organizing, commenting, approving, and basic exports do not consume credits.
- The initial offer includes a useful trial, a solo professional plan, and a studio plan with seats and shared libraries; exact price points will be validated against model cost and customer interviews.
- Projects and uploads are private by default, with clear provider-retention disclosure plus deletion and export controls.
- The principal success metric is the percentage of new projects that reach a client-shareable concept; supporting metrics measure speed, edit success, approval, package completion, retention, and cost.
- The product brief includes household routines, decision makers, accessibility, health, sustainability, durability, maintenance, cultural needs, and future-life requirements—not style alone.
- Every measured fact or technical constraint carries a source and verification status. AI concepts cannot be presented as code-, construction-, or installation-ready without professional verification.
- Product data includes lead time, availability, samples, care, warranty, health/sustainability attributes, and alternates in addition to visual and price information.
- The workspace includes a room-level project hub for phases, decisions, tasks, files, risks, and responsibilities while avoiding a full contractor-management suite.
- A dedicated homeowner mode simplifies language and controls, supports multiple household decision makers, and preserves a clean handoff to a professional.
- A contractor-ready handoff includes issued revisions, specifications, approval history, questions, change impact, and site/punch-list evidence; full procurement and construction administration remain later phases.
- The signed-in home experience is creation-first, not dashboard-first. Upload, paste, or describe a space and generate immediately; Housora creates and organizes the project automatically.
- First generation requires no mandatory setup form. Detection supplies a draft room type and brief; optional style, measurements, budget, household, and professional constraints appear progressively after the first result or when needed.
- Global navigation remains deliberately small. Detailed specifications, budgets, approvals, files, tasks, and team coordination live inside a project rather than competing with generation in the sidebar.
- The professional dashboard remains useful for returning designers but appears below or behind the dominant creation composer, never as the first obstacle to service.

## Proposed capability areas

### Space understanding

- Upload one or more photos of a space
- Detect design type and room/building type
- Detect architecture, furniture, lighting, and decor
- Accept constraints, measurements, and floor plans
- Identify elements to preserve
- Validate source-image quality

### Brief and references

- Natural-language client brief
- Style, palette, materials, lighting, and change intensity
- Inspiration and reference images
- Required furniture and products
- Budget, accessibility, storage, children, pets, and lifestyle requirements
- Reusable designer preferences and brand standards

### Generation

- Photo-to-design, sketch-to-design, and floor-plan-informed concepts
- Multiple distinct concepts per request
- Geometry and protected-element preservation
- Style, palette, material, and product references
- Consistency across several rooms
- Interior, exterior, and garden generation
- Lighting and time-of-day variations
- High-resolution final rendering

### Canvas editing

- Select semantic objects and surfaces
- Add, remove, replace, move, or resize objects
- Change materials and colors
- Draw or spotlight edit areas
- Insert products or reference images
- Reframe and extend a scene
- Protect elements from unrelated changes
- Conversational edits
- Undo, redo, version history, before/after, and comparisons

### Products and materials

- Designer product and material libraries
- Save products from uploads or web links
- Use real products in visualizations
- Match generated furniture to purchasable alternatives
- Store supplier, price, dimensions, finish, link, and availability
- Moodboards, sample boards, and reusable favorites

### Professional output

- Clients, properties, projects, and rooms
- Branded presentations and before/after comparisons
- Client comments, shortlists, approvals, and rejection reasons
- Product schedules and material specifications
- Room and project budgets
- Quantities, taxes, delivery, and contingency
- Presentation, specification, shopping-list, and budget exports
- Final design package

### Collaboration

- Team roles and permissions
- Private client access
- Comments attached to images, objects, and selections
- Approval requests and decision history
- Limited contractor or supplier access

### Homeowner mode

- Guided plain-language setup
- Automatic room and style suggestions
- Simple before/after creation
- Budget-aware recommendations and shopping list
- Family sharing
- Upgrade to a designer-assisted project

## Competitive evidence

Established professional tools validate demand for multi-room projects, moodboards, product libraries, sourcing, selection boards, client comments and approvals, budgets, proposals, invoices, and floor-plan visualization. They also demonstrate a risk: combining full project management, procurement, accounting, and marketing produces a broad and expensive product. Housora's proposed differentiation is a visual-first, AI-native concept-to-specification workflow rather than a general contractor ERP.

The detailed ten-product review and recommended defaults are recorded in [competitive-research.md](competitive-research.md). The reviewed set spans image-native creation, 2D/3D planning, designer workflow, sourcing, presentation, and client approval rather than copying one competitor wholesale.

The full professional-and-homeowner needs audit and coverage matrix are recorded in [user-needs-audit.md](user-needs-audit.md).

The simplified first-run and instant-generation behavior is recorded in [instant-generation-ux.md](instant-generation-ux.md).

## Proposed sequencing

### Phase 1: Visual intelligence

- Creation-first home with a single upload-and-prompt composer
- Instant upload and automatic project creation
- Interior, exterior, and garden briefs
- Multi-concept generation
- Geometry and protected-element preservation
- Object-aware canvas editing
- Versions, comparisons, and high-resolution export

### Phase 2: Client decisions

- Multi-room projects
- References and moodboards
- Branded presentations
- Client comments, shortlisting, and approval
- Team collaboration

### Phase 3: Design package

- Product and material libraries
- Real-product insertion and matching
- Specifications and quantities
- Budgets, delivery, taxes, and contingency
- Final package exports

### Later, only after validation

- Procurement and purchase orders
- Contractor scheduling
- Invoicing and accounting
- Full CAD drafting
- Real-time 3D walkthroughs
- Marketplace logistics
- Augmented reality

## Remaining validation—not blockers to product design

1. Test image-model providers against the Housora benchmark and choose the launch routing strategy.
2. Validate exact PDF and spreadsheet document templates with working designers.
3. Define detailed studio roles and permissions during workflow design.
4. Confirm exact prices, included credits, storage, seats, and commercial terms after cost modeling and customer interviews.
5. Set launch targets and a dated validation plan after MVP effort is estimated.

## Product principle

Every capability must either help a designer create a more reliable concept, make a client decision faster, or convert an approved concept into professional project information. Features that do not support one of those outcomes should not enter the core roadmap.
