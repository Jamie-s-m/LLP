# Twin Arc — LinguaNest symbol, final specification

Refined from Concept B of the brand-direction concept deck (presented separately as a
published artifact, not a repo file). See [docs/PHASE8_BRAND_MIGRATION.md](../../../../docs/PHASE8_BRAND_MIGRATION.md)
for the full color/typography/spacing system this mark sits inside.
Staged here for review — **not wired into the live app yet** (favicon.svg, manifest.json,
Navbar.tsx, Footer.tsx all still reference the previous mark). Swapping these in is
implementation work for the full redesign phase, not this checkpoint.

## Construction

Two overlapping circles, ink (wine) and gold, composited with `mix-blend-mode: multiply`
inside an `isolation: isolate` group. The isolation is load-bearing: without it, the
non-overlapping part of the gold circle would also blend against whatever sits behind the
whole mark (e.g. a dark page background), muddying the gold instead of keeping it clean —
caught and fixed during this refinement pass.

## Files

| File | Use |
|---|---|
| `symbol.svg` | Primary mark, light backgrounds |
| `symbol-dark.svg` | Dark-mode surfaces (paper + gold, same construction) |
| `symbol-mono.svg` | Single-color version — one solid circle, one outlined circle. Set `color` to any single ink (works inverted: white on a dark or colored ground). Use for print, stamps, or any context that can't render two colors. |
| `lockup-horizontal.svg` | Symbol + wordmark, for headers and marketing where there's room |
| `favicon.svg` | Symbol only, tuned for 16–32px — larger circles, less padding than `symbol.svg`, since fine proportion is lost at tiny sizes |

## Color

- Ink / wine: `#7C2D42` (dark mode: `#F3EEF0`)
- Gold: `#C9932E` (dark mode: `#E3B65E`)
- Monochrome: any single ink color via `currentColor` — no gradient, ever.

## Clear space & minimum size

- Keep clear space around the mark of at least **25% of its own width** on every side — no
  text, edge, or other UI element inside that margin.
- Never render the symbol below **16px**. Below that, use `favicon.svg` specifically (not a
  scaled-down `symbol.svg`) — it's already tuned for the loss of fine proportion at that size.
- The mark's own bounding box is wider than it is tall (two side-by-side circles). In a
  circular crop (social avatar, some PWA icon masks), keep extra padding so neither circle
  gets clipped — don't scale the mark to fill the full circular frame edge-to-edge.

## Where each variant is intended to go (not yet implemented)

- `favicon.svg` → replaces `frontend/public/favicon.svg` and the favicon reference in `index.html`
- App/PWA icons (72–512px) → regenerated from `symbol.svg` at each required size, replacing `frontend/public/icons/*`
- `lockup-horizontal.svg` → replaces the inline logo markup duplicated in `Navbar.tsx` and `Footer.tsx`
- `symbol-mono.svg` → certificate letterhead/seal treatment (Phase 20 of the original brief), social avatars where only one color is accepted
- `symbol.svg` / `symbol-dark.svg` → marketing use, social share images

## What this mark deliberately avoids

No gradient, no glass-overlay shading (the pattern the previous mark used). No literal bird,
book, graduation cap, or globe. No speech-bubble tail or chat-bubble silhouette — the overlap
itself carries the "two voices / two languages meeting" idea. One committed hero color (wine)
plus one accent (gold), not five competing hues.
