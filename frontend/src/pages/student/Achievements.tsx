import { useEffect, useState } from 'react'
import { PiLockDuotone } from 'react-icons/pi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import { BadgeIcon } from '../../utils/badgeIcons'

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

const copy = {
  en: { kicker: 'Milestones', title: 'Achievements & Badges', text: 'Track the milestones you have unlocked and see how close you are to the next one.', loading: 'Loading achievements...', earned: 'Earned', locked: 'Locked', empty: 'No badges yet — keep learning!' },
  ru: { kicker: 'Вехи', title: 'Достижения и значки', text: 'Отслеживайте разблокированные вехи и узнайте, насколько вы близки к следующей.', loading: 'Загрузка достижений...', earned: 'Получено', locked: 'Заблокировано', empty: 'Пока нет значков — продолжайте учиться!' },
  uz: { kicker: 'Bosqichlar', title: 'Yutuqlar va nishonlar', text: 'Qulflangan bosqichlaringizni kuzating va keyingisiga qanchalik yaqinligingizni ko‘ring.', loading: 'Yutuqlar yuklanmoqda...', earned: 'Qo‘lga kiritilgan', locked: 'Qulflangan', empty: 'Hali nishonlar yo‘q — o‘qishni davom ettiring!' },
} as const

export default function Achievements() {
  const [badges, setBadges] = useState<BadgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    api.get('/users/achievements/catalog')
      .then((response) => setBadges(response.data.data || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false))
  }, [])

  const earnedBadges = badges.filter((badge) => badge.earned)
  const lockedBadges = badges.filter((badge) => !badge.earned)

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="text-center"><strong className="font-display text-3xl font-extrabold text-[var(--accent)]">{earnedBadges.length}</strong><p className="mt-1 text-sm text-[var(--text-muted)]">{ui.earned}</p></Card>
          <Card className="text-center"><strong className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{badges.length}</strong><p className="mt-1 text-sm text-[var(--text-muted)]">Total</p></Card>
          <Card className="text-center"><strong className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{earnedBadges.reduce((sum, badge) => sum + badge.points, 0)}</strong><p className="mt-1 text-sm text-[var(--text-muted)]">Points</p></Card>
          <Card className="text-center"><strong className="font-display text-3xl font-extrabold text-[var(--text-primary)]">{lockedBadges.length}</strong><p className="mt-1 text-sm text-[var(--text-muted)]">{ui.locked}</p></Card>
        </div>

        {loading ? (
          <p className="py-12 text-center text-[var(--text-muted)]">{ui.loading}</p>
        ) : badges.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">{ui.empty}</p>
        ) : (
          <>
            <h2 className="mb-4 font-display text-xl font-bold">{ui.earned}</h2>
            <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {earnedBadges.map((badge) => (
                <Card key={badge.name} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                    style={{ background: `${badge.color}22`, color: badge.color }}
                  >
                    <BadgeIcon iconKey={badge.icon} />
                  </div>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
                </Card>
              ))}
            </div>

            <h2 className="mb-4 font-display text-xl font-bold">{ui.locked}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {lockedBadges.map((badge) => (
                <Card key={badge.name} className="flex flex-col items-center gap-2 text-center opacity-70 grayscale">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--border-light)] text-3xl text-[var(--text-muted)]">
                    <BadgeIcon iconKey={badge.icon} />
                    <span className="absolute -bottom-1 -right-1 grayscale-0 text-[var(--text-primary)]"><PiLockDuotone className="text-base" aria-hidden="true" /></span>
                  </div>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
                  <div className="w-full grayscale-0">
                    <ProgressBar value={badge.progress} />
                    <p className="mt-1 text-[11px] text-[var(--text-subtle)]">{badge.progress}%</p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
