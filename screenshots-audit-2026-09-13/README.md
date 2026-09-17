# Housora website screenshot archive

## Coverage correction after individual visual review

The archive contains **102 PNGs**. The original coverage list below records intended captures; several files actually show earlier/transitional states, not the state named in their filename. In particular, all ten `044-gallery-detail` files show grids, not detail dialogs. This archive is **not** complete end-to-end website coverage or a test-pass record.

See [the visual audit and 102-image ledger](C:/Users/LENOVO/Desktop/Housora/screenshots-audit-2026-09-13/VISUAL-AUDIT.md) for verified observations, evidence gaps, priorities and repair acceptance checks. Blank image frames alone do not establish permanent asset failures; later frames load some of the same images.

Captured from the deployed website in the signed-in Edge profile on 2026-09-13.

## Coverage

- `001`–`025`: New Project and Create workflow, including Interior, Exterior, Garden, option menus, example image, and credit confirmation.
- `026`–`034`: Edit workflow, scan confirmation, Spotlight, Draw, Reframe, and Full screen button state.
- `035`–`038`: 3D and AR workflows, including the AR-to-3D path.
- `039`: Empty Edit state.
- `040`–`044`: Images/Discover from top to bottom, material detail, expanded prompt, and ten image detail dialogs.
- `063`–`066`: Library filters and opening a saved item.
- `067`–`071`: Pricing top-to-bottom, monthly/yearly states, checkout loading, and checkout failure.
- `072`–`075`, `087`: Projects, project actions, rename state, account menu, and final visual capture.
- `076`–`082`: Every Settings section.
- `083`–`086`: Privacy, Terms, Refunds, and Cookies from top to bottom.

## Important observed problems

- Edit has visible horizontal overflow and a large unused area on the right; the inspector is not aligned to the right edge.
- The Full screen action did not visibly change the Edit layout during this capture.
- Several product-facing messages expose implementation language such as “No fake result”, “real SAM mask”, and “parent callback”.
- Opening the Creator checkout ended with “Whop could not open checkout”.
- Opening the saved Limestone kitchen showed “The image opened, but the project could not be saved”.
- Some Discover cards were blank while scrolling, indicating missing/late images or unstable loading.

## Deliberately not triggered

- Paid generation confirmation was documented but not confirmed.
- Share was not triggered because it can create or expose a public/private-project link.
- Delete, archive, pin, logout, subscription purchase, and credit purchase were not executed because they change account or project state.
