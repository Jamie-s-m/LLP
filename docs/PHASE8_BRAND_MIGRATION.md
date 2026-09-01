# Phase 8B/8C — Twin Arc brand system & migration strategy

Specification only. Nothing in this document has been applied to `tailwind.config.js`,
`index.css`, or any component yet — that's the full redesign phase, deliberately not
started here. See [frontend/public/brand/twin-arc/README.md](../frontend/public/brand/twin-arc/README.md)
for the finished logo files this spec is built around.

## Brand essence

| | |
|---|---|
| **Mission** | Give a learner a steady place to get better at speaking, with real evidence of progress instead of gamified noise. |
| **Personality** | The calm, competent tutor — not the hype mascot. Warm without being cute; premium without being cold. |
| **Promise** | Show up, and you'll always know exactly what to do next — and be able to prove, to yourself and anyone else, how far you've actually come. |
| **Voice** | Plain, encouraging, specific. "3 exercises left in this lesson," never "You're crushing it!" Never overstates a CEFR estimate or a certificate's authority. |
| **Visual personality** | Geometric, not organic. Flat and confident, not gradient-and-glow. One hero color used with restraint, not five hues competing for attention. |

## Logo

Twin Arc (Concept B, refined) — see the dedicated spec and finished files at
[`frontend/public/brand/twin-arc/`](../frontend/public/brand/twin-arc/). Not implemented yet.

## Color tokens — target values, same names

The migration deliberately **keeps every existing CSS variable name** in `index.css` and
`tailwind.config.js` and only changes the *values*. This matters: any component that already
correctly reads `var(--accent)`, `var(--success)`, etc. gets the new brand for free the moment
`:root` is updated — zero component-level changes needed for the ~50% of the app that's
already token-compliant. Only the 64 raw-hex bypass sites the audit found need individual
migration.

| Token | Current | Target | Notes |
|---|---|---|---|
| `--accent` | `#c84b31` (terracotta) | `#7C2D42` (wine) | Primary brand color |
| `--accent-hover` | `#a33d28` | `#5C2131` | Deeper wine |
| `--accent-light` | `#fdf2f0` | `#F3E3E7` | Soft wine tint |
| `--success` | `#2d6a4f` | `#3F6B52` (pine) | Close to current — a refinement, not a reversal |
| `--warning` | `#d97706` | `#C9932E` (gold) | Already gold-adjacent — small shift |
| `--info` | `#0369a1` | `#3E6FA6` (sky) | Already blue — small shift |
| `--error` | `#b91c1c` | *unchanged* | Error red is a safety color; no brief reason to touch it |
| `--bg` | `#fdf8f3` (cream) | `#F5F1EA` (paper) | Moves off the cream-latte tone the audit's cliché finding named |
| `--text-primary` | `#1c1917` | `#211A26` (ink) | Warm near-black, slight plum bias |

Dark-mode (`--dark-*`) values need the equivalent shift — not tabulated here since it's
implementation work, not a decision; the concept deck's dark-mode swatches (wine → `#E497A9`,
gold → `#E3B65E`, pine → `#7FB899`, sky → `#8FB8E0`, paper → `#17131B`, ink → `#F3EEF0`) are
the reference values to carry over.

`tailwind.config.js`'s `primary`/`secondary`/`accent`/`coral`/`sky` scales (five separate hue
families) get consolidated toward the same wine/gold/pine/sky set — the five-family structure
itself is part of what the audit flagged as diluting brand recognition.

## Typography

**Keep Bricolage Grotesque for display** — it's already distinctive and works; changing it
would be novelty for its own sake, which the brief explicitly rules out. Verified hierarchy:

| Role | Face | Size / weight |
|---|---|---|
| Display (hero) | Bricolage Grotesque | 40–56px / 700–800 |
| H1 | Bricolage Grotesque | 32–36px / 700 |
| H2 | Bricolage Grotesque | 24–28px / 600–700 |
| H3 | Bricolage Grotesque | 18–20px / 600 |
| Body | Source Sans 3 (current) or Golos Text (recommended upgrade) | 15–16px / 400 |
| Body small | same as Body | 13–14px / 400 |
| Caption / label | same as Body | 11–12px / 500, uppercase, tracked |
| Button | same as Body | 14–15px / 600 |
| Navigation | same as Body | 14px / 500–600 |
| Numerical/stat | same as Body, tabular figures | varies / 600–700, `font-variant-numeric: tabular-nums` |

The Golos Text recommendation (used for body copy in both artifacts sent this phase) is
specifically because it's designed with native Cyrillic alongside Latin, rather than a Latin
face with Cyrillic retrofitted — relevant given the app serves English, Russian, and Uzbek
readers. Source Sans 3 also has adequate Cyrillic coverage and is a safe fallback if the
founder prefers not to touch typography at all this cycle.

## Spacing scale

