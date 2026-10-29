import type { AppData, Attempt, AttemptAnswer, Flashcard, Note, StudyProfile } from '../types'
import { questions } from './questions'
import { generateStudyPlan } from '../lib/planner'
import { addDays, iso, todayISO } from '../lib/date'
import { hashPassword } from '../lib/auth'
import { scoreAttempt } from '../lib/scoring'
import { uid } from '../lib/id'
import { buildLesson, evaluateAnswer } from '../services/ai'
import { topicById } from './syllabus'

export const demoProfile: StudyProfile = {
  name: 'Aarav Mehta',
  language: 'en',
  attempt: 'first',
  targetYear: '2027',
  stagePriority: 'prelims',
  level: 'intermediate',
  dailyHours: 6,
  optionalSubject: 'Political Science & International Relations',
  strongSubjects: ['history', 'polity', 'geography'],
  weakSubjects: ['economy', 'environment', 'science-tech'],
  examDate: '2027-05-23',
  onboarded: true,
}

export const demoCredentials = { email: 'demo@upscmentor.app', password: 'demo1234' }

export const demoUser = {
  id: 'user-demo',
  email: demoCredentials.email,
  role: 'student' as const,
  profile: demoProfile,
  createdAt: new Date(Date.now() - 86_400_000 * 120).toISOString(),
}

export async function demoPasswordHash() {
  return hashPassword(demoCredentials.password)
}

function at(daysAgo: number, hour = 20) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function buildAttempt(
  testName: string,
  mode: Attempt['mode'],
  questionIds: string[],
  answered: Record<string, number | null>,
  daysAgo: number,
  durationSec: number,
): Attempt {
  const answers: AttemptAnswer[] = questionIds.map((id, i) => ({
    questionId: id,
    selected: answered[id] ?? null,
    marked: i === 4,
    timeSpent: 45 + i * 7,
  }))
  const key: Record<string, { correct: number | number[]; options: number }> = {}
  for (const q of questions) key[q.id] = { correct: q.correct, options: q.options.length }
  const s = scoreAttempt(answers, key, true)
  return {
    id: uid('attempt'),
    userId: 'user-demo',
    testId: uid('test'),
    testName,
    mode,
    startedAt: at(daysAgo, 19),
    finishedAt: at(daysAgo, 20),
    durationSec,
    negativeMarking: true,
    answers,
    questionIds,
    ...s,
  }
}

export function blankData(profile: StudyProfile): AppData {
  const plan = generateStudyPlan(profile, 30)
  return {
    plan,
    tasks: plan.tasks,
    attempts: [],
    notes: [],
    flashcards: [],
    conversations: [],
    evaluations: [],
    interviews: [],
    revisions: [],
    bookmarks: [],
    topicProgress: {},
    studyLog: [],
  }
}

