import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { useI18n } from '../utils/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <img src={`${import.meta.env.BASE_URL}linguanest-mark.svg`} alt="" width="128" height="128" className="h-9 w-9 object-contain" loading="lazy" />
            <div>
              <p className="font-['Bricolage_Grotesque',sans-serif] text-[1.05rem] font-black tracking-[-0.06em] text-[var(--text-primary)] dark:text-white">
                Lingua<span className="text-[var(--accent-hover)]">Nest</span>
              </p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white">{BRAND.tagline}</h2>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">
            {t('footer.description')}
          </p>
        </div>
        <div className="border-t border-[var(--border)] pt-6 text-center dark:border-[var(--dark-border)] md:border-0 md:pt-0 md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-[var(--dark-text-muted)]">{t('footer.product')}</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/courses" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('nav.courses')}</Link>
            <Link to="/pricing" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('nav.pricing')}</Link>
            <Link to="/forum" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('footer.communityForum')}</Link>
          </div>
        </div>
        <div className="border-t border-[var(--border)] pt-6 text-center dark:border-[var(--dark-border)] md:border-0 md:pt-0 md:text-left">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-[var(--dark-text-muted)]">{t('footer.legal')}</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/terms" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('footer.terms')}</Link>
            <Link to="/privacy" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('footer.privacy')}</Link>
            <Link to="/cookies" className="text-[var(--text-muted)] transition hover:text-[var(--accent)] dark:text-[var(--dark-text-secondary)]">{t('footer.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
