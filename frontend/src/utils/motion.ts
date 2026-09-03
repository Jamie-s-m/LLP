import type { Variants } from 'framer-motion'

// Phase 20 motion conventions. Component-level micro-interactions only - framer-motion's
// AnimatePresence is deliberately NOT used for route-level transitions anywhere in this app;
// see the comment above .fadeInRoute in index.css for the confirmed React.lazy deadlock this
// caused previously. Durations mirror index.css's --duration-fast/--duration-base scale so
// CSS and framer-motion animations feel like one system rather than two.
export const DURATION_FAST = 0.15
export const DURATION_BASE = 0.25
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_IN = [0.7, 0, 0.84, 0] as const

// The global CSS prefers-reduced-motion block (index.css) collapses CSS transitions/
// animations automatically, but framer-motion drives transforms via inline styles that CSS
// media queries can't reach - components must call useReducedMotion() themselves and pass
// the result here. Every variant below degrades to a plain opacity fade with no transform
// when reduced is true, rather than skipping motion entirely, so content still visibly
// settles into place.
export function fadeInUp(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION_BASE, ease: EASE_OUT } },
  }
}

export function cardHoverTilt(reduced: boolean): Variants {
  if (reduced) {
    return { rest: {}, hover: {} }
  }
  return {
    rest: { rotateX: 0, rotateY: 0, y: 0, scale: 1 },
    hover: {
      rotateX: 4,
      rotateY: -4,
      y: -4,
      scale: 1.01,
      transition: { duration: DURATION_BASE, ease: EASE_OUT },
    },
  }
}

// Achievement/badge unlock - a deliberate "pop" moment, the one place this app allows a
// slightly more energetic curve than the calm EASE_OUT used everywhere else, matching the
// brand voice's "encouraging, specific" personality for a genuine milestone rather than
// routine UI chrome.
export function badgeUnlock(reduced: boolean): Variants {
  if (reduced) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  }
  return {
    hidden: { opacity: 0, scale: 0.6, rotate: -8 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', stiffness: 260, damping: 18 },
    },
  }
}

// CEFR Orbit: the marker travels from its previous position to the new one when a level
// completes. Consumers pass the pixel/percentage delta as custom `x`/`y` via the `custom`
// prop on motion.circle - kept generic here rather than hardcoding the Orbit's own geometry.
export function orbitMarkerAdvance(reduced: boolean): Variants {
  return {
    animate: (custom: { x: number; y: number }) => ({
      cx: custom.x,
      cy: custom.y,
      transition: reduced ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT },
    }),
  }
}
