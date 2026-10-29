import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AppData,
  Attempt,
  ChatConversation,
  Flashcard,
  InterviewSession,
  Language,
  MainsEvaluation,
  Note,
  RevisionItem,
  StudyPlan,
  Task,
  Theme,
  TopicProgress,
} from '../types'
import { useAuth } from './AuthContext'
import { DATA_PREFIX } from '../lib/auth'
import { blankData, seedData } from '../data/seed'
import { generateStudyPlan } from '../lib/planner'
import { todayISO, iso } from '../lib/date'
import { translate } from '../lib/i18n'
import { uid } from '../lib/id'
import { useToast } from './ToastContext'

const THEME_KEY = 'upsc-mentor:theme'

interface AppContextValue {
  data: AppData | null
  ready: boolean
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  lang: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  update: (fn: (data: AppData) => void) => void
  toggleBookmark: (id: string) => void
  addNote: (note: Partial<Note> & { title: string; content: string }) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleTask: (id: string) => void
  addTask: (task: Partial<Task> & { title: string; date: string }) => void
  deleteTask: (id: string) => void
  regeneratePlan: (plan?: StudyPlan) => void
  logStudy: (minutes: number, topicId?: string) => void
  markTopic: (topicId: string, status: TopicProgress['status'], minutes?: number) => void
  addAttempt: (attempt: Attempt) => void
  addConversation: (conversation: ChatConversation) => void
  updateConversation: (id: string, patch: Partial<ChatConversation>) => void
  deleteConversation: (id: string) => void
  addEvaluation: (evaluation: MainsEvaluation) => void
  addFlashcards: (cards: Flashcard[]) => void
  updateFlashcard: (card: Flashcard) => void
  addInterview: (session: InterviewSession) => void
  updateInterview: (id: string, patch: Partial<InterviewSession>) => void
  addRevision: (item: Partial<RevisionItem> & { topicId: string; title: string }) => void
  completeRevision: (id: string) => void
  resetWorkspace: () => void
  setWorkspacePlan: (plan: StudyPlan) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function hydrate(raw: unknown, fallback: AppData): AppData {
  if (!raw || typeof raw !== 'object') return fallback
  const parsed = raw as Partial<AppData>
  return {
    plan: parsed.plan ?? fallback.plan,
    tasks: parsed.tasks ?? fallback.tasks,
    attempts: parsed.attempts ?? [],
    notes: parsed.notes ?? [],
    flashcards: parsed.flashcards ?? [],
    conversations: parsed.conversations ?? [],
    evaluations: parsed.evaluations ?? [],
    interviews: parsed.interviews ?? [],
    revisions: parsed.revisions ?? [],
    bookmarks: parsed.bookmarks ?? [],
    topicProgress: parsed.topicProgress ?? {},
    studyLog: parsed.studyLog ?? [],
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<AppData | null>(null)
  const [ready, setReady] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggleTheme = useCallback(() => setThemeState(prev => prev === 'light' ? 'dark' : 'light'), [])

  useEffect(() => {
    if (!user) {
      setData(null)
      setReady(true)
      return
    }
    setReady(false)
    const key = `${DATA_PREFIX}${user.id}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        setData(hydrate(JSON.parse(raw), blankData(user.profile)))
      } else if (user.id === 'user-demo') {
        setData(seedData())
      } else {
        setData(blankData(user.profile))
      }
    } catch {
      setData(user.id === 'user-demo' ? seedData() : blankData(user.profile))
    } finally {
      setReady(true)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user || !data || !ready) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(`${DATA_PREFIX}${user.id}`, JSON.stringify(data))
      } catch {
        /* storage quota — keep the in-memory session usable */
      }
    }, 160)
    return () => window.clearTimeout(t)
  }, [data, ready, user])

  const lang = user?.profile.language ?? 'en'
  const t = useCallback((key: string) => translate(lang, key), [lang])

  const setLanguage = useCallback((next: Language) => updateProfile({ language: next }), [updateProfile])

  const update = useCallback((fn: (data: AppData) => void) => {
    setData(prev => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  const userId = user?.id ?? ''

  const toggleBookmark = useCallback((id: string) => {
    update(d => {
      const index = d.bookmarks.indexOf(id)
      if (index >= 0) d.bookmarks.splice(index, 1)
      else d.bookmarks.push(id)
    })
  }, [update])

  const addNote = useCallback((note: Partial<Note> & { title: string; content: string }) => {
    const full: Note = {
      id: uid('note'),
      userId,
      title: note.title,
      content: note.content,
      tags: note.tags ?? [],
      topicId: note.topicId,
      subjectId: note.subjectId,
      sourceType: note.sourceType ?? 'personal',
      sourceId: note.sourceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bookmarked: note.bookmarked ?? false,
    }
    update(d => { d.notes.unshift(full) })
    toast('Note saved')
    return full
  }, [update, userId, toast])

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    update(d => {
      const note = d.notes.find(n => n.id === id)
      if (note) Object.assign(note, patch, { updatedAt: new Date().toISOString() })
    })
  }, [update])

  const deleteNote = useCallback((id: string) => {
    update(d => { d.notes = d.notes.filter(n => n.id !== id) })
    toast('Note deleted', 'info')
  }, [update, toast])

  const toggleTask = useCallback((id: string) => {
    update(d => {
      const task = d.tasks.find(t => t.id === id)
      if (task) task.completed = !task.completed
    })
  }, [update])

  const addTask = useCallback((task: Partial<Task> & { title: string; date: string }) => {
    const full: Task = {
      id: uid('task'),
      title: task.title,
      type: task.type ?? 'study',
      date: task.date,
      minutes: task.minutes ?? 45,
      topicId: task.topicId,
      subjectId: task.subjectId,
      completed: false,
      createdAt: new Date().toISOString(),
      note: task.note,
    }
    update(d => {
      d.tasks.push(full)
      d.tasks.sort((a, b) => a.date.localeCompare(b.date))
    })
    toast('Added to your plan')
  }, [update, toast])

  const deleteTask = useCallback((id: string) => {
    update(d => { d.tasks = d.tasks.filter(t => t.id !== id) })
  }, [update])

  const regeneratePlan = useCallback((plan?: StudyPlan) => {
    if (!user) return
    const next = plan ?? generateStudyPlan(user.profile, 30)
    update(d => {
      d.plan = next
      d.tasks = next.tasks
    })
    toast('A fresh 30-day plan is ready')
  }, [update, user, toast])

  const setWorkspacePlan = useCallback((plan: StudyPlan) => {
    update(d => {
      d.plan = plan
      d.tasks = plan.tasks
    })
  }, [update])

  const logStudy = useCallback((minutes: number, topicId?: string) => {
    update(d => {
      const today = todayISO()
      const entry = d.studyLog.find(l => l.date === today)
      if (entry) entry.minutes += minutes
      else d.studyLog.push({ date: today, minutes })
      if (topicId) {
        const progress = d.topicProgress[topicId] ?? { topicId, status: 'learning', minutes: 0 }
        progress.minutes += minutes
        progress.lastStudied = new Date().toISOString()
        if (progress.status === 'not-started') progress.status = 'learning'
        d.topicProgress[topicId] = progress
      }
    })
  }, [update])

  const markTopic = useCallback((topicId: string, status: TopicProgress['status'], minutes = 0) => {
    update(d => {
      const progress = d.topicProgress[topicId] ?? { topicId, status, minutes: 0 }
      progress.status = status
      progress.minutes += minutes
      progress.lastStudied = new Date().toISOString()
      d.topicProgress[topicId] = progress
      if (status !== 'not-started') {
        const due = iso(new Date(Date.now() + (status === 'confident' ? 4 : 2) * 86_400_000))
        if (!d.revisions.some(r => r.topicId === topicId && !r.completed)) {
          d.revisions.push({
            id: uid('rev'),
            userId,
            topicId,
            title: `Spaced review`,
            reason: `Scheduled after marking the topic ${status}`,
            priority: status === 'confident' ? 45 : 65,
            dueDate: due,
            completed: false,
            source: 'plan',
          })
        }
      }
    })
  }, [update, userId])

  const addAttempt = useCallback((attempt: Attempt) => {
    update(d => {
      d.attempts.unshift(attempt)
      d.studyLog = d.studyLog
      const today = todayISO()
      const entry = d.studyLog.find(l => l.date === today)
      const minutes = Math.round(attempt.durationSec / 60)
      if (entry) entry.minutes += minutes
      else d.studyLog.push({ date: today, minutes })
    })
  }, [update])

  const addConversation = useCallback((conversation: ChatConversation) => {
    update(d => { d.conversations.unshift(conversation) })
  }, [update])

  const updateConversation = useCallback((id: string, patch: Partial<ChatConversation>) => {
    update(d => {
      const conv = d.conversations.find(c => c.id === id)
      if (conv) Object.assign(conv, patch, { updatedAt: new Date().toISOString() })
    })
  }, [update])

  const deleteConversation = useCallback((id: string) => {
    update(d => { d.conversations = d.conversations.filter(c => c.id !== id) })
    toast('Conversation deleted', 'info')
  }, [update, toast])

  const addEvaluation = useCallback((evaluation: MainsEvaluation) => {
    update(d => { d.evaluations.unshift(evaluation) })
  }, [update])

  const addFlashcards = useCallback((cards: Flashcard[]) => {
    update(d => { d.flashcards.unshift(...cards) })
    toast(`${cards.length} flashcard${cards.length === 1 ? '' : 's'} added`)
  }, [update, toast])

  const updateFlashcard = useCallback((card: Flashcard) => {
    update(d => {
      const index = d.flashcards.findIndex(f => f.id === card.id)
      if (index >= 0) d.flashcards[index] = card
    })
  }, [update])

  const addInterview = useCallback((session: InterviewSession) => {
    update(d => { d.interviews.unshift(session) })
  }, [update])

  const updateInterview = useCallback((id: string, patch: Partial<InterviewSession>) => {
    update(d => {
      const session = d.interviews.find(s => s.id === id)
      if (session) Object.assign(session, patch)
    })
  }, [update])

  const addRevision = useCallback((item: Partial<RevisionItem> & { topicId: string; title: string }) => {
    update(d => {
      if (d.revisions.some(r => r.topicId === item.topicId && !r.completed)) {
        toast('This topic is already in your revision queue', 'info')
        return
      }
      d.revisions.push({
        id: uid('rev'),
        userId,
        topicId: item.topicId,
        title: item.title,
        reason: item.reason ?? 'Added from the syllabus',
        priority: item.priority ?? 60,
        dueDate: item.dueDate ?? todayISO(),
        completed: false,
        source: item.source ?? 'manual',
      })
      toast('Added to revision queue')
    })
  }, [update, userId, toast])

  const completeRevision = useCallback((id: string) => {
    update(d => {
      const item = d.revisions.find(r => r.id === id)
      if (item) item.completed = true
    })
  }, [update])

  const resetWorkspace = useCallback(() => {
    if (!user) return
    localStorage.removeItem(`${DATA_PREFIX}${user.id}`)
    setData(user.id === 'user-demo' ? seedData() : blankData(user.profile))
    toast('Workspace reset', 'info')
  }, [user, toast])

  const value = useMemo<AppContextValue>(() => ({
    data,
    ready,
    theme,
    setTheme,
    toggleTheme,
    lang,
    setLanguage,
    t,
    update,
    toggleBookmark,
    addNote,
    updateNote,
    deleteNote,
    toggleTask,
    addTask,
    deleteTask,
    regeneratePlan,
    logStudy,
    markTopic,
    addAttempt,
    addConversation,
    updateConversation,
    deleteConversation,
    addEvaluation,
    addFlashcards,
    updateFlashcard,
    addInterview,
    updateInterview,
    addRevision,
    completeRevision,
    resetWorkspace,
    setWorkspacePlan,
  }), [data, ready, theme, setTheme, toggleTheme, lang, setLanguage, t, update, toggleBookmark, addNote, updateNote, deleteNote, toggleTask, addTask, deleteTask, regeneratePlan, logStudy, markTopic, addAttempt, addConversation, updateConversation, deleteConversation, addEvaluation, addFlashcards, updateFlashcard, addInterview, updateInterview, addRevision, completeRevision, resetWorkspace, setWorkspacePlan])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
