import type { Difficulty, MCQQuestion } from '../types'
import { questions } from '../data/questions'

export type TestMode = 'daily' | 'topic' | 'subject' | 'full' | 'pyq' | 'custom'

export interface TestConfig {
  mode: TestMode
  subject?: string
  topic?: string
  difficulty?: Difficulty | 'all'
  count: number
  minutes: number
  negative: boolean
  timed: boolean
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  let s = seed
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function selectQuestions(config: TestConfig): MCQQuestion[] {
  let pool = [...questions]
  if (config.mode === 'pyq') pool = pool.filter(q => q.source.type === 'pyq')
  if (config.mode === 'topic' && config.topic) pool = pool.filter(q => q.topicId === config.topic || q.relatedTopicIds?.includes(config.topic!))
  if ((config.mode === 'subject' || config.mode === 'custom' || config.mode === 'topic') && config.subject) pool = pool.filter(q => q.subjectId === config.subject)
  if (config.difficulty && config.difficulty !== 'all') {
    const filtered = pool.filter(q => q.difficulty === config.difficulty)
    if (filtered.length >= Math.min(4, config.count)) pool = filtered
  }
  const day = new Date().toISOString().slice(0, 10)
  const seed = day.split('-').reduce((s, n) => s + Number(n), 0) + config.mode.length * 17
  pool = seededShuffle(pool, seed)
  return pool.slice(0, Math.min(config.count, pool.length))
}

export function configFromParams(params: URLSearchParams): TestConfig {
  const mode = (params.get('type') as TestMode) || 'daily'
  const defaults: Record<TestMode, { count: number; minutes: number }> = {
    daily: { count: 10, minutes: 10 },
    topic: { count: 10, minutes: 12 },
    subject: { count: 12, minutes: 15 },
    full: { count: 30, minutes: 45 },
    pyq: { count: 20, minutes: 25 },
    custom: { count: 15, minutes: 20 },
  }
  return {
    mode,
    subject: params.get('subject') ?? undefined,
    topic: params.get('topic') ?? undefined,
    difficulty: (params.get('difficulty') as Difficulty | 'all') || 'all',
    count: Number(params.get('count')) || defaults[mode].count,
    minutes: Number(params.get('minutes')) || defaults[mode].minutes,
    negative: params.get('negative') !== 'false',
    timed: params.get('timed') !== 'false',
  }
}

export function buildTestUrl(config: TestConfig) {
  const params = new URLSearchParams({
    type: config.mode,
    count: String(config.count),
    minutes: String(config.minutes),
    negative: String(config.negative),
    timed: String(config.timed),
    difficulty: config.difficulty ?? 'all',
  })
  if (config.subject) params.set('subject', config.subject)
  if (config.topic) params.set('topic', config.topic)
  return `/prelims/test?${params.toString()}`
}
