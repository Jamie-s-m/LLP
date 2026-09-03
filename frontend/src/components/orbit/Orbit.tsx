import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { orbitMarkerAdvance } from '../../utils/motion'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export type OrbitSkill = {
  key: string
  label: string
  /** 0-100 mastery for this skill at the current level. */
  mastery: number
}

export type OrbitAchievement = {
  id: string
  label: string
  /** Which ring this achievement is logged against. */
  level: CefrLevel
}

type OrbitProps = {
  currentLevel: CefrLevel
  /** 0-100 progress through currentLevel toward the next ring. */
  levelProgress: number
  skills?: OrbitSkill[]
  achievements?: OrbitAchievement[]
  /** Compact renders a smaller, label-free version for the Dashboard snippet; full is the
      complete CEFR/Progress and placement-result treatment with labels and a legend. */
  variant?: 'compact' | 'full'
  className?: string
}

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const RADII: Record<CefrLevel, number> = { A1: 60, A2: 95, B1: 130, B2: 165, C1: 200 }
const SIZE = 440
const CENTER = SIZE / 2

function pointOnRing(radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  }
}

// The learner's position starts at the top of the current ring (12 o'clock) and travels
// clockwise as levelProgress advances toward the next level.
function markerAngle(progress: number) {
  return -90 + (Math.max(0, Math.min(100, progress)) / 100) * 360
}

// Skill nodes sit on the current ring at fixed anchor angles, independent of the learner's
// progress marker - a constellation around the ring rather than points along its path.
function skillAngle(index: number, count: number) {
  return -90 + (360 / count) * index
}

export default function Orbit({
  currentLevel,
  levelProgress,
  skills = [],
  achievements = [],
  variant = 'full',
  className = '',
}: OrbitProps) {
  const reduced = useReducedMotion()
  const currentIndex = LEVELS.indexOf(currentLevel)
  const marker = useMemo(() => pointOnRing(RADII[currentLevel], markerAngle(levelProgress)), [currentLevel, levelProgress])
  const isCompact = variant === 'compact'

  const summary = `${currentLevel}, ${Math.round(levelProgress)}% toward ${LEVELS[currentIndex + 1] ?? 'mastery'}`

  if (isCompact) {
    // The full nested-rings geometry (radii 60-200) reads as hairlines at a ~100px snippet
    // size - compact collapses to a single donut representing overall journey position
    // (whole levels completed + progress through the current one) with the level code in
    // the center, rather than 5 concentric strokes fighting for a handful of pixels.
    const overallPercent = ((currentIndex + levelProgress / 100) / LEVELS.length) * 100
    const strokeWidth = 14
    const radius = CENTER - strokeWidth
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - overallPercent / 100)
    return (
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} role="img" aria-label={`CEFR progress orbit: ${summary}`}>
        <circle cx={CENTER} cy={CENTER} r={radius} fill="none" stroke="var(--border-strong)" strokeOpacity={0.4} strokeWidth={strokeWidth} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="central" fontSize={72} fontWeight={800} fill="var(--accent)" className="font-display">
          {currentLevel}
        </text>
      </svg>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      role="img"
      aria-label={`CEFR progress orbit: ${summary}`}
    >
      {/* Nest: the center home point every ring travels around, echoing the Twin Arc mark's
          own two-arc geometry and the product name (LinguaNest = home the learner returns to). */}
      <circle cx={CENTER} cy={CENTER} r={20} fill="var(--accent)" opacity={0.14} />
      <circle cx={CENTER} cy={CENTER} r={8} fill="var(--accent)" />

      {LEVELS.map((level, i) => {
        const completed = i < currentIndex
        const active = i === currentIndex
        const radius = RADII[level]
        return (
          <g key={level}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radius}
              fill="none"
              stroke={completed || active ? 'var(--accent)' : 'var(--border-strong)'}
              strokeOpacity={completed ? 0.9 : active ? 0.55 : 0.35}
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray={active ? undefined : '3 6'}
            />
            <text
              x={CENTER}
              y={CENTER - radius - 6}
              textAnchor="middle"
              fontSize={12}
              fontWeight={active ? 700 : 500}
              fill={active ? 'var(--accent)' : 'var(--text-subtle)'}
              className="font-display"
            >
              {level}
            </text>
          </g>
        )
      })}

      {/* Skill constellation - only rendered on the current ring, so it reads as "what you're
          working on now" rather than a permanent decoration on every level. */}
      {skills.map((skill, i) => {
          const pos = pointOnRing(RADII[currentLevel], skillAngle(i, skills.length))
          const r = 5 + (skill.mastery / 100) * 5
          return (
            <g key={skill.key}>
              <circle cx={pos.x} cy={pos.y} r={r} fill="var(--info)" opacity={0.25 + (skill.mastery / 100) * 0.6}>
                <title>{`${skill.label}: ${Math.round(skill.mastery)}%`}</title>
              </circle>
            </g>
          )
        })}

      {/* Achievement markers collected along completed rings. */}
      {achievements.map((achievement) => {
          const level = LEVELS.indexOf(achievement.level)
          if (level < 0 || level >= currentIndex) return null
          const siblingsOnRing = achievements.filter((a) => a.level === achievement.level)
          const idxOnRing = siblingsOnRing.findIndex((a) => a.id === achievement.id)
          const pos = pointOnRing(RADII[achievement.level], skillAngle(idxOnRing, Math.max(siblingsOnRing.length, 1)))
          return (
            <circle key={achievement.id} cx={pos.x} cy={pos.y} r={4} fill="var(--wine)">
              <title>{achievement.label}</title>
            </circle>
          )
        })}

      {/* The learner's current position - the one element that actually animates. */}
      <motion.circle
        r={10}
        fill="var(--on-accent)"
        stroke="var(--accent)"
        strokeWidth={3}
        variants={orbitMarkerAdvance(!!reduced)}
        animate="animate"
        custom={marker}
        initial={false}
      />
    </svg>
  )
}
