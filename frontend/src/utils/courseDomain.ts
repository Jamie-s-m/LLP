import type { IllustrationName } from '../components/illustrations/Illustration'

export type CourseDomain = 'general' | 'business' | 'speaking' | 'kids' | 'travel'

// Course.category (backend) is a SKILL taxonomy (Grammar/Vocabulary/Conversation/...), not a
// subject-domain one - there's no dedicated "domain" field. This derives a real, visible
// subject identity from the course title itself (which does carry that information - "English
// for Kids", "Business English", "English Speaking") rather than fabricating data or forcing
// every course through the same generic per-language treatment CourseCard used to use (which
// was near-meaningless while the catalog is effectively single-language).
const DOMAIN_KEYWORDS: Array<{ domain: CourseDomain; pattern: RegExp }> = [
  { domain: 'kids', pattern: /\bkids?\b|\bchild(ren)?\b/i },
  { domain: 'business', pattern: /\bbusiness\b|\bwork\b|\bcareer\b|\boffice\b/i },
  { domain: 'speaking', pattern: /\bspeak(ing)?\b|\bconversation\b/i },
  { domain: 'travel', pattern: /\btravel\b|\btrip\b|\bvacation\b/i },
]

export function courseDomainFor(course: { title?: string; category?: string }): CourseDomain {
  const title = course.title || ''
  // "General English A1/A2/B1/B2" is a deliberate product-line label spanning all four
  // levels, each of which happens to emphasize a different skill (Writing/Reading/Grammar/
  // Conversation) - that's real per-level variety, not a domain difference, so the series
  // stays one consistent visual identity rather than the A1 entry alone reading as "Speaking"
  // just because its skill-category is Conversation. Checked before the category fallback.
  if (/\bgeneral english\b/i.test(title)) return 'general'
  // Title otherwise wins first - it's the strongest, most specific signal ("English for
  // Kids"). Category is only a fallback for a title that doesn't say anything itself.
  for (const { domain, pattern } of DOMAIN_KEYWORDS) {
    if (pattern.test(title)) return domain
  }
  for (const { domain, pattern } of DOMAIN_KEYWORDS) {
    if (pattern.test(course.category || '')) return domain
  }
  return 'general'
}

export const DOMAIN_META: Record<CourseDomain, { colorVar: string; illustration: IllustrationName; labelKey: string }> = {
  general: { colorVar: '--category-general', illustration: 'book-lover', labelKey: 'courseDomain.general' },
  business: { colorVar: '--category-business', illustration: 'business-chat', labelKey: 'courseDomain.business' },
  speaking: { colorVar: '--category-speaking', illustration: 'conversation', labelKey: 'courseDomain.speaking' },
  kids: { colorVar: '--category-kids', illustration: 'children', labelKey: 'courseDomain.kids' },
  travel: { colorVar: '--category-travel', illustration: 'around-the-world', labelKey: 'courseDomain.travel' },
}
