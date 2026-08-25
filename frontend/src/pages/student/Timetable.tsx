import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi'

const schedule = [
  {
    day: 'Mon',
    time: '09:00 - 10:00',
    title: 'Conversation Lab',
    teacher: 'Amina Karimova',
    room: 'Live room A',
  },
  {
    day: 'Wed',
    time: '13:30 - 14:30',
    title: 'Grammar Sprint',
    teacher: 'Daniel Lee',
    room: 'Lesson studio',
  },
  {
    day: 'Fri',
    time: '16:00 - 17:00',
    title: 'Speaking Clinic',
    teacher: 'Mila Hasan',
    room: 'Mentor lounge',
  },
]

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

        <div className="grid gap-4">
          {schedule.map((item) => (
            <div key={`${item.day}-${item.time}`} className="atlas-panel p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                    {item.day}
                  </div>
                  <h2 className="text-xl font-semibold text-ink dark:text-white">{item.title}</h2>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  <FiClock size={15} />
                  {item.time}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink dark:text-white">Tutor:</span>
                  <span>{item.teacher}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMapPin size={15} />
                  <span>{item.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
