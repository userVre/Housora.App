# Housora UX/UI audit — 2026-08-28

## Overall verdict

The visual direction is strong and coherent, and the three-destination navigation is appropriate for the current product size. The main weaknesses are product continuity rather than aesthetics: screens are stored only in component state, created work does not become a project, saved inspiration is not visible in Saved, and dialogs need stronger keyboard and focus behavior.

## Flow evidence

1. **Projects — Needs work.** Clear identity and an understandable empty state, but the single album tile is small relative to the available canvas and does not explain what users gain after creating one. Screenshot: `01-projects-desktop.png`.
2. **Discover — Healthy after repair.** Search, filters, count, and masonry hierarchy are easy to scan. The intro copy requested for removal is gone. First-viewport masonry images are now eagerly loaded so column balancing cannot leave visible blank tiles. Screenshot: `02-discover-desktop.png`.
3. **Discover detail — Needs work.** Strong editorial presentation, but the primary action falls below the fold at a normal laptop height. The dialog lacks a focus trap, focus restoration, and background scroll locking. Screenshot: `03-discover-detail.png`.
4. **Saved empty state — Healthy.** “Your saved designs,” “Nothing saved yet,” and “Generate a design” form a clear next step. Screenshot: `04-saved-empty.png`.
5. **Creation start — Mostly healthy.** Upload versus example is clear and the three-step progress indicator is useful. The canvas and controls compete for attention, and the right panel becomes dense before the user has supplied a space. Screenshot: `05-create-start.png`.
6. **Creation direction — Needs work.** Direction settings are understandable, but “Try an example” immediately presents settings without explaining which example was chosen. More importantly, completed work is not added to Projects, so there is no durable return path. Screenshot: `06-create-direction.png`.
7. **Projects mobile — Mostly healthy.** Bottom navigation is the right choice for three destinations and is easier to reach than a drawer. The account control competes with the heading and the album card is overly tall for an empty first screen. Screenshot: `07-projects-mobile.png`.
8. **Discover mobile — Needs work.** Search and filters are reachable, but the filter row gives only a faint hint that it scrolls horizontally and card labels are too small. Screenshot: `08-discover-mobile.png`.
9. **Saved mobile — Healthy.** The empty state is concise, centered, and has one clear action. Screenshot: `09-saved-mobile.png`.

## Highest-impact findings

### Product continuity

- Navigation uses local component state, so the URL never reflects Project, Discover, Saved, open dialogs, filters, or the active creation step. Back/forward, refresh, and shareable deep links therefore fail (`components/housora-app.tsx:428`, `components/housora-app.tsx:482`).
- A generated or edited design can be saved to Saved, but it never creates an album/project card. Projects remains an empty state, which breaks the core “return to my work” expectation (`components/housora-app.tsx:1635`, `components/housora-app.tsx:1673`).
- “Save inspiration” only increments a hidden local count. Saved displays generated designs only, so the action has no visible destination (`components/housora-app.tsx:472`, `components/housora-app.tsx:2560`).
- “Use this direction” opens creation, but the selected reference image and prompt are not passed into the new project. The promise and result do not match (`components/housora-app.tsx:2549`).

### Accessibility and interaction

- Discover and Saved dialogs support Escape, but do not trap focus, move focus into the dialog, restore focus to the triggering card, or make the page behind them inert (`components/housora-app.tsx:2504`, `components/housora-app.tsx:2665`).
- The custom visual selector uses listbox roles without arrow-key, Home/End, or Escape behavior; opening on hover/focus is also surprising (`components/housora-app.tsx:1219`).
- “Unsave” removes a design immediately. Add an undo toast or confirmation for this destructive action (`components/housora-app.tsx:2693`).
- Much supporting copy is 8–10px. This is difficult to read on laptops and phones even when contrast is acceptable (`app/globals.css:112`, `app/globals.css:115`, `app/globals.css:127`).
- The dark theme does not declare `color-scheme: dark`, and metadata does not set a matching theme color (`app/globals.css:6`, `app/layout.tsx:4`).

### Layout, hierarchy, and copy

- The Discover detail primary action sits below the fold at 1366×620. Keep actions sticky or reduce prompt/image height so the next step is visible (`app/globals.css:82`).
- Desktop Projects uses only a small fraction of the available width; enlarge the first album card or add a short benefits/steps panel without changing the restored page structure (`app/globals.css:127`).
- Desktop labels use “Project” while the creation back action and mobile navigation use “Projects.” Choose one term everywhere (`components/housora-app.tsx:505`, `components/housora-app.tsx:1718`).
- Filter and result-count text is visually secondary to the point of being missed. Raise it to at least 12px and strengthen contrast (`app/globals.css:112`).
- The mobile filter row needs a visible end fade or partially clipped next chip to communicate horizontal scrolling (`app/globals.css:115`).

## Recommended order

1. Make navigation and creation state URL-based.
2. Turn each completed creation into a project/album and pass Discover references into creation.
3. Decide whether Saved includes both designs and inspiration; if yes, add two simple tabs.
4. Fix dialog focus management and sticky primary actions.
5. Raise the small-type floor to 12px for supporting text and 14px for interactive labels.
6. Consolidate repeated CSS overrides into tokens and component-level rules.

## Evidence limits

- This was a visual and interaction audit of the current local build, not a screen-reader certification.
- Color contrast ratios, full keyboard traversal, real upload/generation latency, storage limits, sharing on physical devices, and download behavior require dedicated tests.
- Edge’s mobile screenshot compositor did not paint image pixels after viewport emulation even though the DOM reported the visible images fully loaded with non-zero natural widths. The mobile layout findings therefore use card geometry and UI structure, not image color/crop quality.
