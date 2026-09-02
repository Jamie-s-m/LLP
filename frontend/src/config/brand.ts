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
    // Terracotta is primary - reverted from gold at the founder's request after seeing gold
    // live ("the original color... the orange one"). See docs/PHASE8_BRAND_MIGRATION.md for
    // the full history (wine -> gold -> terracotta). The Twin Arc logo mark's own colors
    // (public/brand/twin-arc/) were updated to match: terracotta + wine, replacing gold,
    // which no longer has any role in the product - UI or mark.
    primary: '#C84B31',
    primaryDark: '#A33D28',
    primarySoft: '#FDF2F0',
    wine: '#7C2D42',
    wineDark: '#632235',
    wineSoft: '#FBEEF1',
    mint: '#3F6B52',
    mintDark: '#2F5140',
    mintSoft: '#EAF3EE',
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
