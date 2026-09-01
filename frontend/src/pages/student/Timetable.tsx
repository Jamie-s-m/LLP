import { Link } from 'react-router-dom'
import { FiCalendar, FiUsers } from 'react-icons/fi'

export default function Timetable() {
  return (
    <div className="atlas-page px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            <FiCalendar size={22} />
          </div>
          <div>
            <p className="atlas-kicker">Learning calendar</p>
            <h1 className="text-3xl font-bold text-ink dark:text-white">My timetable</h1>
          </div>
        </div>

        <div className="atlas-panel flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            <FiUsers size={26} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink dark:text-white">Live scheduled classes aren&apos;t available yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
              LinguaNest doesn&apos;t have real tutor-led class bookings connected yet, so this page won&apos;t show a fabricated schedule.
              Join the tutor waitlist to be notified when live, bookable sessions launch.
            </p>
          </div>
          <Link to="/tutors" className="btn btn-primary mt-2">
            Join the tutor waitlist
          </Link>
        </div>
      </div>
    </div>
  )
}
