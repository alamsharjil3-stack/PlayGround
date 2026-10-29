import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, FileText, History, Pause, PenLine, Play, RotateCcw,
  Sparkles, Target, Timer, TriangleAlert, Upload,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { evaluateAnswer } from '../services/ai'
import { topicById, topicName, subjectName } from '../data/syllabus'
import type { MainsEvaluation, PaperId } from '../types'
import { uid } from '../lib/id'
import { formatDate } from '../lib/date'
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, Select, Tabs, Textarea } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

const presetQuestions: { id: string; question: string; paper: PaperId; topicId: string; words: number }[] = [
  { id: 'mq1', question: '“Fiscal consolidation and growth are not mutually exclusive.” Discuss with reference to India’s fiscal strategy.', paper: 'mains-gs3', topicId: 't-fiscal', words: 250 },
  { id: 'mq2', question: 'Examine the significance of the Loss and Damage Fund for climate justice.', paper: 'mains-gs3', topicId: 't-climate', words: 250 },
  { id: 'mq3', question: '“Anonymity in political funding is incompatible with the voter’s right to know.” Critically examine.', paper: 'mains-gs2', topicId: 't-rights', words: 250 },
  { id: 'mq4', question: 'Discuss the constitutional and federal dimensions of the 106th Amendment.', paper: 'mains-gs2', topicId: 't-constitution-mains', words: 150 },
  { id: 'mq5', question: '“Urban flooding is a governance failure as much as a meteorological event.” Critically examine.', paper: 'mains-gs1', topicId: 't-society', words: 250 },
  { id: 'mq6', question: 'Examine the role of digital public infrastructure in improving governance and financial inclusion.', paper: 'mains-gs2', topicId: 't-governance', words: 150 },
]

const paperOptions: { id: PaperId; label: string }[] = [
  { id: 'mains-gs1', label: 'GS I — History, Geography, Society' },
  { id: 'mains-gs2', label: 'GS II — Polity, Governance, IR' },
  { id: 'mains-gs3', label: 'GS III — Economy, Environment, Security' },
  { id: 'mains-gs4', label: 'GS IV — Ethics' },
  { id: 'mains-essay', label: 'Essay' },
]

