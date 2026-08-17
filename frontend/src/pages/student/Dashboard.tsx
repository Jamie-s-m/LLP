export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-500">1,250</p>
          <p className="text-neutral-600 dark:text-neutral-400">Total Points</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-secondary-500">12</p>
          <p className="text-neutral-600 dark:text-neutral-400">Current Streak</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-success">5</p>
          <p className="text-neutral-600 dark:text-neutral-400">Enrolled Courses</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-warning">42%</p>
          <p className="text-neutral-600 dark:text-neutral-400">Overall Progress</p>
        </div>
      </div>
    </div>
  )
}
