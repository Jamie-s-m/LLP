import { useEffect, useState } from 'react'
import { FiTrendingUp, FiAward, FiUser } from 'react-icons/fi'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

interface LeaderboardEntry {
  _id: string
  firstName: string
  lastName: string
  xp: number
  streak: number
}

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

        <div className="atlas-panel mb-8 border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 dark:border-primary-700 dark:from-primary-900/20 dark:to-secondary-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                {myRank || '—'}
              </div>
              <div>
                <p className="text-xl font-bold">{ui.yourRank}</p>
                <p className="text-muted">{ui.yourRankText}</p>
              </div>
            </div>
            <FiTrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>

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
