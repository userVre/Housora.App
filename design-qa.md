# Create, Edit, 3D, and AR workspace design QA

## Source target

The supplied Housora and Reve screenshots, the approved furniture-photo-to-3D-to-AR product flow, `DESIGN.md`, and `UX-CONTRACT.md`.

## Verified

- Static layout and interaction architecture match the reference hierarchy.
- Create now uses one photo-first canvas and a compact adaptive composer; switching Interior, Exterior, or Garden changes the space taxonomy, styles, prompt defaults, and advanced options without changing page geometry.
- After upload, Create keeps the image dominant and anchors the same settings model below it instead of switching users into an unrelated sidebar workflow.
- Edit upload is separated from Create and has no redesign option bar.
- Select, Spotlight, Draw, and Reframe have visible selected states and keyboard shortcuts.
- Spotlight and Draw create real PNG masks for the existing image-edit endpoint.
- Object detection and every generated edit retain explicit credit confirmation.
- 3D has a dedicated, uncluttered workspace with drag-and-drop, source validation, explicit credit confirmation, generation status, retry, model preview, GLB download, and AR handoff.
- AR only accepts completed 3D models, provides a clear empty state, lets the user select an existing model, preserves desktop 3D fallback, and provides phone-link copying.
- Furniture source photos are converted to durable image data before project persistence; temporary browser blob URLs are not saved as project assets.
- Responsive rules collapse onboarding steps and simplify the mobile toolbar.
- TypeScript, 68 component/unit tests, 49 API/security tests, browser component tests, and the production build pass.

## Visual comparison

The production build and browser component tests completed successfully. A signed-in, same-viewport screenshot comparison of the complete workspace could not be completed locally because the development Clerk keys enter a handshake redirect loop; this is an environment/authentication mismatch rather than a workspace render error.

final result: blocked
