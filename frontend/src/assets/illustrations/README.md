# Illustration library (Tier 2 visual assets)

Source: [unDraw](https://undraw.co/) illustrations by Katerina Limpitsouni — free for
commercial and noncommercial use, no attribution required, and edits/recolors keep the
same free license. Fetched from the [undraw-svg-collection](https://github.com/balazser/undraw-svg-collection)
MIT-licensed mirror, which pre-adapts each SVG's primary fill to a `--primary-svg-color`
CSS variable.

**Recolored for LinguaNest**: each file's `var(--primary-svg-color)` references were baked
to the brand terracotta accent (`#c84b31`, matches `--accent` in `index.css`), and unDraw's
signature bright-pink secondary accent (`#ff6584` and near-identical export variants) was
recolored to the brand wine tone (`#7c2d42`, matches `--wine`) so no off-palette hue survives
in committed illustrations. Skin-tone and neutral grey/white fills are untouched — they're
correct as shipped.

Color is baked in as a static hex value, not a live CSS variable — illustration color does
not shift between light/dark theme (deliberate: matches how unDraw/Storyset/Busuu/Duolingo
all treat illustration color as static regardless of UI theme; only the surrounding page
background changes). If a future pass wants theme-aware illustration color, that needs a
build-time SVG-inlining setup (e.g. `vite-plugin-svgr`) rather than the current `<img src>`
usage — not done here to avoid a new build dependency for a cosmetic-only gain.

Use through `frontend/src/components/illustrations/Illustration.tsx`, not by importing these
files directly — that component owns sizing, `alt`/`aria-hidden` conventions, and lazy-loading.
