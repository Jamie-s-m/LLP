import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'LinguaNest'
const SITE_URL = 'https://linguanest.uz'
const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512x512.png`

interface SeoProps {
  /** Page-specific title. Rendered as "{title} | LinguaNest" unless isHome is set. */
  title: string
  description: string
  /** Path starting with "/", e.g. "/courses" or "/courses/abc123". Used for canonical + og:url. */
  path: string
  image?: string
  isHome?: boolean
  /** One or more JSON-LD structured-data objects to embed. */
  jsonLd?: object | object[]
}

// Centralizes what index.html's static <head> only had one copy of (title/description/OG/
// Twitter tags, all identical on every route before this component existed - confirmed via a
// live check that the whole site shared one generic title/description regardless of page,
// which is a real ranking-relevance gap for course-detail pages specifically). Helmet's tags
// are merged over index.html's static defaults for whichever route is currently mounted.
export default function Seo({ title, description, path, image, isHome, jsonLd }: SeoProps) {
  const fullTitle = isHome ? title : `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${path}`
  const ogImage = image || DEFAULT_IMAGE
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {jsonLdList.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  )
}

export { SITE_NAME, SITE_URL, DEFAULT_IMAGE }
