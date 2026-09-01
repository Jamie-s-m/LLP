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
        // Twin Arc gold - promoted to primary at the founder's request. 500 is a deep,
        // WCAG-safe gold (~5.6:1 as text-on-light) - matches --accent in index.css, since
        // `text-primary-500`/`bg-primary-500` are both used as text/icon color throughout
        // the app, and the bright hero gold alone isn't safe there (~2.7:1). `vivid` is that
        // bright gold from the logo/concept deck, for large solid fills only (pairs with
        // dark text) - matches --accent-vivid. Keeping these two systems' values aligned is
        // the whole point - "primary" must mean the same actual color everywhere. See
        // docs/PHASE8_BRAND_MIGRATION.md.
        primary: {
          50: "#FBF3E4",
          100: "#F3E2BE",
          200: "#E6C583",
          300: "#D5A452",
          400: "#B98530",
          500: "#8A6015",
          600: "#6E4C11",
          700: "#52390D",
          800: "#372608",
          900: "#1F1505",
          vivid: "#C9932E",
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
        // Distinct burnt-orange, deliberately not the primary gold - warning and "the brand
        // color" must never be visually the same hue, or a warning reads as just another CTA.
        warning: "#B8621D",
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
