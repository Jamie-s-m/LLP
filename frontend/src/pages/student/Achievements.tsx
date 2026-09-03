import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PiLockDuotone, PiSparkleDuotone } from 'react-icons/pi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import StatCard from '../../components/ui/StatCard'
import Illustration from '../../components/illustrations/Illustration'
import { BadgeIcon } from '../../utils/badgeIcons'
import { badgeUnlock, EASE_OUT } from '../../utils/motion'

interface BadgeEntry {
  name: string
  description: string
  icon: string
  color: string
  category: string
  points: number
  rarity: string
  earned: boolean
  unlockedAt: string | null
  progress: number
}

// Style objects below set CSS custom properties (--badge-glow) that a plain className can't
// express - React's CSSProperties type has no built-in index signature for custom properties,
// so this local extension types them properly instead of reaching for `as any`.
type CSSVars = CSSProperties & Record<`--${string}`, string>

// Mirrors backend/src/data/badgeCatalog.js's CATEGORY_COLORS keys/order. 'special' is defined
// there but has no catalog entries yet - the render below skips any category with zero badges,
// so it simply won't appear until a real special-category badge exists.
const CATEGORY_ORDER = ['streak', 'achievement', 'milestone', 'special'] as const

// Escalating gold-toned treatment (per the founder's "distinct rarities should look distinct"
// ask) for the standout tiers only - common/uncommon stay the plain baseline card so the
// rare-and-up tiers actually read as special rather than every badge shouting equally. Colors
// derive from the single --warning/amber token (never a bespoke hex) at increasing intensity,
// a deliberate single-hue escalation distinct from the per-category hue already carried by
// each badge's own `color` field.
const RARITY_RING: Partial<Record<string, { mix: number; width: string }>> = {
  rare: { mix: 45, width: '1.5px' },
  epic: { mix: 75, width: '2px' },
  legendary: { mix: 100, width: '2.5px' },
}

// A badge unlocked in the last few minutes gets the celebration treatment. unlockedAt is a
// real UserAchievement timestamp from the DB (see userController.getAchievementsCatalog), not
// a fabricated signal - this only fires for an honest "you just got this" moment (e.g. arriving
// here shortly after a DailyReward claim unlocks one), never on every page load.
const RECENT_UNLOCK_WINDOW_MS = 10 * 60 * 1000
const isRecentlyUnlocked = (badge: BadgeEntry) => {
  if (!badge.earned || !badge.unlockedAt) return false
  const unlockedTime = new Date(badge.unlockedAt).getTime()
  if (Number.isNaN(unlockedTime)) return false
  return Date.now() - unlockedTime < RECENT_UNLOCK_WINDOW_MS
}

