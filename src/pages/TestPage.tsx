import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Clock3,
  Flag, Grid3X3, LogOut, Send, X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { configFromParams, selectQuestions } from '../lib/tests'
import { scoreAttempt } from '../lib/scoring'
import { subjectName } from '../data/syllabus'
import type { Attempt, AttemptAnswer } from '../types'
import { uid } from '../lib/id'
import { todayISO, secondsToClock } from '../lib/date'
import { Badge, Button, Card, EmptyState, Modal } from '../components/ui'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

interface AnswerState { selected: number | null; marked: boolean; timeSpent: number }

export function TestPage() {
  const [params] = useSearchParams()
  const config = useMemo(() => configFromParams(params), [params])
  const testQuestions = useMemo(() => selectQuestions(config), [config])
  const { addAttempt, update, t } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState<AnswerState[]>(() => testQuestions.map(() => ({ selected: null, marked: false, timeSpent: 0 })))
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.minutes * 60)
  const [submitted, setSubmitted] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const currentRef = useRef(0)
  const submittedRef = useRef(false)
  currentRef.current = current

  const answered = answers.filter(a => a.selected !== null).length
  const marked = answers.filter(a => a.marked).length

  useEffect(() => {
    if (!config.timed) return
    const timer = window.setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
      setAnswers(prev => prev.map((a, i) => i === currentRef.current ? { ...a, timeSpent: a.timeSpent + 1 } : a))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [config.timed])

  useEffect(() => {
    if (config.timed && timeLeft <= 0 && !submittedRef.current) {
      submittedRef.current = true
      submit(true)
    }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (['1', '2', '3', '4'].includes(e.key)) {
        const opt = Number(e.key) - 1
        const q = testQuestions[current]
        if (q && opt < q.options.length) setAnswers(prev => prev.map((a, i) => i === current ? { ...a, selected: opt } : a))
      }
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(testQuestions.length - 1, c + 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(0, c - 1))
      if (e.key.toLowerCase() === 'm') setAnswers(prev => prev.map((a, i) => i === current ? { ...a, marked: !a.marked } : a))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current, testQuestions])

  const submit = (auto = false) => {
    if (submittedRef.current && !auto) return
    submittedRef.current = true
    setSubmitted(true)
    const key: Record<string, { correct: number | number[]; options: number }> = {}
    for (const q of testQuestions) key[q.id] = { correct: q.correct, options: q.options.length }
    const score = scoreAttempt(answers.map((a, i) => ({ questionId: testQuestions[i].id, selected: a.selected })), key, config.negative)
    const attemptAnswers: AttemptAnswer[] = answers.map((a, i) => ({ questionId: testQuestions[i].id, selected: a.selected, marked: a.marked, timeSpent: a.timeSpent }))
    const subjectPart = config.subject ? ` — ${subjectName(config.subject)}` : ''
    const attempt: Attempt = {
      id: uid('attempt'),
      userId: user?.id ?? '',
      testId: uid('test'),
      testName: `${config.mode === 'daily' ? 'Daily quiz' : config.mode === 'full' ? 'Full-length mock' : config.mode === 'pyq' ? 'PYQ mock' : config.mode === 'topic' ? 'Topic test' : config.mode === 'subject' ? 'Subject test' : 'Custom test'}${subjectPart}`,
      mode: config.mode,
      startedAt: new Date(Date.now() - (config.minutes * 60 - timeLeft) * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSec: config.minutes * 60 - timeLeft,
      negativeMarking: config.negative,
      answers: attemptAnswers,
      questionIds: testQuestions.map(q => q.id),
      ...score,
    }
    addAttempt(attempt)
    update(d => {
      for (const [i, a] of answers.entries()) {
        const q = testQuestions[i]
        if (a.selected !== null) continue
        if (!d.revisions.some(r => r.topicId === q.topicId && !r.completed)) {
          d.revisions.push({
            id: uid('rev'), userId: user?.id ?? '', topicId: q.topicId,
            title: `Review — ${q.topicId.replace('t-', '').replace(/-/g, ' ')}`,
            reason: `Unattempted in ${attempt.testName}`, priority: 55, dueDate: todayISO(), completed: false, source: 'test',
          })
        }
      }
      const wrongTopics = new Set<string>()
      for (const [i, a] of answers.entries()) {
        const q = testQuestions[i]
        const correct = Array.isArray(q.correct) ? q.correct.includes(a.selected ?? -1) : q.correct === a.selected
        if (a.selected !== null && !correct) wrongTopics.add(q.topicId)
      }
      for (const topicId of wrongTopics) {
        if (!d.revisions.some(r => r.topicId === topicId && !r.completed)) {
          d.revisions.push({
            id: uid('rev'), userId: user?.id ?? '', topicId,
            title: `Review — ${topicId.replace('t-', '').replace(/-/g, ' ')}`,
            reason: `Incorrect answers in ${attempt.testName}`, priority: 85, dueDate: todayISO(), completed: false, source: 'test',
          })
        }
      }
    })
    toast(auto ? 'Time over — test submitted' : 'Test submitted')
    navigate(`/prelims/results/${attempt.id}`, { replace: true })
  }

  if (!testQuestions.length) {
    return <div className="test-shell"><div className="page"><EmptyState icon={<AlertTriangle size={24} />} title="No questions available" description="This test has no questions in the bank yet. Try another format or add questions from the Admin console." action={<Button onClick={() => navigate('/prelims')}>Back to test setup</Button>} /></div></div>
  }

  const question = testQuestions[current]
  const answer = answers[current]
  const progressPct = ((current + 1) / testQuestions.length) * 100

  const palette = (
    <div className="palette">
      <div className="palette__head">
        <h3><Grid3X3 size={16} /> {t('questionPalette')}</h3>
        <button className="palette__close" onClick={() => setPaletteOpen(false)} aria-label="Close palette"><X size={17} /></button>
      </div>
      <div className="palette__legend">
        <span><i className="dot dot--success" /> Answered {answered}</span>
        <span><i className="dot dot--warn" /> Marked {marked}</span>
        <span><i className="dot dot--muted" /> {testQuestions.length - answered} left</span>
      </div>
      <div className="palette__grid">
        {testQuestions.map((q, i) => {
          const a = answers[i]
          return (
            <button
              key={q.id}
              className={cn('palette__btn', i === current && 'palette__btn--current', a.selected !== null && 'palette__btn--answered', a.marked && 'palette__btn--marked')}
              onClick={() => { setCurrent(i); setPaletteOpen(false) }}
              aria-label={`Question ${i + 1}${a.selected !== null ? ', answered' : ', not answered'}${a.marked ? ', marked for review' : ''}`}
            >
              {i + 1}
              {a.marked && <Flag size={8} className="palette__flag" />}
            </button>
          )
        })}
      </div>
      <div className="palette__foot">
        <Button size="sm" onClick={() => setSubmitOpen(true)}><Send size={14} /> {t('submitTest')}</Button>
        <Button size="sm" variant="ghost" onClick={() => setExitOpen(true)}><LogOut size={14} /> Exit</Button>
      </div>
    </div>
  )

  return (
    <div className="test-shell">
      <header className="test-header">
        <div className="test-header__left">
          <button className="icon-btn" onClick={() => setExitOpen(true)} aria-label="Exit test"><ChevronLeft size={20} /></button>
          <div>
            <strong>{config.mode === 'full' ? 'Full-length mock' : config.mode === 'pyq' ? 'PYQ mock' : config.mode === 'topic' ? 'Topic test' : config.mode === 'subject' ? 'Subject test' : config.mode === 'daily' ? 'Daily quiz' : 'Custom test'}</strong>
            <small>{answered} of {testQuestions.length} answered · {config.negative ? 'negative marking' : 'no negative marking'}</small>
          </div>
        </div>
        <div className="test-header__progress">
          <span>Question {current + 1} of {testQuestions.length}</span>
          <div className="test-progress"><span style={{ width: `${progressPct}%` }} /></div>
        </div>
        <div className="test-header__right">
          <div className={cn('timer', config.timed && timeLeft < 60 && 'timer--danger')}>
            <Clock3 size={16} />
            <span className="mono">{config.timed ? secondsToClock(timeLeft) : 'Untimed'}</span>
          </div>
          <Button size="sm" variant="secondary" className="palette-toggle" onClick={() => setPaletteOpen(true)}><Grid3X3 size={15} /> Palette</Button>
          <Button size="sm" onClick={() => setSubmitOpen(true)}><Send size={15} /> Submit</Button>
        </div>
      </header>

      <div className="test-body">
        <main className="test-question">
          <Card className="test-card">
            <div className="test-card__meta">
              <span className="question-number mono">Q{String(current + 1).padStart(2, '0')}</span>
              <Badge tone={question.difficulty === 'hard' ? 'danger' : question.difficulty === 'medium' ? 'warn' : 'success'}>{question.difficulty}</Badge>
              <Badge tone={question.source.type === 'pyq' ? 'purple' : 'neutral'}>{question.source.type === 'pyq' ? 'Curated PYQ' : 'AI practice'}</Badge>
              <span className="muted small">{subjectName(question.subjectId)}</span>
            </div>
            <h1>{question.stem.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</h1>
            <div className="option-list" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, i) => (
                <button key={i} role="radio" aria-checked={answer.selected === i} className={cn('option', answer.selected === i && 'option--selected')} onClick={() => setAnswers(prev => prev.map((a, idx) => idx === current ? { ...a, selected: i } : a))}>
                  <span className="option__key">{String.fromCharCode(65 + i)}</span>
                  <span className="option__text">{option}</span>
                  {answer.selected === i && <Check size={18} className="option__mark" />}
                </button>
              ))}
            </div>
            <div className="test-card__actions">
              <div className="test-card__action-left">
                <Button variant="ghost" size="sm" onClick={() => setAnswers(prev => prev.map((a, i) => i === current ? { ...a, selected: null } : a))} disabled={answer.selected === null}>{t('clearResponse')}</Button>
                <Button variant={answer.marked ? 'secondary' : 'ghost'} size="sm" onClick={() => setAnswers(prev => prev.map((a, i) => i === current ? { ...a, marked: !a.marked } : a))}>
                  <Flag size={14} /> {answer.marked ? 'Marked for review' : t('markForReview')}
                </Button>
              </div>
              <div className="test-card__nav">
                <Button variant="ghost" size="sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}><ArrowLeft size={15} /> {t('previous')}</Button>
                <Button size="sm" onClick={() => setCurrent(c => Math.min(testQuestions.length - 1, c + 1))} disabled={current === testQuestions.length - 1}>{t('next')} <ArrowRight size={15} /></Button>
              </div>
            </div>
          </Card>
          <p className="test-hint"><Bookmark size={13} /> Keyboard: 1–4 select · ← → navigate · M mark for review</p>
        </main>

        <aside className="test-palette-desktop">{palette}</aside>
      </div>

      {paletteOpen && (
        <div className="palette-drawer" onMouseDown={e => { if (e.target === e.currentTarget) setPaletteOpen(false) }}>
          <div className="palette-drawer__panel">{palette}</div>
        </div>
      )}

      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit this test?" size="sm"
        footer={<><Button variant="ghost" onClick={() => setSubmitOpen(false)}>Keep attempting</Button><Button onClick={() => submit(false)}>Submit test</Button></>}>
        <div className="submit-summary">
          <div><strong>{answered}</strong><span>Answered</span></div>
          <div><strong>{testQuestions.length - answered}</strong><span>Unattempted</span></div>
          <div><strong>{marked}</strong><span>Marked</span></div>
        </div>
        <p className="muted small">You will see the score, subject breakdown, weak areas and a question-by-question review.</p>
      </Modal>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)} title="Leave the test?" size="sm"
        footer={<><Button variant="ghost" onClick={() => setExitOpen(false)}>Continue test</Button><Button variant="danger" onClick={() => navigate('/prelims')}>Leave test</Button></>}>
        <p className="muted">Your answers on this page will be discarded. Progress is not submitted.</p>
      </Modal>
      {submitted && <div className="test-overlay"><div className="test-overlay__card"><Clock3 size={20} /><span>Submitting and preparing analysis…</span></div></div>}
    </div>
  )
}
