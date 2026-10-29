import { describe, expect, it } from 'vitest'
import { dueCards, reviewCard } from '../srs'
import { scoreAttempt } from '../scoring'
import { buildTestUrl, configFromParams, selectQuestions } from '../tests'
import { generateStudyPlan, prioritizedTopics } from '../planner'
import { addDays, iso, todayISO } from '../date'
import { questions } from '../../data/questions'
import type { Flashcard, StudyProfile } from '../../types'

const baseCard = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  id: 'fc-1',
  userId: 'u-1',
  front: 'Front',
  back: 'Back',
  deck: 'Polity',
  ease: 2.5,
  interval: 3,
  due: todayISO(),
  reviews: 1,
  lapses: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const profile: StudyProfile = {
  name: 'Test aspirant',
  language: 'en',
  attempt: 'first',
  targetYear: '2027',
  stagePriority: 'prelims',
  level: 'beginner',
  dailyHours: 6,
  strongSubjects: ['polity'],
  weakSubjects: ['economy'],
  optionalSubject: '',
  examDate: '2027-05-23',
}

describe('spaced repetition', () => {
  it('lapses a forgotten card and schedules it for tomorrow', () => {
    const reviewed = reviewCard(baseCard(), 1)
    expect(reviewed.lapses).toBe(1)
    expect(reviewed.interval).toBe(1)
    expect(reviewed.ease).toBeLessThan(2.5)
    expect(reviewed.reviews).toBe(2)
    expect(reviewed.due).toBe(iso(addDays(todayISO(), 1)))
  })

  it('expands the interval for a confidently recalled card', () => {
    const reviewed = reviewCard(baseCard(), 5)
    expect(reviewed.interval).toBeGreaterThan(3)
    expect(reviewed.lapses).toBe(0)
    expect(reviewed.reviews).toBe(2)
  })

  it('only treats cards due today or earlier as due', () => {
    const cards = [
      baseCard({ id: 'a', due: iso(addDays(todayISO(), -1)) }),
      baseCard({ id: 'b', due: todayISO() }),
      baseCard({ id: 'c', due: iso(addDays(todayISO(), 1)) }),
    ]
    expect(dueCards(cards).map(c => c.id)).toEqual(['a', 'b'])
  })
})

describe('test scoring', () => {
  const key = {
    q1: { correct: 1, options: 4 },
    q2: { correct: 2, options: 4 },
    q3: { correct: [0, 3], options: 4 },
  }

  it('applies one-third negative marking and counts accuracy', () => {
    const result = scoreAttempt([
      { questionId: 'q1', selected: 1 },
      { questionId: 'q2', selected: 0 },
      { questionId: 'q3', selected: 3 },
      { questionId: 'missing', selected: 1 },
    ], key, true)
    expect(result.correct).toBe(2)
    expect(result.incorrect).toBe(1)
    expect(result.unattempted).toBe(1)
    expect(result.score).toBe(1.67)
    expect(result.accuracy).toBe(67)
  })

  it('never returns a negative score and supports multi-select keys', () => {
    const result = scoreAttempt([
      { questionId: 'q1', selected: 0 },
      { questionId: 'q2', selected: 0 },
      { questionId: 'q3', selected: 2 },
    ], key, true)
    expect(result.score).toBe(0)
    expect(result.correct).toBe(0)
    expect(result.incorrect).toBe(3)
  })
})

describe('test configuration', () => {
  it('round-trips a custom test through the URL', () => {
    const url = buildTestUrl({ mode: 'custom', subject: 'economy', topic: 't-fiscal', count: 12, minutes: 18, negative: false, timed: true, difficulty: 'hard' })
    const config = configFromParams(new URLSearchParams(url.split('?')[1]))
    expect(config).toEqual({ mode: 'custom', subject: 'economy', topic: 't-fiscal', count: 12, minutes: 18, negative: false, timed: true, difficulty: 'hard' })
  })

  it('selects no more unique questions than requested', () => {
    const selected = selectQuestions({ mode: 'daily', count: 7, minutes: 10, negative: true, timed: true })
    expect(selected).toHaveLength(Math.min(7, questions.length))
    expect(new Set(selected.map(q => q.id)).size).toBe(selected.length)
  })

  it('restricts PYQ mode to curated or practice PYQ questions', () => {
    const selected = selectQuestions({ mode: 'pyq', count: 50, minutes: 25, negative: true, timed: true })
    expect(selected.length).toBeGreaterThan(0)
    expect(selected.every(q => q.source.type === 'pyq')).toBe(true)
  })
})

describe('study planner', () => {
  it('prioritises weak subjects and high-weight topics', () => {
    const ranked = prioritizedTopics(profile)
    expect(ranked.length).toBeGreaterThan(0)
    expect(ranked[0].subjectId).toBe('economy')
  })

  it('builds a complete plan without duplicate task ids', () => {
    const plan = generateStudyPlan(profile, 14)
    expect(plan.tasks.length).toBeGreaterThan(14)
    expect(new Set(plan.tasks.map(t => t.id)).size).toBe(plan.tasks.length)
    expect(plan.tasks.every(t => t.date >= todayISO())).toBe(true)
  })
})