4px base unit, matching Tailwind's default scale (already in use, no change needed):
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`px. The inconsistency isn't the scale itself — it's
that components mix this scale with arbitrary one-off values (`p-[13px]`-style overrides seen
during the audit); the fix is discipline in the redesign phase, not a new scale.

## Radius scale

`6px` (inputs, small controls) · `12px` (cards) · `20px` (panels, `atlas-panel`) · `9999px`
(pills, avatars, badges) — approximates current usage; the target is naming these as tokens
(`--radius-sm/md/lg/full`) so components stop hardcoding arbitrary values like `rounded-3xl`
next to `rounded-2xl` for visually-equivalent surfaces.

## Shadow system

Restrained, two-tier: `--shadow-sm` (subtle card lift, `0 1px 2px rgba(33,26,38,.06)`) and
`--shadow-lg` (modals/popovers, `0 16px 32px -18px rgba(33,26,38,.24)`). No colored shadows,
no glow effects — consistent with the "flat and confident, not gradient-and-glow" visual
personality above.

## Motion

- **Duration**: 150ms (micro-interactions — hover, focus, toggle) · 250ms (panel/modal
  transitions) · nothing longer for functional UI. The existing `fadeIn`/`slideInUp` keyframes
  in `tailwind.config.js` (300ms) are close to this and can stay.
- **Easing**: `ease-out` for things entering/appearing, `ease-in` for things leaving.
- **Reduced motion**: every transition/animation must be wrapped or guarded by
  `@media (prefers-reduced-motion: reduce)` — not currently done anywhere in the codebase
  (confirmed absent from `index.css` and `tailwind.config.js`); this is a real, not yet
  addressed gap for the redesign phase to close.

## Migration strategy — current → target → order

| Area | Current | Target | Migration order |
|---|---|---|---|
| **Color tokens** | 5 hue families, terracotta hero, values scattered between `tailwind.config.js` and `index.css` with one conflicting `--accent` definition each | Single wine/gold/pine/sky system, one source of truth | 1. Fix the `--accent` conflict between the two files first (correctness bug, not a redesign). 2. Update `:root` values in `index.css` (this alone re-themes every token-compliant component for free). 3. Migrate the 64 raw-hex bypass sites file-by-file, worst offenders first (`bg-[#f6efe7]`, 15+ occurrences). 4. Update `tailwind.config.js`'s scales to match. |
| **Dark mode** | Three parallel systems (hand-tuned warm palette, generic Tailwind `dark:`, ad hoc cool-navy in `index.css`) | One system: the hand-tuned warm palette, extended to cover every component | 1. Audit every `dark:` Tailwind utility class and every hardcoded `dark:bg-[#...]` against the intended warm palette. 2. Replace ad hoc cool-navy values (`.input`, `.modal-panel`, `.message-bubble.own`) first — they actively contradict the documented palette in the same file. 3. Replace generic Tailwind `dark:slate-*` usages with token references. |
| **PWA theme** | `manifest.webmanifest`/`manifest.json` say `#5B5CE2` (indigo); `index.html` correctly says the brand color | One value, everywhere | Single small fix: update both manifest files to match `index.html`. Independent of everything else — can happen anytime, including before the rest of this migration. |
| **Legacy CSS classes** | `.atlas-page`/`.atlas-panel`/`.atlas-kicker`/`.atlas-hero` used in 40+ files, named after a pre-rebrand product | Renamed to something brand-neutral (e.g. `.ln-page`/`.ln-panel`) or folded into the new token/component system entirely | Lowest priority — purely cosmetic to developers, invisible to users. Do last, as a single scripted rename across the codebase once the rest of the system is stable (renaming early would churn the diff on every other migration step). |
| **Brand assets** | `linguanest-mark.svg`, `favicon.svg` (on-brand terracotta, but a different mark), `linguanest-orbit.svg` (off-palette entirely) | Twin Arc symbol/lockup/favicon files, already finished (`frontend/public/brand/twin-arc/`) | 1. Swap `favicon.svg` + `index.html` reference. 2. Regenerate PWA icons (72–512px) from `symbol.svg`. 3. Replace the inline logo markup in `Navbar.tsx`/`Footer.tsx` with `lockup-horizontal.svg`. 4. Retire or replace `linguanest-orbit.svg` last, since it's decorative and lowest-risk to leave for last. |
| **Icons** | `react-icons/fi` (Feather icons) throughout, no brand-specific icon set | No change planned — Feather icons are neutral and already consistent; not a problem the audit or this brief flagged | N/A |
| **Illustrations** | Just `linguanest-orbit.svg`, off-palette | Either a new illustration in the wine/gold/pine palette, or removed in favor of a simpler geometric treatment consistent with Twin Arc's construction | Design decision for the redesign phase, not this checkpoint — deferred |
| **Component styles** | Real duplication: `Card.tsx` vs. `index.css`'s `.card` class define conflicting specs; `CourseCard.tsx` hand-rolls a 9-color palette instead of using `Card`; two "progress" components (`ProgressBar`, `ProgressRing`) with inconsistent ARIA | Single source per concept (one Card spec, one progress-component ARIA pattern shared by both shapes) | Component-by-component during the full redesign — sequenced by the UX audit's per-component severity, not alphabetically |

## Screens affected (mapped, not redesigned)

Every screen and component in the UX audit (published separately as an artifact:
https://claude.ai/code/artifact/6b70ff54-5b84-4d72-8e15-3187897740fc) is in scope for the
eventual migration — that's all 68 entries across marketing/legal, auth/onboarding, student
learning, progress/gamification, commerce/admin, teacher portal, and the shared
component/token layer. Nothing is redesigned as part of this checkpoint; the audit artifact is
the authoritative screen-by-screen list.
