import { useLocation } from 'react-router-dom'
import Seo from './Seo'

// Site-wide fallback title/description/OG tags for any route that doesn't render its own more
// specific <Seo> (most protected app pages - there's no SEO value in a per-route title for a
// page search engines can't reach past the login gate anyway). Rendered as a sibling inside
// <Router> so useLocation works; a page's own <Seo>, mounted deeper in the tree, overrides this
// one via react-helmet-async's standard "last Helmet wins" merge - confirmed live, not assumed.
export default function DefaultSeo() {
  const { pathname } = useLocation()

  return (
    <Seo
      title="English Courses in Uzbekistan"
      description="Practical English courses in Uzbekistan for work, IT, and studying or working abroad. Free placement test, CEFR-referenced lessons, and local pricing via Payme or Click."
      path={pathname}
    />
  )
}