export function MainsPage() {
  const [params] = useSearchParams()
  const topicParam = params.get('topic')
  const initial = presetQuestions.find(q => q.topicId === topicParam) ?? presetQuestions[0]
  const { data, addEvaluation, addNote, t, lang } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('write')
  const [question, setQuestion] = useState(initial.question)
  const [paper, setPaper] = useState<PaperId>(initial.paper)
  const [topicId, setTopicId] = useState<string | undefined>(initial.topicId)
  const [wordLimit, setWordLimit] = useState(initial.words)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<MainsEvaluation | null>(null)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const words = answer.trim() ? answer.trim().split(/\s+/).filter(Boolean).length : 0
  const selected = result
  const history = data?.evaluations ?? []

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = () => {
    if (running) {
      setRunning(false)
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    if (timerRef.current) window.clearInterval(timerRef.current)
    setRunning(true)
    timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const resetTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setRunning(false)
    setSeconds(0)
  }

  const choosePreset = (id: string) => {
    const q = presetQuestions.find(p => p.id === id)
    if (!q) return
    setQuestion(q.question); setPaper(q.paper); setTopicId(q.topicId); setWordLimit(q.words)
  }

  const run = async () => {
    if (words < 30) { toast('Write at least 30 words before evaluating.', 'error'); return }
    setBusy(true)
    await new Promise(r => window.setTimeout(r, 650))
    const base = evaluateAnswer({ question, answer, paper, topicId, wordLimit })
    const evaluation: MainsEvaluation = {
      ...base,
      id: uid('eval'),
      userId: user?.id ?? '',
      createdAt: new Date().toISOString(),
    }
    addEvaluation(evaluation)
    setResult(evaluation)
    setBusy(false)
    resetTimer()
    toast('Answer evaluated')
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const saveAsNote = (ev: MainsEvaluation) => {
    addNote({
      title: `Mains feedback — ${ev.question.slice(0, 60)}`,
      content: `## Question\n${ev.question}\n\n## Score\n${ev.score}/${ev.maxScore}\n\n## Feedback\n${ev.weaknesses.map(w => `- ${w}`).join('\n')}\n\n## Model answer\n${ev.modelAnswer}`,
      tags: ['mains', 'evaluation', subjectName(topicById(topicId ?? '')?.subjectId ?? '')].filter(Boolean),
      sourceType: 'revision',
    })
  }

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div className="page mains-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Mains answer writing</p>
          <h1>Write. Then let the rubric tell the truth.</h1>
          <p className="page-head__sub">UPSC-style evaluation across structure, content, references, balance and conclusion — with a model answer and specific next steps.</p>
        </div>
        <div className="mains-head-actions">
          <Badge tone="warn"><TriangleAlert size={12} /> Indicative scores, not UPSC marks</Badge>
        </div>
      </header>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'write', label: 'Answer writing' }, { id: 'history', label: 'Saved evaluations', count: history.length }]} />

      {tab === 'write' && (
        <div className="mains-layout">
          <div className="mains-editor">
            <Card className="mains-prompt-card">
              <div className="panel-head"><h2><FileText size={17} /> Question</h2><Badge tone="neutral">{words > wordLimit ? `${words - wordLimit} over limit` : `${wordLimit - words} words left`}</Badge></div>
              <Textarea rows={3} value={question} onChange={e => setQuestion(e.target.value)} className="question-input" aria-label="Mains question" />
              <div className="mains-config">
                <label className="field"><span>Paper</span>
                  <Select value={paper} onChange={e => setPaper(e.target.value as PaperId)}>
                    {paperOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </Select>
                </label>
                <label className="field"><span>Word limit</span>
                  <Select value={wordLimit} onChange={e => setWordLimit(Number(e.target.value))}>
                    <option value={150}>150 words (10 marks)</option>
                    <option value={250}>250 words (15 marks)</option>
                  </Select>
                </label>
                <label className="field"><span>Topic (optional)</span>
                  <Select value={topicId ?? ''} onChange={e => setTopicId(e.target.value || undefined)}>
                    <option value="">Auto-detect from question</option>
                    {['t-fiscal', 't-climate', 't-rights', 't-constitution-mains', 't-society', 't-governance', 't-ethics', 't-ir'].map(id => <option key={id} value={id}>{topicName(id)}</option>)}
                  </Select>
                </label>
              </div>
              <div className="preset-row">
                <span>Try a question:</span>
                {presetQuestions.slice(0, 4).map(q => <button key={q.id} onClick={() => choosePreset(q.id)}>{q.question.split(' ').slice(0, 4).join(' ')}…</button>)}
              </div>
            </Card>

            <Card className="mains-write-card">
              <div className="mains-write-card__head">
                <h2><PenLine size={17} /> Your answer</h2>
                <div className="write-tools">
                  <button className={cn('timer-btn', running && 'active')} onClick={startTimer}>{running ? <Pause size={14} /> : <Play size={14} />} <span className="mono">{clock}</span></button>
                  <button className="icon-btn" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={15} /></button>
                </div>
              </div>
              <Textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={14}
                placeholder={'Introduction — define the core term and set the context.\n\nBody — 2–3 arguments with examples, constitutional or policy anchors.\n\nCounter-view — acknowledge the strongest objection.\n\nConclusion — a forward-looking way forward.'}
                className="answer-area"
                aria-label="Your Mains answer"
              />
              <div className="mains-write-card__foot">
                <div className="word-meter">
                  <div className="word-meter__bar"><span style={{ width: `${Math.min(100, (words / wordLimit) * 100)}%` }} className={words > wordLimit * 1.15 ? 'over' : ''} /></div>
                  <span><strong>{words}</strong> / {wordLimit} words</span>
                </div>
                <div className="write-actions">
                  <Button variant="ghost" size="sm" onClick={() => setAnswer('')} disabled={!answer}><RotateCcw size={14} /> Clear</Button>
                  <Button variant="secondary" size="sm"><Upload size={14} /> Upload (demo)</Button>
                  <Button size="sm" loading={busy} onClick={run}><Sparkles size={15} /> {t('evaluate')}</Button>
                </div>
              </div>
            </Card>

            <Card className="mains-rubric-hint">
              <CheckCircle2 size={17} />
              <div><strong>Before you submit</strong><p>Does the introduction answer the directive word? Does each paragraph advance one argument? Is there a counter-view? Does the conclusion propose a way forward rather than repeat the introduction?</p></div>
            </Card>
          </div>

          <aside className="mains-side">
            <Card>
              <h3><Target size={16} /> Evaluation rubric</h3>
              <div className="rubric-list">
                {['Understanding the question', 'Structure & flow', 'Content depth', 'Examples & data', 'Constitutional references', 'Balance & dimensions', 'Language & clarity', 'Conclusion & way forward'].map((r, i) => (
                  <div key={r}><span>{String(i + 1).padStart(2, '0')}</span><p>{r}</p></div>
                ))}
              </div>
            </Card>
            <Card>
              <h3><Timer size={16} /> Practice protocol</h3>
              <ol className="protocol-list">
                <li>Read the question twice; underline the directive word.</li>
                <li>Spend 2 minutes on a skeleton — intro, three points, conclusion.</li>
                <li>Write without stopping. Do not polish sentences mid-answer.</li>
                <li>Evaluate only after the timer ends.</li>
                <li>Rewrite one paragraph using the feedback.</li>
              </ol>
            </Card>
            <Card>
              <h3><History size={16} /> Recent evaluations</h3>
              {history.slice(0, 3).map(ev => (
                <button key={ev.id} className="history-mini" onClick={() => { setResult(ev); setTab('write'); window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }}>
                  <span className="mono">{Math.round((ev.score / ev.maxScore) * 100)}%</span>
                  <span>{ev.question.slice(0, 60)}…</span>
                </button>
              ))}
              {!history.length && <p className="muted small">Your evaluations will appear here.</p>}
            </Card>
          </aside>
        </div>
      )}

      {tab === 'history' && (
        <div className="stack">
          {history.length ? history.map(ev => (
            <Card key={ev.id} className="evaluation-history-card">
              <div className="evaluation-history-card__head">
                <div><Badge tone="info">{paperOptions.find(p => p.id === ev.paper)?.label.split('—')[0] ?? ev.paper}</Badge><h3>{ev.question}</h3><small>{formatDate(ev.createdAt, lang)} · {ev.wordCount} words</small></div>
                <div className="history-score"><strong>{ev.score}</strong><span>/ {ev.maxScore}</span></div>
              </div>
              <p className="muted">{ev.weaknesses.join(' · ')}</p>
              <Button size="sm" variant="secondary" onClick={() => { setResult(ev); setTab('write'); window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }}>Open full evaluation <ArrowRight size={14} /></Button>
            </Card>
          )) : <EmptyState icon={<PenLine size={24} />} title="No evaluations yet" description="Write an answer and run the rubric to build a feedback history." action={<Button onClick={() => setTab('write')}>Write an answer</Button>} />}
        </div>
      )}

      {selected && tab === 'write' && (
        <section className="evaluation" ref={resultRef}>
          <Card className="evaluation-hero">
            <div className="evaluation-score">
              <ProgressRing value={(selected.score / selected.maxScore) * 100} size={120} stroke={9} tone="teal" label="Answer score">
                <strong>{selected.score}</strong><small>/ {selected.maxScore}</small>
              </ProgressRing>
              <div>
                <Badge tone="info">Indicative practice score</Badge>
                <h2>Evaluation</h2>
                <p>{selected.wordCount} words · {selected.dimensions.filter(d => d.score >= 7).length} strong dimensions</p>
              </div>
            </div>
            <div className="evaluation-actions">
              <Button size="sm" variant="secondary" onClick={() => saveAsNote(selected)}>Save feedback as note</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAnswer(''); setResult(null) }}>Write another</Button>
            </div>
          </Card>

          <div className="evaluation-grid">
            <Card className="panel">
              <h3>Rubric detail</h3>
              <div className="dimension-list">
                {selected.dimensions.map(d => (
                  <div key={d.label} className="dimension">
                    <div><span>{d.label}</span><strong className={d.score < 6 ? 'text-danger' : d.score >= 8 ? 'text-success' : ''}>{d.score}/10</strong></div>
                    <ProgressBar value={d.score * 10} hideValue tone={d.score < 6 ? 'danger' : d.score >= 8 ? 'success' : 'accent'} />
                    <p>{d.feedback}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="evaluation-side">
              <Card className="panel feedback-list"><h3 className="text-success"><CheckCircle2 size={16} /> Strengths</h3><ul>{selected.strengths.map(s => <li key={s}>{s}</li>)}</ul></Card>
              <Card className="panel feedback-list"><h3 className="text-danger"><TriangleAlert size={16} /> Weaknesses</h3><ul>{selected.weaknesses.map(s => <li key={s}>{s}</li>)}</ul></Card>
              <Card className="panel feedback-list"><h3><Target size={16} /> Missing dimensions</h3><ul>{selected.missing.length ? selected.missing.map(s => <li key={s}>{s}</li>) : <li>No major missing dimension detected.</li>}</ul></Card>
            </div>
          </div>

          <Card className="panel">
            <h3>Improvement suggestions</h3>
            <ol className="suggestion-list">{selected.suggestions.map(s => <li key={s}>{s}</li>)}</ol>
          </Card>

          <div className="model-answer-grid">
            <Card className="panel">
              <h3>Better introduction</h3>
              <p className="model-text">{selected.betterIntro}</p>
              <h3>Better conclusion</h3>
              <p className="model-text">{selected.betterConclusion}</p>
            </Card>
            <Card className="panel model-answer">
              <div className="panel-head"><h3><Sparkles size={16} /> Model answer</h3><Badge tone="accent">Structure guide</Badge></div>
              <Markdown content={selected.modelAnswer} />
            </Card>
          </div>
        </section>
      )}

      <div className="mains-disclaimer">
        <TriangleAlert size={14} />
        <span>Scores are an AI practice signal, not UPSC marks. Always compare with official question papers, toppers’ answers and your mentor’s judgement.</span>
      </div>
    </div>
  )
}