const copy = {
  en: {
    kicker: 'Milestones',
    title: 'Achievements & Badges',
    text: 'Track the milestones you have unlocked and see how close you are to the next one.',
    loading: 'Loading achievements...',
    earned: 'Earned',
    locked: 'Locked',
    total: 'Total',
    points: 'Points',
    empty: 'No badges yet — keep learning!',
    newUnlock: 'New!',
    pointsSuffix: 'pts',
    categories: { streak: 'Streak', achievement: 'Achievement', milestone: 'Milestone', special: 'Special' },
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
    categoryProgress: (earnedCount: number, total: number) => `${earnedCount}/${total} unlocked`,
    progressLabel: (pct: number) => `${pct}% complete`,
  },
  ru: {
    kicker: 'Вехи',
    title: 'Достижения и значки',
    text: 'Отслеживайте разблокированные вехи и узнайте, насколько вы близки к следующей.',
    loading: 'Загрузка достижений...',
    earned: 'Получено',
    locked: 'Заблокировано',
    total: 'Всего',
    points: 'Очки',
    empty: 'Пока нет значков — продолжайте учиться!',
    newUnlock: 'Новое!',
    pointsSuffix: 'очк.',
    categories: { streak: 'Серия', achievement: 'Достижение', milestone: 'Веха', special: 'Особое' },
    rarity: { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный' },
    categoryProgress: (earnedCount: number, total: number) => `${earnedCount}/${total} получено`,
    progressLabel: (pct: number) => `${pct}% выполнено`,
  },
  uz: {
    kicker: 'Bosqichlar',
    title: 'Yutuqlar va nishonlar',
    text: 'Qulflangan bosqichlaringizni kuzating va keyingisiga qanchalik yaqinligingizni ko‘ring.',
    loading: 'Yutuqlar yuklanmoqda...',
    earned: 'Qo‘lga kiritilgan',
    locked: 'Qulflangan',
    total: 'Jami',
    points: 'Ballar',
    empty: 'Hali nishonlar yo‘q — o‘qishni davom ettiring!',
    newUnlock: 'Yangi!',
    pointsSuffix: 'ball',
    categories: { streak: 'Ketma-ketlik', achievement: 'Yutuq', milestone: 'Bosqich', special: 'Maxsus' },
    rarity: { common: 'Oddiy', uncommon: 'O‘rtacha', rare: 'Nodir', epic: 'Ajoyib', legendary: 'Afsonaviy' },
    categoryProgress: (earnedCount: number, total: number) => `${earnedCount}/${total} qo‘lga kiritilgan`,
    progressLabel: (pct: number) => `${pct}% bajarildi`,
  },
} as const

type Copy = (typeof copy)[keyof typeof copy]

// Reads a Copy sub-record (categories/rarity) with a runtime string key without triggering
// TS2345 (Record<LiteralUnion, string> has no generic string index) - falls back to the raw
// value itself so an unrecognized key still renders something instead of going blank.
const lookup = (dict: Record<string, string>, key: string) => dict[key] ?? key

function ConfettiBurst({ color, reduced }: { color: string; reduced: boolean }) {
  if (reduced) return null
  const dots = [0, 1, 2, 3, 4, 5]
  return (
    <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
      {dots.map((i) => {
        const angle = (i / dots.length) * Math.PI * 2
        const x = Math.round(Math.cos(angle) * 34)
        const y = Math.round(Math.sin(angle) * 34)
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], x, y, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
          />
        )
      })}
    </span>
  )
}

function EarnedBadgeCard({ badge, ui, reduced }: { badge: BadgeEntry; ui: Copy; reduced: boolean }) {
  const rarityRing = RARITY_RING[badge.rarity]
  const isNew = isRecentlyUnlocked(badge)

  const cardStyle: CSSVars = {
    // Drives the tinted hover glow (see .dimensional-card.badge-card:hover in index.css) -
    // each earned badge gets a shadow tinted with its own color instead of a generic one, so
    // it reads as a distinct collected object rather than a uniform tile.
    '--badge-glow': `color-mix(in srgb, ${badge.color} 45%, transparent)`,
    ...(rarityRing
      ? {
          borderWidth: rarityRing.width,
          borderColor: `color-mix(in srgb, var(--warning) ${rarityRing.mix}%, var(--border-strong))`,
        }
      : {}),
  }

  const card = (
    <Card
      padding="md"
      className="dimensional-card badge-card relative flex flex-col items-center gap-2 text-center"
      style={cardStyle}
    >
      {rarityRing ? (
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background: `color-mix(in srgb, var(--warning) ${rarityRing.mix}%, transparent)`, color: 'var(--warning)' }}
        >
          {lookup(ui.rarity, badge.rarity)}
        </span>
      ) : null}
      {isNew ? (
        <span className="absolute -top-2.5 right-2 inline-flex items-center gap-1 rounded-full bg-[var(--warning)] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <PiSparkleDuotone aria-hidden="true" /> {ui.newUnlock}
        </span>
      ) : null}
      {isNew ? <ConfettiBurst color={badge.color} reduced={reduced} /> : null}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ background: `${badge.color}22`, color: badge.color }}
      >
        <BadgeIcon iconKey={badge.icon} />
      </div>
      <p className="font-semibold">{badge.name}</p>
      <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
      <span className="text-[11px] font-semibold" style={{ color: badge.color }}>
        +{badge.points} {ui.pointsSuffix}
      </span>
    </Card>
  )

  if (!isNew) return card

  return (
    <motion.div variants={badgeUnlock(reduced)} initial="hidden" animate="visible">
      {card}
    </motion.div>
  )
}

