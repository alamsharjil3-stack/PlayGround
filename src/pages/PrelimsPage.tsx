import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, Clock3, FileSearch, Layers3,
  ListChecks, Play, Target, Zap,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { questions } from '../data/questions'
import { subjects, topics } from '../data/syllabus'
import { Badge, Button, Card, EmptyState, ProgressBar, SectionHeader, Select } from '../components/ui'
import { buildTestUrl, type TestConfig, type TestMode } from '../lib/tests'
import { formatDate } from '../lib/date'
import { cn } from '../lib/cn'

const modes: { id: TestMode; title: string; sub: string; icon: React.ReactNode; count: number; minutes: number }[] = [
  { id: 'daily', title: 'Daily quiz', sub: '10 mixed questions to keep the saw sharp', icon: <Zap size={19} />, count: 10, minutes: 10 },
  { id: 'topic', title: 'Topic quiz', sub: 'Focused practice on one syllabus topic', icon: <Target size={19} />, count: 10, minutes: 12 },
  { id: 'subject', title: 'Subject quiz', sub: 'Sectional practice across a subject', icon: <Layers3 size={19} />, count: 12, minutes: 15 },
  { id: 'full', title: 'Full-length mock', sub: 'A longer timed simulation from the bank', icon: <ClipboardCheck size={19} />, count: 30, minutes: 45 },
  { id: 'pyq', title: 'Previous-year mock', sub: 'Only curated PYQ records', icon: <FileSearch size={19} />, count: 20, minutes: 25 },
  { id: 'custom', title: 'Custom test', sub: 'Choose subject, count and duration', icon: <ListChecks size={19} />, count: 15, minutes: 20 },
]

