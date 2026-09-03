/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Terracotta is primary again - reverted from gold at the founder's request after
        // seeing it live ("the original color... the orange one"). Terracotta is dark/
        // saturated enough to safely serve as both a solid fill and text-on-light with one
        // value (unlike gold, which needed the split below) - matches --accent in
        // index.css. `vivid` is kept as an alias to 500 so any component still explicitly
        // reaching for `primary-vivid` doesn't break. See docs/PHASE8_BRAND_MIGRATION.md.
        primary: {
          50: "#FDF2F0",
          100: "#FBE3DE",
          200: "#F5C4B8",
          300: "#EDA08D",
          400: "#DD7256",
          500: "#C84B31",
          600: "#A33D28",
          700: "#832F1E",
          800: "#642417",
          900: "#451A10",
          vivid: "#C84B31",
        },
        // Twin Arc pine (matches brand.ts mint/mintDark/mintSoft, shifted toward the new system).
        secondary: {
          50: "#EAF3EE",
          100: "#D2E7DA",
          200: "#A8CFB6",
          300: "#7BB491",
          400: "#549574",
          500: "#3F6B52",
          600: "#2F5140",
          700: "#243E31",
          800: "#182A21",
          900: "#0E1913",
        },
        // Twin Arc wine - was primary, now the secondary/supporting accent (still in the logo
        // mark itself; available here for badges, links, and highlight moments elsewhere).
        accent: {
          50: "#FBEEF1",
          100: "#F6DEE3",
          200: "#EBC0CB",
          300: "#DB96A8",
          400: "#B25E75",
          500: "#7C2D42",
          600: "#632235",
          700: "#4C1A29",
          800: "#35121C",
          900: "#200B11",
        },
        coral: {
          50: "#FCEFED",
          100: "#F8DAD5",
          200: "#F0B3A9",
          300: "#EDAAA2",
          400: "#E68A7E",
          500: "#DD6B5C",
          600: "#C2503F",
        },
        sky: {
          50: "#F0F8FF",
          100: "#D7EAF8",
          200: "#B7D9FF",
          300: "#8BBEFF",
          400: "#5BA7FF",
          500: "#4A8DE5",
          600: "#3A76C9",
        },
        success: "#3F6B52",
        // Restored to the original amber - distinct from terracotta again.
        warning: "#D97706",
        error: "#B91C1C",
        info: "#3E6FA6",
        neutral: {
          50: "#FAF9F7",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["Source Sans 3", "system-ui", "sans-serif"],
        display: ["Bricolage Grotesque", "Source Sans 3", "sans-serif"],
      },
      // Named type scale from docs/PHASE8_BRAND_MIGRATION.md's typography table - existed
      // as a spec but had no matching Tailwind utilities, so components fell back to ad hoc
      // arbitrary sizes (text-2xl next to text-[1.375rem] for visually-equivalent headings).
      // Use text-display/text-h1/etc. instead of raw text-{size} for anything matching a
      // role in that table; Tailwind's default scale (text-sm, text-lg, ...) still covers
      // everything else and isn't being replaced wholesale.
      fontSize: {
        display: ["clamp(2.5rem, 2rem + 2vw, 3.5rem)", { lineHeight: "1.05", fontWeight: "800", letterSpacing: "-0.02em" }],
        h1: ["clamp(2rem, 1.75rem + 1vw, 2.25rem)", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.01em" }],
        h2: ["clamp(1.5rem, 1.35rem + 0.6vw, 1.75rem)", { lineHeight: "1.2", fontWeight: "700" }],
        h3: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.04em" }],
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        slideInUp: "slideInUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
