import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiFilter, FiSearch, FiTarget, FiX } from 'react-icons/fi'
import { useLearningStore } from '../store/learningStore'
import { useI18n } from '../utils/i18n'
import { Spinner } from '../components/ui'

type SortMode = 'recommended' | 'title' | 'level'

const levelRank: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
}

export default function Courses() {
  const { courses, fetchCourses, isLoading } = useLearningStore()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    language: searchParams.get('language') || '',
    level: searchParams.get('level') || '',
    category: searchParams.get('category') || '',
    sort: (searchParams.get('sort') as SortMode) || 'recommended',
  })

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    const next = new URLSearchParams()
    if (filters.query) next.set('q', filters.query)
    if (filters.language) next.set('language', filters.language)
    if (filters.level) next.set('level', filters.level)
    if (filters.category) next.set('category', filters.category)
    if (filters.sort !== 'recommended') next.set('sort', filters.sort)
    setSearchParams(next, { replace: true })
  }, [filters, setSearchParams])

  const safeCourses = Array.isArray(courses) ? courses : []

  const languages = useMemo(
    () => Array.from(new Set(safeCourses.map((course) => course.language).filter(Boolean))).sort(),
    [safeCourses]
  )
  const categories = useMemo(
    () => Array.from(new Set(safeCourses.map((course) => course.category).filter(Boolean))).sort(),
    [safeCourses]
  )

  const filteredCourses = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()
    const nextCourses = safeCourses.filter((course) => {
      const matchesQuery = !normalizedQuery || [
        course.title,
        course.description,
        course.language,
        course.level,
        course.category,
      ].join(' ').toLowerCase().includes(normalizedQuery)

      const matchesLanguage = !filters.language || course.language === filters.language
      const matchesLevel = !filters.level || course.level === filters.level
      const matchesCategory = !filters.category || course.category === filters.category

      return matchesQuery && matchesLanguage && matchesLevel && matchesCategory
    })

    if (filters.sort === 'title') {
      return [...nextCourses].sort((left, right) => left.title.localeCompare(right.title))
    }

    if (filters.sort === 'level') {
      return [...nextCourses].sort((left, right) => (levelRank[left.level] || 99) - (levelRank[right.level] || 99))
    }

    return nextCourses
  }, [filters, safeCourses])

  const resetFilters = () => {
    setFilters({
      query: '',
      language: '',
      level: '',
      category: '',
      sort: 'recommended',
    })
  }

  const quickPaths = [
    { label: t('courses.quickConversation'), category: 'Conversation' },
    { label: t('courses.quickGrammar'), category: 'Grammar' },
    { label: t('courses.quickBeginner'), level: 'Beginner' },
    { label: t('courses.quickIntermediate'), level: 'Intermediate' },
  ]

  const resultLabel = filteredCourses.length === 1
    ? t('courses.matchedCount', { count: filteredCourses.length })
    : t('courses.matchedCountPlural', { count: filteredCourses.length })

  return (
    <div className="atlas-page px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">{t('courses.kicker')}</p>
          <h1 className="mb-3 text-4xl font-bold text-ink dark:text-white">{t('courses.title')}</h1>
          <p>{t('courses.copy')}</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {quickPaths.map((path) => (
            <button
              key={path.label}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                (path.category && filters.category === path.category) || (path.level && filters.level === path.level)
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slate-200 bg-white/80 text-slate-700 hover:border-primary-300 hover:text-primary-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              }`}
              onClick={() => setFilters((current) => ({
                ...current,
                category: path.category || '',
                level: path.level || '',
              }))}
            >
              {path.label}
            </button>
          ))}
        </div>

        <div className="atlas-panel mb-8 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <FiFilter />
            {t('courses.smartFilters')}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="label" htmlFor="courses-search">{t('common.search')}</label>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="courses-search"
                  className="input pl-10"
                  value={filters.query}
                  onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                  placeholder={t('courses.searchPlaceholder')}
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="courses-language">{t('common.language')}</label>
              <select
                id="courses-language"
                className="input"
                value={filters.language}
                onChange={(event) => setFilters({ ...filters, language: event.target.value })}
              >
                <option value="">{t('common.allLanguages')}</option>
                {languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="courses-level">{t('common.level')}</label>
              <select
                id="courses-level"
                className="input"
                value={filters.level}
                onChange={(event) => setFilters({ ...filters, level: event.target.value })}
              >
                <option value="">{t('common.allLevels')}</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="courses-category">{t('common.category')}</label>
              <select
                id="courses-category"
                className="input"
                value={filters.category}
                onChange={(event) => setFilters({ ...filters, category: event.target.value })}
              >
                <option value="">{t('common.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <FiTarget className="text-primary-500" aria-hidden="true" />
              <span>{resultLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="courses-sort">{t('courses.sortRecommended')}</label>
              <select
                id="courses-sort"
                className="input min-w-44"
                value={filters.sort}
                onChange={(event) => setFilters({ ...filters, sort: event.target.value as SortMode })}
              >
                <option value="recommended">{t('courses.sortRecommended')}</option>
                <option value="title">{t('courses.sortTitle')}</option>
                <option value="level">{t('courses.sortLevel')}</option>
              </select>
              <button type="button" className="btn btn-outline inline-flex items-center gap-2" onClick={resetFilters}>
                <FiX />
                {t('common.reset')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Spinner size={28} label={t('courses.title')} />
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const courseId = course._id || course.id

              return (
                <Link
                  key={courseId}
                  to={`/courses/${courseId}`}
                  className="atlas-panel rounded-3xl p-6 transition-transform hover:-translate-y-1"
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="mb-4 h-40 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {course.category ? (
                      <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                        {course.category}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[var(--border-light)] px-3 py-1 text-xs font-semibold text-ink dark:text-slate-100">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-ink dark:text-white">{course.title}</h3>
                  <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-500">{course.language}</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('courses.viewPath')}</span>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full">
              <div className="atlas-panel rounded-3xl p-8 text-center">
                <h2 className="text-2xl font-semibold text-ink dark:text-white">{t('courses.noMatchesTitle')}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {t('courses.noMatchesCopy')}
                </p>
                <button type="button" className="btn btn-primary mt-5" onClick={resetFilters}>{t('courses.showAllPaths')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
