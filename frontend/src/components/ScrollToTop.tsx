import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router doesn't reset scroll position on navigation - the browser just keeps whatever
// scrollY the previous page had. Landing on a shorter page while still scrolled from a taller
// one clamps to that page's own bottom, which is what reads as "it jumps to the bottom" on
// every screen change. `behavior: 'instant'` bypasses the global `scroll-smooth` on <html> so
// this reset doesn't visibly animate - it should feel like every page starts at the top, not
// like it scrolls there.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
