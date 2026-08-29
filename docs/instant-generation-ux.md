# Housora Instant-Generation UX

Decision date: 27 August 2026
Status: Approved direction

## Product decision

Housora must deliver its core service immediately. A new user should not need to understand projects, clients, libraries, specifications, or professional workflow before creating the first design.

The default entry experience is a single creation surface, comparable in simplicity to starting a ChatGPT conversation or generating audio in ElevenLabs.

## First screen

The signed-in landing screen contains:

1. A large prompt: **“What would you like to redesign?”**
2. A photo drop zone directly inside the prompt composer.
3. Three obvious modes: **Interior, Exterior, Garden**.
4. One primary action: **Generate designs**.
5. Optional example prompts and recent designs below the fold.

Nothing else is required before generation. Housora creates an untitled project automatically.

## Minimum generation flow

1. User uploads or pastes a photo.
2. Housora automatically detects design mode and space type.
3. User may describe the desired change in plain language.
4. Housora immediately generates four draft concepts.
5. Only after results appear does Housora offer optional refinement: room correction, style/reference, must-keep objects, measurements, budget, lifestyle constraints, or the advanced editor.

## Progressive disclosure rules

- Never ask information that can be detected reliably.
- Never block first generation on project organization.
- Ask one decision at a time when more information materially improves the result.
- Show advanced professional controls only after the user requests them or opens a professional panel.
- Keep Projects, Clients, Library, and Shared work available but visually secondary.
- Preserve all expert capability; change when it appears, not whether it exists.

## Navigation hierarchy

The sidebar is simplified to:

- **Create** — visually dominant
- Recent
- Projects
- Clients
- Library
- Shared with me

Studio settings, billing, help, and privacy move into the profile menu. Specifications, budget, presentations, approvals, files, tasks, and team coordination live inside a project rather than in global navigation.

## First-run versus returning users

### First run

- Minimal canvas with prompt and upload
- A sample photo and three example transformations
- No analytics, task lists, or empty project dashboard

### Returning user

- The creation composer remains dominant
- Recent work appears underneath
- Pending client decisions appear as a small dismissible strip, not as the main page

## Success criteria

- A new user can identify how to generate within five seconds.
- First generation requires at most one upload, one optional prompt, and one click.
- Median time from opening the workspace to starting generation is under 45 seconds.
- At least 80% of first-time users start a generation without opening navigation.
- Optional professional details improve later results but never obstruct the first draft.

## Tradeoff

The first draft may be less precise because measurements and detailed constraints arrive later. That is acceptable: it proves value and motivates refinement. Housora labels it as a draft and requires verification before final or technical output.
