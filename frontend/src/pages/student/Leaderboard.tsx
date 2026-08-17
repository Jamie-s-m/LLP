import { FiTrendingUp, FiAward, FiUser } from 'react-icons/fi'

export default function Leaderboard() {
  const leaderboard = [
    { rank: 1, name: 'Alice Johnson', points: 4250, streak: 15, badge: '🥇' },
    { rank: 2, name: 'Bob Smith', points: 3890, streak: 12, badge: '🥈' },
    { rank: 3, name: 'Carol White', points: 3650, streak: 10, badge: '🥉' },
    { rank: 4, name: 'David Lee', points: 3200, streak: 8, badge: '⭐' },
    { rank: 5, name: 'Emma Davis', points: 2980, streak: 7, badge: '⭐' },
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Global Leaderboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Top language learners this month</p>
        </div>

        {/* Your Rank Card */}
        <div className="card mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-2 border-primary-200 dark:border-primary-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                42
              </div>
              <div>
                <p className="text-xl font-bold">Your Rank</p>
                <p className="text-neutral-600 dark:text-neutral-400">1,250 points this month</p>
              </div>
            </div>
            <FiTrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-4 px-4 font-bold">Rank</th>
                  <th className="text-left py-4 px-4 font-bold">User</th>
                  <th className="text-right py-4 px-4 font-bold">Points</th>
                  <th className="text-right py-4 px-4 font-bold">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user) => (
                  <tr
                    key={user.rank}
                    className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.badge}</span>
                        <span className="font-bold text-lg">{user.rank}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                          <FiUser size={20} />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-primary-500">{user.points.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full text-sm font-medium">
                        <FiAward size={16} /> {user.streak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
