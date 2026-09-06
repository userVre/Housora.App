# Global Shell & Shared Design System — Prompt 6

**Owner:** Global app shell, navigation, shared UI primitives, global design tokens.
**Do not edit:** Feature pages (`components/*` except `housora-app.tsx` shell, `app/album/*` not owned) or override feature styles.

## What changed

### Tokens (`app/shell.css` + `app/globals.css`)
- Canonical warm-dark tokens: `--housora-canvas/#111110`, `--housora-panel/#191918`, `--housora-line/#3b3a37`, `--housora-text/#f4f0e8`, `--housora-muted/#a8a9a0`, `--housora-cream/#f0efeb`, `--housora-focus/#f0ede5`.
- Spacing scale 4/8/12/16/24/32/48/64 via `--space-*`.
- Typography: `--font-display` serif only for primary titles, `--font-body` for controls/tables/status. Helper text ≥11px (12px for paragraph helpers).
- Radii, rail widths (`--rail-width:232px`, `--rail-collapsed:68px`), z-index scale (`--z-rail:30` … `--z-skip:1000`).
- Selection `::selection` uses terracotta tint.

### Sidebar — collapsible in editor, readable elsewhere (`components/housora-app.tsx:948` `NavButton` : `app/shell.css:38`)
- `isEditor = activePage === "album"`. Collapse toggle only shown in editor (`.rail-collapse-toggle`).
- `shellCollapsed = isEditor && editorCollapsed`. Persisted in `localStorage["housora:editorCollapsed"]`.
- Outer `product-shell` gets `.shell-collapsed.is-editor`; rail gets `.is-collapsed`; main margin follows `--rail-collapsed`.
- Outside editor rail stays 232px readable. Inside editor may collapse to 68px icon-only (labels visually hidden but `aria-label`/`title` retained).
- Keyboard: `aria-pressed`, `aria-label` on toggle; `aria-current="page"` preserved.
- Mobile: rail slides as drawer (`transform`); toggle hidden; bottom nav + account button shown at ≤760px.

### Avatars — reliable initials fallback (`components/housora-app.tsx:65` `Avatar`)
- `getInitials(name)` robust to missing first/last.
- `Avatar` renders `<img onError -> initials>` with `referrerPolicy="no-referrer"`. No broken image icon.
- Used in rail profile button (36px) and profile menu head (32px). Styles `.avatar`, `.avatar-initials`, `.avatar-image`.

### Navigation — accessible + mobile (`app/shell.css:68`)
- `NavButton` now `aria-label` + `title` when collapsed; active state `background:#ece7dd`.
- Desktop rail `position:fixed` 232px; collapsed 68px centered icons.
- Mobile bottom nav: 4 items, 68px tall, 44px targets, `backdrop-filter`, `env(safe-area)`.
- Skip link `.skip-link` fixed, focus reveal.

### Shared primitives (`app/shell.css:14`)
- Typography: serif selective, helper readability 12px, `text-wrap:balance`.
- Spacing: `scrollbar-gutter: stable` on main.
- Buttons: `.primary-action` cream pill `min-height:44px` hover lift, disabled `opacity:.55`.
- Forms: scoped ` .product-shell :where(input,textarea,select)` — border, hover, focus ring `box-shadow:0 0 0 3px rgba(240,237,229,.14)`, disabled.
- Focus: unified `outline:2px solid var(--housora-focus)`.
- Disabled: `opacity:.55` + `pointer-events:none` where needed.
- Fieldset/legend not broad — scoped to `.product-shell`.

### Overlays / stacking (`app/shell.css:98`)
- `visual-options`, `profile-menu`, `more-types-menu` etc use `max-height:min(60vh,420px)`, `overscroll-behavior:contain`, `z-index: var(--z-dropdown)`.
- `visual-options` positioned `absolute` top+8px, `min(340px)` width; fixed centered on ≤700px.
- `profile-menu` absolute bottom 76px, fixed at mobile.
- Scrim `z:29` blur, dialogs `z:120`, toast `z:200` (bottom 24px → 84px on mobile).

## Shared APIs

```tsx
// Avatar fallback — use anywhere an avatar is rendered
Avatar({ src: string|null, alt: string, initials: string, size?: number })

// NavButton — collapsible-aware
NavButton({ active, icon, label, collapsed?: boolean, onClick })

// Shell state (in HousoraApp)
isEditor: boolean            // activePage === "album"
shellCollapsed: boolean      // isEditor && editorCollapsed
localStorage key: "housora:editorCollapsed" // "1" collapsed
CSS: .product-shell.shell-collapsed, .product-rail.is-collapsed
```

Tokens and z-scale are CSS variables; no JS import needed.

## Migration for feature branches

- **If you need sidebar width:** use `var(--rail-width)` / `var(--rail-collapsed)` not hardcoded 232/236. Respect `body:not(.shell-collapsed)` outside editor.
- **If you add overlays/dropdowns:** put them under `z-index: var(--z-dropdown)` and set `max-height:min(60vh,420px); overscroll-behavior:contain`.
- **Forms:** do not add global `input {}` rules; scope under `.product-shell` or feature class. Use 13px font, `border:1px solid var(--housora-line)`, focus as shell does.
- **Buttons:** primary = `.primary-action`; secondary/ghost = border `var(--housora-line)` radius `var(--radius)`, hover `border:#4a4d45`.
- **Avatars:** replace `<Image src={user.imageUrl}>` ternaries with `Avatar` component; compute initials via `getInitials`.
- **Serif:** only use `var(--font-display)` for page-intro `h1` / presentation titles. Tables, forms, chips stay `var(--font-body)`.

## Integration requests (shared change needed — do not touch directly)

If feature needs different rail width, new global token, or change to `UX-CONTRACT.md` navigation list, file an integration request with exact CSS variable and page, e.g.:

> “Feature X needs `--rail-width: 260px` on desktop — request shell token bump from 232px, review impact on editor collapsed layout.”

No paid checkout, sharing, or auth changes were made.

## Verification

- Build: `tsc --noEmit --skipLibCheck` pass, `next build` compiled (89s).
- Tests: `vitest run` 12/12 files, 57/57 tests.
- Manual: keyboard Tab through rail, toggle collapse in album (desktop), mobile drawer/bottom nav at 360/768/1280, avatar fallback with broken URL, focus rings visible, disabled states opacity, helper text 12px.

## Files

- `components/housora-app.tsx` — Avatar, getInitials, NavButton collapsed, shellCollapsed state, brand actions, profile menu.
- `app/shell.css` — new, imported via `app/globals.css` (`@import "./shell.css"`).
- `app/globals.css` — import + editor-only collapse overrides for legacy 1180px rule.

## Unverified

- Real device VoiceOver/TalkBack traversal for collapsed labels (static aria-label present, not device-tested).
- Visual pixel comparison for sidebar at 68px vs design screenshots (code-verified, no live screenshot capture).
- Clerk imageUrl edge cases with CDN errors beyond onError fallback (assumes img fires error).