export function PrelimsPage() {
  const { data, t, lang } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState<TestMode>('daily')
  const [subject, setSubject] = useState('economy')
  const [topic, setTopic] = useState('t-fiscal')
  const [difficulty, setDifficulty] = useState('all')
  const [count, setCount] = useState(15)
  const [minutes, setMinutes] = useState(20)
  const [negative, setNegative] = useState(true)
  const [timed, setTimed] = useState(true)

  const attempts = data?.attempts ?? []
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.score / a.maxScore) * 100, 0) / attempts.length) : 0
  const best = attempts.length ? Math.max(...attempts.map(a => Math.round((a.score / a.maxScore) * 100))) : 0
  const bankSubjects = useMemo(() => {
    const ids = [...new Set(questions.map(q => q.subjectId))]
    return subjects.filter(s => ids.includes(s.id))
  }, [])
  const subjectTopics = topics.filter(tp => tp.subjectId === subject)

  const selectedMode = modes.find(m => m.id === mode)!
  const config: TestConfig = {
    mode,
    subject: mode === 'topic' || mode === 'subject' || mode === 'custom' ? subject : undefined,
    topic: mode === 'topic' ? topic : undefined,
    difficulty: difficulty as TestConfig['difficulty'],
    count: mode === 'custom' ? count : selectedMode.count,
    minutes: mode === 'custom' ? minutes : selectedMode.minutes,
    negative,
    timed,
  }

  const start = () => navigate(buildTestUrl(config))

  return (
    <div className="page prelims-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Prelims test engine</p>
          <h1>Practise under exam conditions.</h1>
          <p className="page-head__sub">Timed tests, negative marking, a question palette, and an analysis that tells you exactly where the marks went.</p>
        </div>
        <Button onClick={start}><Play size={16} /> Start a test</Button>
      </header>

      <div className="prelims-stats">
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-indigo"><ClipboardCheck size={18} /></span><div><p>Tests taken</p><strong>{attempts.length}</strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-teal"><BarChart3 size={18} /></span><div><p>Average score</p><strong>{avg}<small>%</small></strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-amber"><Target size={18} /></span><div><p>Best score</p><strong>{best}<small>%</small></strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-rose"><Layers3 size={18} /></span><div><p>Question bank</p><strong>{questions.length}</strong></div></Card>
      </div>

      <div className="prelims-layout">
        <div>
          <SectionHeader eyebrow="Choose a format" title="What do you want to practise?" description="Every test is generated from the structured question bank. Nothing is hard-coded into a page." />
          <div className="mode-grid">
            {modes.map(m => (
              <button key={m.id} className={cn('mode-card', mode === m.id && 'mode-card--active')} onClick={() => setMode(m.id)}>
                <span className="mode-card__icon">{m.icon}</span>
                <strong>{m.title}</strong>
                <small>{m.sub}</small>
                <span className="mode-card__meta">{m.count} Q · {m.minutes} min</span>
              </button>
            ))}
          </div>

          <Card className="config-card">
            <div className="config-card__head">
              <div><span className="eyebrow">Configure</span><h2>{selectedMode.title}</h2></div>
              <Badge tone="info">{config.count} questions · {config.minutes} min</Badge>
            </div>
            <div className="config-grid">
              {(mode === 'subject' || mode === 'topic' || mode === 'custom') && (
                <label className="field"><span>Subject</span>
                  <Select value={subject} onChange={e => { setSubject(e.target.value); setTopic(topics.find(tp => tp.subjectId === e.target.value)?.id ?? '') }}>
                    {bankSubjects.map(s => <option key={s.id} value={s.id}>{lang === 'hi' ? s.nameHi : s.name}</option>)}
                  </Select>
                </label>
              )}
              {mode === 'topic' && (
                <label className="field"><span>Topic</span>
                  <Select value={topic} onChange={e => setTopic(e.target.value)}>
                    {subjectTopics.map(tp => <option key={tp.id} value={tp.id}>{lang === 'hi' ? tp.nameHi : tp.name}</option>)}
                  </Select>
                </label>
              )}
              <label className="field"><span>Difficulty</span>
                <Select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="all">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </Select>
              </label>
              {mode === 'custom' && (
                <>
                  <label className="field"><span>Questions</span>
                    <Select value={count} onChange={e => setCount(Number(e.target.value))}>
                      {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </label>
                  <label className="field"><span>Duration (minutes)</span>
                    <Select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>
                      {[5, 10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </label>
                </>
              )}
            </div>
            <div className="config-toggles">
              <label className="switch-row">
                <span><strong>Negative marking</strong><small>−⅓ for each incorrect answer</small></span>
                <button type="button" role="switch" aria-checked={negative} className={cn('switch', negative && 'switch--on')} onClick={() => setNegative(v => !v)}><span /></button>
              </label>
              <label className="switch-row">
                <span><strong>Timed</strong><small>Auto-submit when the clock ends</small></span>
                <button type="button" role="switch" aria-checked={timed} className={cn('switch', timed && 'switch--on')} onClick={() => setTimed(v => !v)}><span /></button>
              </label>
            </div>
            <div className="config-card__foot">
              <p className="muted small"><Clock3 size={13} /> {timed ? `${config.minutes} minute limit` : 'Untimed practice mode'} · answers can be reviewed after submission.</p>
              <Button onClick={start}><Play size={16} /> Start test</Button>
            </div>
          </Card>

          <Card className="prelims-tip">
            <CheckCircle2 size={18} />
            <div><strong>How to use the engine</strong><p>Attempt first, review second. Read the explanation for every wrong answer, then add the topic to your revision queue. The analysis will show whether the error was conceptual or a trap.</p></div>
            <Link to="/analytics" className="text-link">See analytics <ArrowRight size={14} /></Link>
          </Card>
        </div>

        <aside className="prelims-side">
          <Card>
            <SectionHeader eyebrow="History" title="Recent attempts" action={<Link to="/analytics" className="text-link">All</Link>} />
            {attempts.length ? (
              <div className="attempt-list">
                {[...attempts].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, 5).map(a => (
                  <Link key={a.id} to={`/prelims/results/${a.id}`} className="attempt-row">
                    <span className={cn('attempt-row__score mono', a.score / a.maxScore < 0.4 && 'low')}>{Math.round((a.score / a.maxScore) * 100)}%</span>
                    <div><strong>{a.testName}</strong><small>{formatDate(a.finishedAt, lang)} · {a.correct}/{a.questionIds.length} correct</small></div>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            ) : <EmptyState icon={<ClipboardCheck size={20} />} title="No attempts yet" description="Start with the daily quiz." />}
          </Card>

          <Card>
            <SectionHeader eyebrow="Readiness" title="Prelims signal" />
            <div className="prelims-readiness-row"><span>Average accuracy</span><strong>{avg}%</strong></div>
            <ProgressBar value={avg} hideValue />
            <div className="prelims-readiness-row"><span>Best score</span><strong>{best}%</strong></div>
            <ProgressBar value={best} hideValue tone="teal" />
            <p className="muted small">A useful target is 65%+ with fewer than 25% unattempted in a full mock. Sectional accuracy matters more than a single high score.</p>
          </Card>

          <Card className="exam-rule-card">
            <h3>Exam-day discipline</h3>
            <ul>
              <li>Read all four options before choosing.</li>
              <li>Skip when two options seem equally valid.</li>
              <li>Do not let one hard question consume three minutes.</li>
              <li>Use the palette to mark and return.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
