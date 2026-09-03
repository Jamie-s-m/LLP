import { useEffect, useState } from 'react'
import { FiTrendingUp, FiAward, FiUser } from 'react-icons/fi'
import { PiMedalFill } from 'react-icons/pi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface LeaderboardEntry {
  _id: string
  firstName: string
  lastName: string
  xp: number
  streak: number
}

const MEDAL_COLORS = { 1: '#d4af37', 2: '#a8a8a8', 3: '#b08d57' } as const

const copy = {
  en: { kicker: 'Learner ranking', title: 'Global Leaderboard', text: 'See top learners, compare momentum, and use your rank as a daily motivation signal.', yourRank: 'Your Rank', yourRankText: 'Keep learning to climb higher', loading: 'Loading leaderboard...', empty: 'No ranked learners yet.', rank: 'Rank', user: 'User', points: 'Points', streak: 'Streak' },
  ru: { kicker: 'Рейтинг учеников', title: 'Глобальный рейтинг', text: 'Смотрите лучших учеников, сравнивайте темп и используйте свой ранг как ежедневную мотивацию.', yourRank: 'Ваше место', yourRankText: 'Продолжайте учиться, чтобы подняться выше', loading: 'Загрузка рейтинга...', empty: 'Пока нет ранжированных учеников.', rank: 'Место', user: 'Пользователь', points: 'Баллы', streak: 'Серия' },
  uz: { kicker: 'Talabalar reytingi', title: 'Global reyting', text: 'Eng yaxshi o‘quvchilarni ko‘ring, sur’atni taqqoslang va o‘z o‘rningizni kundalik motivatsiya sifatida ishlating.', yourRank: 'Sizning o‘rningiz', yourRankText: 'Yuqoriga chiqish uchun o‘qishni davom ettiring', loading: 'Reyting yuklanmoqda...', empty: 'Hali reytingga kirgan o‘quvchilar yo‘q.', rank: 'O‘rin', user: 'Foydalanuvchi', points: 'Ballar', streak: 'Seriya' },
} as const

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState(0)
  const [loading, setLoading] = useState(true)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  useEffect(() => {
    api.get('/users/leaderboard')
      .then((response) => {
        setLeaderboard(response.data.data?.leaderboard || [])
        setMyRank(response.data.data?.myRank || 0)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{ui.kicker}</p>
          <h1>{ui.title}</h1>
          <p>{ui.text}</p>
        </div>

        {/* Podium + Your Rank used to be two separate full-height panels stacked with their
            own margins/padding, pushing the actual ranked table two scroll-screens down on
            mobile. Combined into one panel (Your Rank as a slim attached strip) when the
            podium renders; Your Rank still shows on its own, compact, when there aren't
            enough ranked learners for a podium. */}
        {leaderboard.length >= 3 ? (
          <div className="atlas-panel mb-8">
            <div className="flex items-end justify-center gap-3 p-6 sm:gap-6">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, position) => {
                const place = position === 1 ? 1 : position === 0 ? 2 : 3
                const heights = { 1: 'h-40', 2: 'h-28', 3: 'h-20' } as const
                return (
                  <div key={entry._id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      {entry.firstName?.[0]}
                    </div>
                    <p className="max-w-[6rem] truncate text-sm font-semibold">{entry.firstName}</p>
                    <div className={`flex w-full flex-col items-center justify-start rounded-t-xl bg-[var(--accent-light)] pt-2 ${heights[place]}`}>
                      <PiMedalFill className="text-2xl" style={{ color: MEDAL_COLORS[place] }} aria-label={`Rank ${place}`} />
                      <span className="mt-1 text-xs font-bold text-[var(--accent)]">{entry.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-sm font-bold text-white">
                  {myRank || '—'}
                </div>
                <div>
                  <p className="text-sm font-bold">{ui.yourRank}</p>
                  <p className="text-xs text-muted">{ui.yourRankText}</p>
                </div>
              </div>
              <FiTrendingUp className="h-5 w-5 shrink-0 text-primary-500" />
            </div>
          </div>
        ) : (
          <div className="atlas-panel mb-8 flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-sm font-bold text-white">
                {myRank || '—'}
              </div>
              <div>
                <p className="text-sm font-bold">{ui.yourRank}</p>
                <p className="text-xs text-muted">{ui.yourRankText}</p>
              </div>
            </div>
            <FiTrendingUp className="h-5 w-5 shrink-0 text-primary-500" />
          </div>
        )}

        <div className="atlas-panel p-2 sm:p-4">
          {loading ? (
            <p className="text-center py-12">{ui.loading}</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center py-12 text-muted">{ui.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-4 px-4 font-bold">{ui.rank}</th>
                    <th className="text-left py-4 px-4 font-bold">{ui.user}</th>
                    <th className="text-right py-4 px-4 font-bold">{ui.points}</th>
                    <th className="text-right py-4 px-4 font-bold">{ui.streak}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-bold text-lg">{index + 1}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <FiUser size={20} />
                          </div>
                          <span className="font-medium">{entry.firstName} {entry.lastName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-primary-500">{entry.xp.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full text-sm font-medium">
                          <FiAward size={16} /> {entry.streak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
