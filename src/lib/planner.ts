import type { StudyPlan, StudyProfile, Task, Topic } from '../types'
import { subjects, topics } from '../data/syllabus'
import { addDays, iso, todayISO } from './date'
import { uid } from './id'

export function prioritizedTopics(profile: StudyProfile): Topic[] {
  const weak = new Set(profile.weakSubjects)
  const strong = new Set(profile.strongSubjects)
  return [...topics]
    .filter(t => !t.id.startsWith('t-optional') || profile.optionalSubject)
    .sort((a, b) => {
      const score = (t: Topic) => {
        let s = 0
        if (weak.has(t.subjectId)) s += 100
        if (strong.has(t.subjectId)) s -= 30
        if (t.weight === 'high') s += 40
        if (t.weight === 'medium') s += 15
        if (t.stage.includes(profile.stagePriority)) s += 20
        if (t.paperId === 'optional') s += 5
        return s
      }
      return score(b) - score(a)
    })
}

export function generateStudyPlan(profile: StudyProfile, horizonDays = 30): StudyPlan {
  const dailyMinutes = Math.max(60, Math.round(profile.dailyHours * 60))
  const pool = prioritizedTopics(profile)
  const tasks: Task[] = []
  const start = new Date(todayISO())

  for (let day = 0; day < horizonDays; day += 1) {
    const date = iso(addDays(start, day))
    const primary = pool[day % pool.length]
    const secondary = pool[(day + 7) % pool.length]
    const isTestDay = day > 0 && day % 7 === 0
    const isMainsDay = profile.stagePriority === 'mains' ? day % 3 === 0 : day % 5 === 0
    const studyMinutes = Math.max(25, Math.round(dailyMinutes * 0.45))
    const secondMinutes = Math.max(20, Math.round(dailyMinutes * 0.2))
    const practiceMinutes = Math.max(15, Math.round(dailyMinutes * 0.2))
    const caMinutes = Math.max(10, Math.round(dailyMinutes * 0.15))

    tasks.push({
      id: uid('task'),
      title: `Deep study — ${primary.name}`,
      type: 'study',
      date,
      minutes: studyMinutes,
      topicId: primary.id,
      subjectId: primary.subjectId,
      completed: false,
      createdAt: new Date().toISOString(),
      note: 'Concept first, then a one-page recall sheet.',
    })
    tasks.push({
      id: uid('task'),
      title: `Revision — ${secondary.name}`,
      type: 'revision',
      date,
      minutes: secondMinutes,
      topicId: secondary.id,
      subjectId: secondary.subjectId,
      completed: false,
      createdAt: new Date().toISOString(),
      note: 'Use active recall; do not reread passively.',
    })
    if (isTestDay) {
      tasks.push({
        id: uid('task'),
        title: 'Weekly Prelims mini-test',
        type: 'test',
        date,
        minutes: practiceMinutes + 10,
        completed: false,
        createdAt: new Date().toISOString(),
        note: '25 questions, negative marking on. Review every error.',
      })
    } else if (isMainsDay) {
      tasks.push({
        id: uid('task'),
        title: 'Mains answer — 150 words',
        type: 'mains',
        date,
        minutes: practiceMinutes,
        topicId: primary.id,
        subjectId: primary.subjectId,
        completed: false,
        createdAt: new Date().toISOString(),
        note: 'Write under timed conditions, then self-evaluate before using AI feedback.',
      })
    } else {
      tasks.push({
        id: uid('task'),
        title: `Practise MCQs — ${primary.name}`,
        type: 'pyq',
        date,
        minutes: practiceMinutes,
        topicId: primary.id,
        subjectId: primary.subjectId,
        completed: false,
        createdAt: new Date().toISOString(),
      })
    }
    tasks.push({
      id: uid('task'),
      title: 'Current affairs — 20 minute brief',
      type: 'current-affairs',
      date,
      minutes: caMinutes,
      completed: false,
      createdAt: new Date().toISOString(),
      note: 'One issue, five dimensions, one possible question.',
    })
  }

  return {
    id: uid('plan'),
    generatedAt: new Date().toISOString(),
    horizonDays,
    tasks,
    rationale: `A ${horizonDays}-day plan built around ${profile.stagePriority} priority, ${profile.dailyHours} study hours a day, weak subjects (${profile.weakSubjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'not specified'}), spaced revision and one weekly test. Edit any task as your circumstances change.`,
  }
}

export const tasksForDate = (tasks: Task[], date = todayISO()) => tasks.filter(t => t.date === date)
export const overdueTasks = (tasks: Task[]) => tasks.filter(t => !t.completed && t.date < todayISO())
export const upcomingTasks = (tasks: Task[]) =>
  tasks.filter(t => !t.completed && t.date > todayISO()).sort((a, b) => a.date.localeCompare(b.date))

export function planStats(tasks: Task[]) {
  const done = tasks.filter(t => t.completed).length
  return { total: tasks.length, done, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
}

export function weekGrid(tasks: Task[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = iso(addDays(new Date(), i))
    const dayTasks = tasks.filter(t => t.date === date)
    return { date, tasks: dayTasks, done: dayTasks.filter(t => t.completed).length }
  })
}

export function studyStreak(log: { date: string; minutes: number }[]) {
  let streak = 0
  const date = new Date()
  for (let i = 0; i < 365; i += 1) {
    const key = iso(date)
    const entry = log.find(l => l.date === key)
    if (entry && entry.minutes > 0) {
      streak += 1
      date.setDate(date.getDate() - 1)
    } else if (i === 0) {
      date.setDate(date.getDate() - 1)
    } else break
  }
  return streak
}
