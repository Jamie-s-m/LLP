import { FiArrowRight, FiCheckCircle, FiClock, FiMapPin, FiStar } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const tutors = [
  {
    id: 'mila',
    name: 'Mila Karimova',
    role: 'English conversation coach',
    location: 'Tashkent',
    rating: 4.9,
    reviews: 184,
    available: 'Today • 4 slots',
    specialties: ['Speaking fluency', 'Business English', 'IELTS prep'],
    accent: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
  },
  {
    id: 'nurlan',
    name: 'Nurlan Yusupov',
    role: 'Turkish tutor',
    location: 'Samarkand',
    rating: 4.8,
    reviews: 123,
    available: 'Tomorrow • 3 slots',
    specialties: ['Travel Turkish', 'Grammar clarity', 'Conversation labs'],
    accent: 'bg-secondary-500/10 text-secondary-700 dark:text-secondary-300',
  },
  {
    id: 'sara',
    name: 'Sara Mirzayeva',
    role: 'Uzbek for beginners',
    location: 'Bukhara',
    rating: 5.0,
    reviews: 210,
    available: 'Today • 2 slots',
    specialties: ['Family phrases', 'Listening skills', 'Daily routines'],
    accent: 'bg-accent-100 text-amber-700 dark:text-amber-300',
  },
]

export default function Tutors() {
  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="atlas-panel mb-8 overflow-hidden p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="atlas-kicker">Expert tutors</p>
              <h1 className="text-4xl font-bold text-ink dark:text-white md:text-5xl">Find the right tutor for your language goals.</h1>
              <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300">
                Learn with real people, not just lessons. Book one-to-one sessions, practice speaking, and build fluency with guided feedback.
              </p>
            </div>
            <div className="rounded-[1.75rem] bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-400 p-6 text-white shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.18em] text-white/80">Live availability</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">12 tutors online</span>
              </div>
              <div className="space-y-3 text-sm text-white/90">
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                  <span>English conversation</span>
                  <span className="font-semibold">8 slots</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                  <span>Turkish speaking</span>
                  <span className="font-semibold">5 slots</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                  <span>Uzbek basics</span>
                  <span className="font-semibold">4 slots</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-ink dark:text-white">Top tutors this week</h2>
          <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            Browse courses <FiArrowRight />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tutors.map((tutor) => (
            <article key={tutor.id} className="atlas-panel rounded-[1.75rem] p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-lg font-bold text-white">
                    {tutor.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink dark:text-white">{tutor.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{tutor.role}</p>
                  </div>
                </div>
                <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <span className="inline-flex items-center gap-1"><FiStar className="text-[11px]" /> {tutor.rating}</span>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1"><FiMapPin /> {tutor.location}</span>
                <span className="inline-flex items-center gap-1"><FiClock /> {tutor.available}</span>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {tutor.specialties.map((skill) => (
                  <span key={skill} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tutor.accent}`}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-100/80 px-3 py-2 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                <span>{tutor.reviews} reviews</span>
                <span className="font-semibold">{tutor.available}</span>
              </div>

              <button className="btn btn-primary w-full justify-center text-sm">
                Book a lesson
              </button>
            </article>
          ))}
        </div>

        <div className="atlas-panel mt-8 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="atlas-kicker">How tutoring works</p>
              <h3 className="text-2xl font-bold text-ink dark:text-white">Schedule a tutor match in under 10 minutes.</h3>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-2 text-success"><FiCheckCircle /> Match your learning goal</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-2 text-primary-700 dark:text-primary-300"><FiCheckCircle /> Pick a slot</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-2 text-amber-700 dark:text-amber-300"><FiCheckCircle /> Practice live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
