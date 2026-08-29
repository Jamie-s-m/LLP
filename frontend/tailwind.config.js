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
        // Brand terracotta (matches frontend/src/config/brand.ts + DESIGN/ mockups).
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
        },
        // Brand mint/green (matches brand.ts mint/mintDark/mintSoft).
        secondary: {
          50: "#EAF8F0",
          100: "#D2F0E0",
          200: "#A8E0C2",
          300: "#7BCBA3",
          400: "#4FA97F",
          500: "#2D6A4F",
          600: "#1F4E38",
          700: "#173B2A",
          800: "#10291D",
          900: "#091810",
        },
        // Brand gold (matches brand.ts gold/goldSoft).
        accent: {
          50: "#FFF7ED",
          100: "#FEECD2",
          200: "#FCD9A5",
          300: "#FABE6E",
          400: "#F5A03D",
          500: "#D97706",
          600: "#B25F05",
          700: "#8A4A04",
          800: "#633503",
          900: "#3D2002",
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
        success: "#2D6A4F",
        warning: "#D97706",
        error: "#B91C1C",
        info: "#0369A1",
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
