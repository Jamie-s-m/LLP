export const BRAND = {
  name: 'LinguaNest',
  displayName: 'LinguaNest',
  shortName: 'LinguaNest',
  domain: 'linguanest.uz',
  tagline: 'Learn. Speak. Belong.',
  concept: 'A calm place where language grows, confidence settles in, and real conversation begins.',
  supportEmail: 'support@linguanest.uz',
  socialLinks: {
    instagram: 'https://instagram.com/linguanest',
    telegram: 'https://t.me/linguanest',
    linkedin: 'https://linkedin.com/company/linguanest',
    youtube: 'https://youtube.com/@linguanest',
  },
  colors: {
    // Twin Arc palette - see docs/PHASE8_BRAND_MIGRATION.md. "primary" is wine (was terracotta),
    // "mint" is pine, "gold" unchanged in name but shifted to the new richer tone.
    primary: '#7C2D42',
    primaryDark: '#632235',
    primarySoft: '#FBEEF1',
    mint: '#3F6B52',
    mintDark: '#2F5140',
    mintSoft: '#EAF3EE',
    gold: '#C9932E',
    goldSoft: '#FBF3E4',
    coral: '#EDAAA2',
    coralSoft: '#FCEFED',
    sky: '#3E6FA6',
    skySoft: '#EAF1F8',
    background: '#F5F1EA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F4',
    border: '#E7E5E4',
    textPrimary: '#211A26',
    textSecondary: '#57534E',
    textMuted: '#78716C',
  },
} as const

export const BRAND_NAME = BRAND.name
export const BRAND_SHORT_NAME = BRAND.shortName
export const BRAND_DOMAIN = BRAND.domain
export const BRAND_TAGLINE = BRAND.tagline
export const BRAND_SUPPORT_EMAIL = BRAND.supportEmail
