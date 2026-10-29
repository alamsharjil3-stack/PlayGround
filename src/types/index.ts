export type Language = 'en' | 'hi'
export type Theme = 'light' | 'dark'
export type Role = 'student' | 'admin'
export type PaperId =
  | 'prelims-gs1'
  | 'csat'
  | 'mains-essay'
  | 'mains-gs1'
  | 'mains-gs2'
  | 'mains-gs3'
  | 'mains-gs4'
  | 'optional'

export type Stage = 'prelims' | 'mains' | 'interview'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerKey = number | number[]

export interface Subject {
  id: string
  paperId: PaperId
  name: string
  nameHi: string
  code: string
  description: string
  color: string
}

export interface Topic {
  id: string
  subjectId: string
  paperId: PaperId
  name: string
  nameHi: string
  description: string
  subtopics: string[]
  weight: 'high' | 'medium' | 'low'
  stage: Stage[]
}

export interface Paper {
  id: PaperId
  name: string
  nameHi: string
  shortName: string
  description: string
  subjects: string[]
  optional?: boolean
}

export interface QuestionSource {
  type: 'pyq' | 'ai-practice'
  exam?: string
  year?: number
  sourceName?: string
  sourceUrl?: string
  confidence?: 'verified' | 'curated-demo'
}

export interface MCQQuestion {
  id: string
  stem: string
  options: string[]
  correct: AnswerKey
  explanation: string
  optionRationales: string[]
  subjectId: string
  topicId: string
  paperId: PaperId
  difficulty: Difficulty
  source: QuestionSource
  tags: string[]
  relatedTopicIds?: string[]
  currentAffairsId?: string
}

export interface CurrentAffair {
  id: string
  title: string
  titleHi?: string
  summary: string
  category: 'Polity' | 'Economy' | 'Environment' | 'IR' | 'Society' | 'Science & Tech' | 'Governance'
  gsPaper: PaperId[]
  updatedLabel: string
  sourceName: string
  sourceUrl: string
  whatHappened: string
  whyImportant: string
  background: string[]
  prelimsFacts: string[]
  mainsDimensions: { label: string; text: string }[]
  constitutionalAngle?: string
  schemes: string[]
  internationalAngle?: string
  challenges: string[]
  wayForward: string[]
  questions: string[]
  linkedTopicIds: string[]
  linkedQuestionIds: string[]
}

export interface StudyProfile {
  name: string
  language: Language
  attempt: string
  targetYear: string
  stagePriority: Stage
  level: 'beginner' | 'intermediate' | 'advanced' | 'repeat'
  dailyHours: number
  optionalSubject: string
  strongSubjects: string[]
  weakSubjects: string[]
  examDate: string
  onboarded?: boolean
}

export interface User {
  id: string
  email: string
  passwordHash: string
  role: Role
  profile: StudyProfile
  createdAt: string
}

export interface Task {
  id: string
  title: string
  type: 'study' | 'revision' | 'test' | 'pyq' | 'mains' | 'current-affairs'
  date: string
  minutes: number
  topicId?: string
  subjectId?: string
  completed: boolean
  createdAt: string
  note?: string
}

export interface StudyPlan {
  id: string
  generatedAt: string
  horizonDays: number
  tasks: Task[]
  rationale: string
}

export interface AttemptAnswer {
  questionId: string
  selected: number | null
  marked: boolean
  timeSpent: number
}

export interface Attempt {
  id: string
  userId: string
  testId: string
  testName: string
  mode: 'daily' | 'topic' | 'subject' | 'full' | 'pyq' | 'custom'
  startedAt: string
  finishedAt: string
  durationSec: number
  negativeMarking: boolean
  answers: AttemptAnswer[]
  questionIds: string[]
  score: number
  maxScore: number
  correct: number
  incorrect: number
  unattempted: number
  accuracy: number
}

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  tags: string[]
  topicId?: string
  subjectId?: string
  sourceType: 'personal' | 'topic' | 'current-affairs' | 'pyq' | 'revision'
  sourceId?: string
  createdAt: string
  updatedAt: string
  bookmarked: boolean
}

export interface Flashcard {
  id: string
  userId: string
  front: string
  back: string
  deck: string
  topicId?: string
  ease: number
  interval: number
  due: string
  reviews: number
  lapses: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  actions?: string[]
}

export interface ChatConversation {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  contextTopicId?: string
}

export interface MainsEvaluation {
  id: string
  userId: string
  question: string
  paper: PaperId
  answer: string
  wordCount: number
  score: number
  maxScore: number
  dimensions: { label: string; score: number; feedback: string }[]
  strengths: string[]
  weaknesses: string[]
  missing: string[]
  suggestions: string[]
  modelAnswer: string
  betterIntro: string
  betterConclusion: string
  createdAt: string
}

export interface InterviewTurn {
  id: string
  role: 'board' | 'candidate'
  content: string
  createdAt: string
}

export interface InterviewSession {
  id: string
  userId: string
  daf: { name: string; homeState: string; optional: string; hobbies: string; background: string }
  turns: InterviewTurn[]
  feedback?: {
    dimensions: { label: string; score: number; note: string }[]
    strengths: string[]
    improvements: string[]
    verdict: string
    disclaimer: string
  }
  createdAt: string
  completed: boolean
}

export interface RevisionItem {
  id: string
  userId: string
  topicId: string
  title: string
  reason: string
  priority: number
  dueDate: string
  completed: boolean
  source: 'test' | 'mains' | 'manual' | 'plan' | 'flashcard'
}

export interface TopicProgress {
  topicId: string
  status: 'not-started' | 'learning' | 'revising' | 'confident'
  lastStudied?: string
  minutes: number
}

export interface AppData {
  plan: StudyPlan | null
  tasks: Task[]
  attempts: Attempt[]
  notes: Note[]
  flashcards: Flashcard[]
  conversations: ChatConversation[]
  evaluations: MainsEvaluation[]
  interviews: InterviewSession[]
  revisions: RevisionItem[]
  bookmarks: string[]
  topicProgress: Record<string, TopicProgress>
  studyLog: { date: string; minutes: number }[]
}
