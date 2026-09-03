import { SITE_URL, DEFAULT_IMAGE } from '../components/Seo'
import { BRAND } from '../config/brand'

// Organization schema, meant for the homepage only (one per site, not repeated per route).
// areaServed/address target Uzbekistan explicitly - the founder's stated goal is ranking for
// "English courses in Uzbekistan/Tashkent" local-intent searches, and this is the schema
// Google actually reads to understand who a site serves geographically, distinct from just
// having the words "Uzbekistan" or "Tashkent" somewhere in body copy.
export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: BRAND.name,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  description: 'Practical English courses for work, IT, and studying or working abroad, built for learners in Uzbekistan.',
  areaServed: {
    '@type': 'Country',
    name: 'Uzbekistan',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'UZ',
    addressLocality: 'Tashkent',
  },
  sameAs: Object.values(BRAND.socialLinks),
})

interface CourseForSchema {
  _id: string
  title: string
  description: string
  language: string
  level: string
  category?: string
}

// One Course entity per course-detail page. provider ties every course back to the same
// EducationalOrganization above rather than re-describing the org on every page.
export const getCourseSchema = (course: CourseForSchema) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.title,
  description: course.description,
  provider: {
    '@type': 'EducationalOrganization',
    name: BRAND.name,
    sameAs: SITE_URL,
  },
  inLanguage: 'en',
  educationalLevel: course.level,
  ...(course.category ? { about: course.category } : {}),
  offers: {
    '@type': 'Offer',
    category: 'EducationalOccupationalProgram',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/courses/${course._id}`,
  },
})
