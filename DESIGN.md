---
version: alpha
colors:
  primary: "#B85E34"
  canvas: "#11120F"
  surface: "#1B1C18"
  surfaceRaised: "#22231F"
  text: "#F4F0E8"
  textMuted: "#AAA99F"
  line: "#34362F"
  action: "#B85E34"
  sage: "#75806A"
  paper: "#F5F2EB"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
  body:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
  utility:
    fontFamily: "Manrope, Inter, system-ui, sans-serif"
rounded:
  small: "8px"
  medium: "14px"
  large: "22px"
  pill: "999px"
spacing:
  compact: "8px"
  control: "12px"
  section: "24px"
  composition: "40px"
components:
  creationComposer:
    backgroundColor: "$colors.surface"
    textColor: "$colors.text"
    rounded: "$rounded.large"
    padding: "$spacing.section"
  primaryAction:
    backgroundColor: "$colors.text"
    textColor: "$colors.canvas"
    rounded: "$rounded.pill"
    height: "46px"
---

## Overview

Housora is a hybrid brand and professional product. The marketing experience feels like a carefully edited residential-design journal: warm paper, expressive scale, real space photography, and disciplined asymmetry. The workspace feels like entering a quiet architectural presentation room: dark surroundings, precise alignment, tactile materials, and one illuminated place where a real space becomes a design.

The product register is refined and operational, not decorative luxury. The creation composer is the visual signature. Avoid generic AI gradients, floating glass cards, crowded dashboards, and equal visual weight for every feature.

## Colors

Dark canvas and restrained neutral surfaces reduce distraction around room photography. Warm paper and sage reference natural materials. Terracotta is reserved for selection, warnings, and branded moments; the primary generation button uses the high-contrast paper treatment.

## Typography

Instrument Serif is used sparingly for the central invitation and important project presentation titles. Manrope owns navigation, controls, metadata, and long-form product content. Do not use serif typography for forms, tables, or status information.

## Layout

Marketing uses a wide editorial split with an oversized statement paired to an interactive product vignette. The memorable signature is the room image with an anchored material note and compact generation composer. Product screens use a narrow 236px rail and a generous centered working column. The main creation stage begins above the fold at laptop sizes. Secondary content follows the primary task, and expert options remain behind “Refine details.”

## Elevation & Depth

Depth comes from tone, border, and local contrast rather than stacked shadows. A single soft shadow may lift the composer. Static cards remain flat.

## Shapes

Use medium radii for panels, large radii only for the composer and imagery, and pills only for modes, filters, and compact statuses. Avoid rounding every container.

## Components

The creation stage combines a large photographic upload area, design-type switch, adaptive room/building/garden controls, prompt, and one primary action. It has explicit empty, uploading, ready, generating, recoverable-error, and completed states without changing outer geometry.

The left navigation defaults to a quiet compact rail during creation. Project-level professional controls expand only after the user has generated or opened a project.

The project studio organizes professional work into four sequential steps: Design, Specify, Budget, and Present. These steps are project-local, not additional global navigation. The Design canvas keeps imagery dominant while contextual tools and detected objects live in one restrained side panel. Data-heavy specification and budget surfaces use the same dark presentation-room register and reserve the serif face for headings only.

### Product navigation and spacing

The global product navigation contains only Projects, Discover, and Saved. Desktop uses a compact 232px rail; mobile transforms the same three destinations into a fixed bottom navigation. Starting new work remains an action inside Projects rather than a separate global destination.

Product spacing follows a 4/8/12/16/24/32/48/64px scale. Page introductions use generous composition spacing, while controls and metadata use the tighter end of the scale. Primary actions use plain, outcome-specific verbs. Empty states explain what is missing, why the destination is useful, and the single best next action.

## Do's and Don'ts

- Do make the first actionable control unmistakable within five seconds.
- Do preserve uploaded drafts and clearly distinguish local, uploading, ready, generating, and failed states.
- Do expose keyboard focus, progress, cancel/retry, and reduced-motion behavior.
- Do keep all copy plain and action-specific.
- Don’t open with metrics, project cards, or setup questions.
- Don’t require project naming, room classification, style, budget, or measurements before a first draft.
- Don’t hide advanced professional capability permanently; reveal it progressively after value.
# Commerce and account surfaces

- Pricing keeps the product shell and uses three comparable plan cards, a monthly/yearly segmented control, an always-visible live balance, explicit per-action credit costs, and separate top-up packs.
- Settings uses a stable left section navigator on desktop and a horizontal scroller on narrow screens. Account identity stays with Clerk; product preferences stay with Convex.
- Privacy controls are opt-in. Analytics and session replay are separate, and replay cannot remain enabled when analytics is disabled.
- Legal pages are public, long-form reading surfaces with a narrow measure and no workspace chrome.
