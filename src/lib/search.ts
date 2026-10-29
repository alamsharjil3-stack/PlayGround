import type { CurrentAffair, MCQQuestion, Note, Topic } from '../types'
import { currentAffairs } from '../data/currentAffairs'
import { questions } from '../data/questions'
import { papers, subjects, topics } from '../data/syllabus'

export interface SearchResult {
  id: string
  type: 'Syllabus' | 'Topic' | 'PYQ' | 'Current affairs' | 'Question' | 'Note'
  title: string
  subtitle: string
  path: string
  score: number
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F ]/g, ' ')

function score(text: string, query: string) {
  const hay = normalise(text)
  const q = normalise(query).trim()
  if (!q) return 0
  const tokens = q.split(/\s+/).filter(Boolean)
  let total = 0
  if (hay.includes(q)) total += 60
  for (const token of tokens) {
    if (hay.startsWith(token)) total += 18
    else if (hay.includes(` ${token}`)) total += 12
    else if (hay.includes(token)) total += 6
  }
  return total
}

export function buildSearchIndex(notes: Note[]) {
  const index: Omit<SearchResult, 'score'>[] = []
  for (const paper of papers) {
    index.push({ id: paper.id, type: 'Syllabus', title: paper.name, subtitle: paper.description, path: `/learn?paper=${paper.id}` })
  }
  for (const subject of subjects) {
    index.push({ id: subject.id, type: 'Syllabus', title: subject.name, subtitle: `${subject.code} · ${subject.description}`, path: `/learn?subject=${subject.id}` })
  }
  for (const topic of topics) {
    index.push({ id: topic.id, type: 'Topic', title: topic.name, subtitle: `${subjectByIdSafe(topic.subjectId)} · ${topic.subtopics.slice(0, 3).join(', ')}`, path: `/learn/topic/${topic.id}` })
  }
  for (const q of questions) {
    index.push({ id: q.id, type: q.source.type === 'pyq' ? 'PYQ' : 'Question', title: q.stem.split('\n')[0].slice(0, 120), subtitle: `${subjectByIdSafe(q.subjectId)} · ${q.difficulty} · ${q.source.type === 'pyq' ? `UPSC ${q.source.year}` : 'AI Generated Practice Question'}`, path: `/pyq/${q.id}` })
  }
  for (const ca of currentAffairs) {
    index.push({ id: ca.id, type: 'Current affairs', title: ca.title, subtitle: `${ca.category} · ${ca.summary.slice(0, 90)}`, path: `/current-affairs/${ca.id}` })
  }
  for (const note of notes) {
    index.push({ id: note.id, type: 'Note', title: note.title, subtitle: note.tags.join(' · ') || 'Personal note', path: `/notes?note=${note.id}` })
  }
  return index
}

function subjectByIdSafe(id: string) {
  return subjects.find(s => s.id === id)?.name ?? id
}

export function searchAll(query: string, notes: Note[]): SearchResult[] {
  if (!query.trim()) return []
  const index = buildSearchIndex(notes)
  return index
    .map(item => ({ ...item, score: score(`${item.title} ${item.subtitle}`, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
}

export function suggestions(query: string): SearchResult[] {
  return searchAll(query, []).slice(0, 6)
}

export type { MCQQuestion, CurrentAffair, Topic }