export function seedData(): AppData {
  const profile = demoProfile
  const plan = generateStudyPlan(profile, 30)
  plan.tasks.forEach((t, i) => {
    if (t.date === todayISO() && t.type === 'current-affairs') t.completed = true
    if (t.date === iso(addDays(new Date(), -1)) && t.type === 'study') t.completed = true
    if (t.date === iso(addDays(new Date(), -2)) && t.type === 'revision') t.completed = true
    if (i < 3) t.completed = t.completed || false
  })

  const attempt1 = buildAttempt(
    'Prelims Daily Drill — Polity & Economy',
    'daily',
    ['q-ai-001', 'q-ai-002', 'q-ai-003', 'q-ai-006', 'q-ai-007', 'q-ai-016', 'q-ai-017', 'q-ai-021', 'q-ai-022', 'q-ai-014'],
    {
      'q-ai-001': 2, 'q-ai-002': 1, 'q-ai-003': 0, 'q-ai-006': 2, 'q-ai-007': 2,
      'q-ai-016': 1, 'q-ai-017': 1, 'q-ai-021': 1, 'q-ai-022': 0, 'q-ai-014': 3,
    },
    2,
    782,
  )
  const attempt2 = buildAttempt(
    'Economy — Topic Test',
    'topic',
    ['q-ai-002', 'q-ai-003', 'q-ai-014', 'q-ai-015', 'q-ai-022', 'q-pyq-2019-rbi', 'q-pyq-2020-inflation'],
    {
      'q-ai-002': 1, 'q-ai-003': 1, 'q-ai-014': 1, 'q-ai-015': 2, 'q-ai-022': 0,
      'q-pyq-2019-rbi': 2, 'q-pyq-2020-inflation': 1,
    },
    6,
    540,
  )
  const attempt3 = buildAttempt(
    'Sectional Mock — Environment & Geography',
    'subject',
    ['q-ai-004', 'q-ai-005', 'q-ai-010', 'q-ai-011', 'q-ai-018', 'q-ai-019', 'q-ai-024', 'q-ai-030', 'q-pyq-2018-nagoya'],
    {
      'q-ai-004': 2, 'q-ai-005': 0, 'q-ai-010': 1, 'q-ai-011': 2, 'q-ai-018': 1,
      'q-ai-019': 0, 'q-ai-024': 3, 'q-ai-030': 3, 'q-pyq-2018-nagoya': 2,
    },
    11,
    690,
  )

  const studyLog = Array.from({ length: 16 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const minutes = i === 0 ? 185 : i === 1 ? 240 : i === 4 ? 0 : 120 + ((i * 37) % 130)
    return { date: iso(d), minutes }
  })

  const progress: AppData['topicProgress'] = {
    't-rights': { topicId: 't-rights', status: 'confident', lastStudied: at(3), minutes: 210 },
    't-union-state': { topicId: 't-union-state', status: 'revising', lastStudied: at(2), minutes: 180 },
    't-judiciary': { topicId: 't-judiciary', status: 'learning', lastStudied: at(1), minutes: 120 },
    't-constitution-basics': { topicId: 't-constitution-basics', status: 'confident', lastStudied: at(5), minutes: 150 },
    't-fiscal': { topicId: 't-fiscal', status: 'learning', lastStudied: at(4), minutes: 160 },
    't-monetary': { topicId: 't-monetary', status: 'revising', lastStudied: at(2), minutes: 90 },
    't-modern': { topicId: 't-modern', status: 'confident', lastStudied: at(6), minutes: 240 },
    't-indian-geo': { topicId: 't-indian-geo', status: 'revising', lastStudied: at(3), minutes: 120 },
    't-climate': { topicId: 't-climate', status: 'learning', lastStudied: at(7), minutes: 75 },
    't-ecology': { topicId: 't-ecology', status: 'learning', lastStudied: at(8), minutes: 60 },
    't-digital': { topicId: 't-digital', status: 'not-started', minutes: 0 },
    't-space': { topicId: 't-space', status: 'not-started', minutes: 0 },
    't-ethics': { topicId: 't-ethics', status: 'learning', lastStudied: at(9), minutes: 90 },
    't-ir': { topicId: 't-ir', status: 'not-started', minutes: 0 },
    't-local-bodies': { topicId: 't-local-bodies', status: 'confident', lastStudied: at(10), minutes: 100 },
    't-biodiversity': { topicId: 't-biodiversity', status: 'learning', lastStudied: at(12), minutes: 55 },
  }

  const notes: Note[] = [
    {
      id: 'note-demo-1',
      userId: 'user-demo',
      title: 'Fiscal deficit — one-page recall',
      content: 'Fiscal deficit = total expenditure minus total receipts excluding borrowings.\nRevenue deficit = revenue expenditure minus revenue receipts.\nPrimary deficit = fiscal deficit minus interest payments.\n\nFRBM Act 2003 provides the fiscal rule framework. Capital expenditure creates assets; revenue expenditure does not. Persistent borrowing raises interest costs and can crowd out private investment.\n\nExam angle: distinguish the three deficits, discuss fiscal consolidation versus growth, and link to Finance Commission transfers.',
      tags: ['economy', 'fiscal', 'formulas'],
      topicId: 't-fiscal',
      subjectId: 'economy',
      sourceType: 'topic',
      createdAt: at(4),
      updatedAt: at(2),
      bookmarked: true,
    },
    {
      id: 'note-demo-2',
      userId: 'user-demo',
      title: 'Article 21 — expanded scope',
      content: 'Article 21 protects life and personal liberty. Maneka Gandhi (1978) linked it with a fair, just and reasonable procedure. The right to privacy was recognised in K.S. Puttaswamy (2017). The right to a clean environment, livelihood and shelter have been read into Article 21.',
      tags: ['polity', 'rights', 'judiciary'],
      topicId: 't-rights',
      subjectId: 'polity',
      sourceType: 'personal',
      createdAt: at(8),
      updatedAt: at(5),
      bookmarked: false,
    },
    {
      id: 'note-demo-3',
      userId: 'user-demo',
      title: 'Climate finance — answer skeleton',
      content: 'Intro: climate finance is a question of equity as much as economics.\nBody: historical responsibility, adaptation gap, loss and damage, access barriers, debt sustainability.\nCounter: private finance is necessary but cannot replace public grant finance.\nConclusion: reform MDBs, simplify access, scale grants, link technology transfer.',
      tags: ['environment', 'mains', 'climate'],
      topicId: 't-climate',
      subjectId: 'environment',
      sourceType: 'current-affairs',
      sourceId: 'ca-climate-finance',
      createdAt: at(6),
      updatedAt: at(1),
      bookmarked: true,
    },
    {
      id: 'note-demo-4',
      userId: 'user-demo',
      title: 'UPSC answer structure',
      content: '1. Read the directive word.\n2. Write a 2-line introduction with definition or context.\n3. Three body blocks, each with an argument and evidence.\n4. Include a counter-view.\n5. End with a forward-looking way forward.\nKeep paragraphs short. Underline key terms.',
      tags: ['strategy', 'mains'],
      sourceType: 'personal',
      createdAt: at(20),
      updatedAt: at(20),
      bookmarked: false,
    },
  ]

  const flashcards: Flashcard[] = [
    { id: 'fc-demo-1', userId: 'user-demo', front: 'Fiscal deficit formula', back: 'Total expenditure − total receipts excluding borrowings.', deck: 'Economy', topicId: 't-fiscal', ease: 2.3, interval: 3, due: todayISO(), reviews: 3, lapses: 0, createdAt: at(10) },
    { id: 'fc-demo-2', userId: 'user-demo', front: 'Primary deficit', back: 'Fiscal deficit − interest payments.', deck: 'Economy', topicId: 't-fiscal', ease: 2.1, interval: 1, due: todayISO(), reviews: 2, lapses: 1, createdAt: at(10) },
    { id: 'fc-demo-3', userId: 'user-demo', front: 'Article 32', back: 'Right to constitutional remedies; Dr Ambedkar called it the heart and soul of the Constitution.', deck: 'Polity', topicId: 't-rights', ease: 2.5, interval: 6, due: todayISO(), reviews: 4, lapses: 0, createdAt: at(12) },
    { id: 'fc-demo-4', userId: 'user-demo', front: 'Money Bill certification', back: 'The Speaker of the Lok Sabha certifies a Bill as a Money Bill; the decision is final under Article 110(3).', deck: 'Polity', topicId: 't-union-state', ease: 2.4, interval: 4, due: iso(addDays(new Date(), 1)), reviews: 3, lapses: 0, createdAt: at(11) },
    { id: 'fc-demo-5', userId: 'user-demo', front: 'Paris Agreement temperature goal', back: 'Hold warming well below 2°C above pre-industrial levels and pursue efforts to limit it to 1.5°C.', deck: 'Environment', topicId: 't-climate', ease: 2.2, interval: 2, due: todayISO(), reviews: 2, lapses: 0, createdAt: at(9) },
    { id: 'fc-demo-6', userId: 'user-demo', front: 'Ramsar Convention', back: 'An intergovernmental treaty for the conservation and wise use of wetlands.', deck: 'Environment', topicId: 't-biodiversity', ease: 2.0, interval: 1, due: iso(addDays(new Date(), 2)), reviews: 1, lapses: 1, createdAt: at(9) },
    { id: 'fc-demo-7', userId: 'user-demo', front: 'Repo rate', back: 'The rate at which the RBI lends short-term funds to banks against eligible securities.', deck: 'Economy', topicId: 't-monetary', ease: 2.6, interval: 8, due: iso(addDays(new Date(), 3)), reviews: 5, lapses: 0, createdAt: at(14) },
    { id: 'fc-demo-8', userId: 'user-demo', front: 'Quo warranto', back: 'A writ questioning the legal authority of a person holding a public office.', deck: 'Polity', topicId: 't-judiciary', ease: 2.1, interval: 2, due: todayISO(), reviews: 2, lapses: 0, createdAt: at(7) },
  ]

  const revisions: AppData['revisions'] = [
    { id: 'rev-1', userId: 'user-demo', topicId: 't-fiscal', title: 'Fiscal deficit and FRBM', reason: 'Repeated errors in deficit definitions', priority: 95, dueDate: todayISO(), completed: false, source: 'test' },
    { id: 'rev-2', userId: 'user-demo', topicId: 't-monetary', title: 'Monetary policy transmission', reason: 'Two incorrect answers in the economy test', priority: 88, dueDate: todayISO(), completed: false, source: 'test' },
    { id: 'rev-3', userId: 'user-demo', topicId: 't-ecology', title: 'Ecological pyramids', reason: 'Concept not revised for 8 days', priority: 74, dueDate: todayISO(), completed: false, source: 'plan' },
    { id: 'rev-4', userId: 'user-demo', topicId: 't-climate', title: 'Climate finance basics', reason: 'Mains answer lacked a finance dimension', priority: 70, dueDate: todayISO(), completed: false, source: 'mains' },
    { id: 'rev-5', userId: 'user-demo', topicId: 't-digital', title: 'Digital public infrastructure', reason: 'High-weight topic not started', priority: 66, dueDate: iso(addDays(new Date(), 1)), completed: false, source: 'manual' },
    { id: 'rev-6', userId: 'user-demo', topicId: 't-rights', title: 'Fundamental Rights — writs', reason: 'Spaced review due', priority: 55, dueDate: iso(addDays(new Date(), 2)), completed: false, source: 'flashcard' },
  ]

  const evalTopic = topicById('t-fiscal')
  const evalBase = evaluateAnswer({
    question: '“Fiscal consolidation and growth are not mutually exclusive.” Discuss with reference to India’s fiscal strategy.',
    answer: 'Fiscal consolidation refers to reducing the fiscal deficit over time. India has followed a path of gradual consolidation while protecting capital expenditure. The FRBM Act 2003 provides a framework. However, during crises the targets have been relaxed. Capital expenditure creates assets and supports growth, while revenue expenditure does not. Therefore, the quality of expenditure matters more than the headline deficit. A credible medium-term framework, transparent accounting and predictable transfers to States are needed. In conclusion, consolidation and growth can be reconciled if the government protects productive spending and improves expenditure efficiency.',
    paper: 'mains-gs3',
    topicId: 't-fiscal',
    wordLimit: 150,
  })
  const evaluations: AppData['evaluations'] = [{
    id: 'eval-demo-1',
    userId: 'user-demo',
    ...evalBase,
    createdAt: at(3),
  }]

  const rights = topicById('t-rights')!
  const fiscal = topicById('t-fiscal')!
  const conversations: AppData['conversations'] = [
    {
      id: 'conv-demo-1',
      userId: 'user-demo',
      title: 'Fundamental Rights — full lesson',
      contextTopicId: 't-rights',
      createdAt: at(3),
      updatedAt: at(3),
      messages: [
        { id: 'm1', role: 'user', content: 'Teach me Fundamental Rights from the beginning.', createdAt: at(3) },
        { id: 'm2', role: 'assistant', content: buildLesson(rights, 'en', 'beginner'), createdAt: at(3), actions: ['Quiz me', 'Give PYQs', 'Make notes'] },
      ],
    },
    {
      id: 'conv-demo-2',
      userId: 'user-demo',
      title: 'Fiscal deficit — clear the confusion',
      contextTopicId: 't-fiscal',
      createdAt: at(1),
      updatedAt: at(1),
      messages: [
        { id: 'm3', role: 'user', content: 'I keep confusing fiscal deficit, revenue deficit and primary deficit.', createdAt: at(1) },
        { id: 'm4', role: 'assistant', content: buildLesson(fiscal, 'en', 'intermediate'), createdAt: at(1), actions: ['Quiz me', 'Give examples', 'Make notes'] },
      ],
    },
  ]

  return {
    plan,
    tasks: plan.tasks,
    attempts: [attempt1, attempt2, attempt3],
    notes,
    flashcards,
    conversations,
    evaluations,
    interviews: [],
    revisions,
    bookmarks: ['q-pyq-2019-rbi', 'q-ai-003', 'ca-fiscal-consolidation'],
    topicProgress: progress,
    studyLog,
  }
}

export const emptyProfile = (name: string): StudyProfile => ({
  name,
  language: 'en',
  attempt: 'first',
  targetYear: String(new Date().getFullYear() + 1),
  stagePriority: 'prelims',
  level: 'beginner',
  dailyHours: 4,
  optionalSubject: '',
  strongSubjects: [],
  weakSubjects: [],
  examDate: `${new Date().getFullYear() + 1}-05-25`,
  onboarded: false,
})
