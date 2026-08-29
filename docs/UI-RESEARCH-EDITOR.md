# UI research: Housora object editor

## Context

- Building: a compact object-selection and prompt-editing panel inside the Housora project workspace.
- Platform: responsive web application built with Next.js and React.
- Audience: homeowners and interior-design professionals who need fast, understandable visual edits.
- Direction: restrained dark editorial workspace with an object-first editing model.
- Constraints: preserve the existing Housora typography, canvas layout, API routes, and accessibility baseline.

## Inspiration

1. Adobe Firefly Generative Fill — https://helpx.adobe.com/firefly/web/work-with-images/edit-images/generative-fill.html
   - Uses an explicit Edit workspace, a visible selection, a reference image, and a single natural-language instruction.
   - Adopt: keep selection and instruction in one focused workflow.
2. Canva editor — https://www.canva.com/help/editing-designing/
   - Uses a compact layers model and keeps the canvas dominant.
   - Adopt: one scannable row per detected object and minimal panel chrome.
3. Google Photos object editing — https://support.google.com/photos/answer/6128850/edit-your-photos-android
   - Makes the selected object the primary unit and offers refinement without exposing model complexity.
   - Adopt: plain object names, clear selection state, and progressive controls.
4. The supplied reference editor screenshot
   - Strong Create/Edit tabs, a reference-fidelity selector, a source-image row, and thumbnail object rows.
   - Adopt: its information architecture and density while retaining Housora’s colors and type.

## Pattern analysis

- Layout: large visual canvas plus a narrow, vertically scrolling control rail.
- Hierarchy: workflow tab → reference mode → source image → detected objects → prompt action.
- Interaction: selected object remains visible; generation feedback appears beside the action; nonfunctional controls are not shown.
- Accessibility: semantic tabs and buttons, visible keyboard focus, 44px targets where practical, and descriptive live status.
- Responsive behavior: the editor becomes a full-width panel below the canvas on smaller screens.

## Implementation direction

- Use the existing Housora neutral palette and serif/sans pairing.
- Match the supplied editor’s object-list structure rather than copying another brand’s assets or identity.
- Keep design-detail state in the project workspace and send chosen values to the generation request.
- Avoid decorative controls and icon-only actions until they have a working behavior.
