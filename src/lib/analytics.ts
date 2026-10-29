import type { AppData, Attempt, MCQQuestion, TopicProgress } from '../types'
import { questions } from '../data/questions'
import { subjects, totalTopics, topics } from '../data/syllabus'
import { pct } from './scoring'
import { todayISO } from './date'

const qMap = new Map(questions.map(q => [q.id, q]))

export interface SubjectStat {
  subjectId: string
  name: string
  color: string
  attempted: number
  correct: number
  accuracy: number
  minutes: number
  progress: number
}

export interface TopicStat {
  topicId: string
  name: string
  subjectId: string
  attempted: number
  correct: number
  accuracy: number
  status: TopicProgress['status']
  priority: 'high' | 'medium' | 'low'
}

export function attemptAnswers(attempt: Attempt) {
  return attempt.answers.map(a => {
    const q = qMap.get(a.questionId)
    const isCorrect = q && a.selected !== null
      ? (Array.isArray(q.correct) ? q.correct.includes(a.selected) : q.correct === a.selected)
      : false
    return { ...a, question: q, isCorrect }
  }).filter(a => a.question)
}

export function subjectStats(attempts: Attempt[], progress: Record<string, TopicProgress> = {}): SubjectStat[] {
  return subjects.map(subject => {
    let attempted = 0
    let correct = 0
    for (const attempt of attempts) {
      for (const a of attemptAnswers(attempt)) {
        if (a.question!.subjectId !== subject.id) continue
        if (a.selected !== null) attempted += 1
        if (a.isCorrect) correct += 1
      }
    }
    const subjectTopics = topics.filter(t => t.subjectId === subject.id)
    const touched = subjectTopics.filter(t => progress[t.id] && progress[t.id].status !== 'not-started').length
    return {
      subjectId: subject.id,
      name: subject.name,
      color: subject.color,
      attempted,
      correct,
      accuracy: pct(correct, attempted),
      minutes: subjectTopics.reduce((sum, t) => sum + (progress[t.id]?.minutes ?? 0), 0),
      progress: pct(touched, subjectTopics.length),
    }
  }).filter(s => s.attempted > 0 || s.progress > 0 || s.minutes > 0)
}

export function topicStats(attempts: Attempt[], progress: Record<string, TopicProgress> = {}): TopicStat[] {
  return topics.map(topic => {
    let attempted = 0
    let correct = 0
    for (const attempt of attempts) {
      for (const a of attemptAnswers(attempt)) {
        if (a.question!.topicId !== topic.id) continue
        if (a.selected !== null) attempted += 1
        if (a.isCorrect) correct += 1
      }
    }
    return {
      topicId: topic.id,
      name: topic.name,
      subjectId: topic.subjectId,
      attempted,
      correct,
      accuracy: pct(correct, attempted),
      status: progress[topic.id]?.status ?? 'not-started',
      priority: topic.weight,
    }
  })
}

export function weakTopics(attempts: Attempt[], progress: Record<string, TopicProgress> = {}) {
  return topicStats(attempts, progress)
    .filter(t => t.attempted >= 1 && t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted)
    .slice(0, 6)
}

export function strongTopics(attempts: Attempt[], progress: Record<string, TopicProgress> = {}) {
  return topicStats(attempts, progress)
    .filter(t => t.attempted >= 2 && t.accuracy >= 75)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)
}

export function overallStats(data: AppData) {
  const all = data.attempts.flatMap(attemptAnswers)
  const attempted = all.filter(a => a.selected !== null).length
  const correct = all.filter(a => a.isCorrect).length
  const hours = Math.round((data.studyLog.reduce((s, l) => s + l.minutes, 0) / 60) * 10) / 10
  const touched = Object.values(data.topicProgress).filter(p => p.status !== 'not-started').length
  const syllabus = pct(touched, totalTopics)
  const accuracy = pct(correct, attempted)
  const tests = data.attempts.length
  const evalAvg = data.evaluations.length
    ? Math.round(data.evaluations.reduce((s, e) => s + (e.score / e.maxScore) * 100, 0) / data.evaluations.length)
    : 0
  const prelimsReadiness = Math.round(accuracy * 0.6 + syllabus * 0.3 + (tests > 0 ? 10 : 0))
  const mainsReadiness = Math.round(syllabus * 0.4 + (evalAvg || 0) * 0.45 + (data.evaluations.length > 0 ? 15 : 0))
  return {
    attempted,
    correct,
    accuracy,
    hours,
    syllabus,
    touched,
    tests,
    evalAvg,
    prelimsReadiness: Math.min(99, prelimsReadiness),
    mainsReadiness: Math.min(99, mainsReadiness),
    revisionsDue: data.revisions.filter(r => !r.completed && r.dueDate <= todayISO()).length,
    notes: data.notes.length,
    flashcardsDue: data.flashcards.filter(f => f.due <= todayISO()).length,
  }
}

export function scoreTrend(attempts: Attempt[]) {
  return [...attempts]
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .slice(-10)
    .map(a => ({
      label: new Date(a.finishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0,
      name: a.testName,
    }))
}

export function dailyMinutes(log: { date: string; minutes: number }[], days = 14) {
  const map = new Map(log.map(l => [l.date, l.minutes]))
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      label: d.toLocaleDateString('en-IN', { day: 'numeric' }),
      value: map.get(key) ?? 0,
      date: key,
    }
  })
}

export function readinessBreakdown(data: AppData) {
  const stats = overallStats(data)
  return [
    { label: 'Prelims readiness', value: stats.prelimsReadiness, tone: 'accent' },
    { label: 'Mains readiness', value: stats.mainsReadiness, tone: 'teal' },
    { label: 'Syllabus covered', value: stats.syllabus, tone: 'indigo' },
    { label: 'MCQ accuracy', value: stats.accuracy, tone: 'amber' },
  ]
}