function LockedBadgeCard({ badge, ui }: { badge: BadgeEntry; ui: Copy }) {
  const rarityRing = RARITY_RING[badge.rarity]

  return (
    <Card padding="md" className="relative flex flex-col items-center gap-2 text-center opacity-70 grayscale">
      {rarityRing ? (
        <span
          className="absolute left-2 top-2 rounded-full bg-[var(--border-light)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]"
        >
          {lookup(ui.rarity, badge.rarity)}
        </span>
      ) : null}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--border-light)] text-3xl text-[var(--text-muted)]">
        <BadgeIcon iconKey={badge.icon} />
        <span className="absolute -bottom-1 -right-1 grayscale-0 text-[var(--text-primary)]">
          <PiLockDuotone className="text-base" aria-hidden="true" />
        </span>
      </div>
      <p className="font-semibold">{badge.name}</p>
      <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
      <div className="w-full grayscale-0">
        <ProgressBar value={badge.progress} />
        <p className="mt-1 text-[11px] text-[var(--text-subtle)]">{ui.progressLabel(badge.progress)}</p>
      </div>
    </Card>
  )
}

export default function Achievements() {
  const [badges, setBadges] = useState<BadgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const reduced = !!useReducedMotion()

  useEffect(() => {
    api.get('/users/achievements/catalog')
      .then((response) => setBadges(response.data.data || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false))
  }, [])

  const earnedBadges = badges.filter((badge) => badge.earned)
  const lockedBadges = badges.filter((badge) => !badge.earned)

  // Groups the flat catalog into one section per real `category` value (matching
  // badgeCatalog.js's CATEGORY_COLORS), in catalog order within each group so a section reads
  // as a natural difficulty progression rather than earned-first. A category with zero badges
  // (currently 'special', reserved for a future badge) is skipped rather than rendered empty.
  const categorizedBadges = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        badges: badges.filter((badge) => badge.category === category),
      })).filter((group) => group.badges.length > 0),
    [badges],
  )

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={ui.earned} value={earnedBadges.length} />
          <StatCard label={ui.total} value={badges.length} />
          <StatCard label={ui.points} value={earnedBadges.reduce((sum, badge) => sum + badge.points, 0)} />
          <StatCard label={ui.locked} value={lockedBadges.length} />
        </div>

        {loading ? (
          <div className="atlas-panel p-6 text-center text-[var(--text-muted)]">{ui.loading}</div>
        ) : badges.length === 0 ? (
          <div className="atlas-panel flex flex-col items-center gap-3 p-8 text-center text-[var(--text-muted)]">
            <Illustration name="empty" className="h-32 w-32" />
            <p>{ui.empty}</p>
          </div>
        ) : (
          categorizedBadges.map(({ category, badges: categoryBadges }) => {
            const earnedInCategory = categoryBadges.filter((badge) => badge.earned).length
            const categoryColor = categoryBadges[0]?.color || 'var(--accent)'
            return (
              <section key={category} className="mb-10">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: categoryColor }} aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold">{lookup(ui.categories, category)}</h2>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {ui.categoryProgress(earnedInCategory, categoryBadges.length)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {categoryBadges.map((badge) =>
                    badge.earned ? (
                      <EarnedBadgeCard key={badge.name} badge={badge} ui={ui} reduced={reduced} />
                    ) : (
                      <LockedBadgeCard key={badge.name} badge={badge} ui={ui} />
                    ),
                  )}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
