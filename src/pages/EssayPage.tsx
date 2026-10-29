import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Feather, Lightbulb, Pause, Play, Quote, RotateCcw, Sparkles, Target, TriangleAlert } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { evaluateEssay } from '../services/ai'
import type { MainsEvaluation } from '../types'
import { uid } from '../lib/id'
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, Tabs, Textarea } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

const essayTopics = [
  'The paradox of plenty: why resource-rich regions can remain poor.',
  'Silence is not neutrality: the ethics of speaking up in public life.',
  'A republic is only as strong as its ordinary institutions.',
  'The future of work in an age of intelligent machines.',
  'Water is a right, a resource and a responsibility.',
  'Can a democracy be both fast and fair?',
  'The idea of India is a conversation, not a conclusion.',
  'Privacy in the age of the always-on sensor.',
  'What we owe to strangers: solidarity beyond the family.',
  'Cities are the laboratories of the twenty-first century.',
  'The use and abuse of history in public life.',
  'Courage is the quietest of the public virtues.',
]

const quotes = [
  { text: 'Constitutional morality is not a natural sentiment. It has to be cultivated.', author: 'B.R. Ambedkar' },
  { text: 'Where the mind is without fear and the head is held high…', author: 'Rabindranath Tagore' },
  { text: 'The arc of the moral universe is long, but it bends toward justice.', author: 'Martin Luther King Jr.' },
  { text: 'The best way to find yourself is to lose yourself in the service of others.', author: 'Mahatma Gandhi' },
]

const dimensions = [
  { label: 'Social', text: 'Identity, community, gender, caste, migration, education and the everyday experience of inequality.' },
  { label: 'Economic', text: 'Growth, employment, informality, public finance, technology and the distribution of gains.' },
  { label: 'Political', text: 'Institutions, federalism, representation, accountability and the quality of public deliberation.' },
  { label: 'Ethical', text: 'Justice, means and ends, accountability, care and the obligations we owe to strangers.' },
  { label: 'Philosophical', text: 'Liberty, equality, duty, progress, the good life and the limits of collective action.' },
  { label: 'Environmental', text: 'Sustainability, intergenerational justice, ecological limits and the politics of transition.' },
  { label: 'Cultural', text: 'Memory, language, art, pluralism and the making of shared meaning.' },
]

export function EssayPage() {
  const { addEvaluation } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('build')
  const [topic, setTopic] = useState(essayTopics[0])
  const [essay, setEssay] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<MainsEvaluation | null>(null)
  const [thesis, setThesis] = useState('')
  const timerRef = useRef<number | null>(null)

  const words = essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!running) return
    timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [running])

  const timer = () => setRunning(v => !v)
  const resetTimer = () => { setRunning(false); setSeconds(0) }

  const generateTopic = () => {
    const next = essayTopics[Math.floor(Math.random() * essayTopics.length)]
    setTopic(next); setResult(null); setEssay('')
  }

  const buildThesis = () => {
    setThesis(`**Thesis option 1 — tension:** “${topic.replace(/[.?]$/, '')}” is not a choice between two opposites but a tension that must be negotiated through institutions and public reasoning.\n\n**Thesis option 2 — consequence:** The way a society answers this question reveals what it values, whom it protects and what it is willing to sacrifice.\n\n**Thesis option 3 — agency:** Meaningful change requires both individual responsibility and institutional reform; neither is sufficient alone.`)
  }

  const evaluate = async () => {
    if (words < 150) { toast('Write at least 150 words before evaluating.', 'error'); return }
    setBusy(true)
    await new Promise(r => setTimeout(r, 700))
    const base = evaluateEssay({ topic, essay })
    const evaluation: MainsEvaluation = { ...base, id: uid('essay'), userId: user?.id ?? '', createdAt: new Date().toISOString() }
    addEvaluation(evaluation)
    setResult(evaluation)
    setBusy(false)
    toast('Essay evaluated')
    setTab('evaluate')
  }

  return (
    <div className="page essay-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Essay lab</p>
          <h1>An essay is an argument, not a garland of quotations.</h1>
          <p className="page-head__sub">Brainstorm dimensions, sharpen a thesis, then write. The mentor helps you think; it will not write the essay for you.</p>
        </div>
        <Button variant="secondary" onClick={generateTopic}><Sparkles size={16} /> Generate a topic</Button>
      </header>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'build', label: 'Build' }, { id: 'write', label: 'Write' }, { id: 'evaluate', label: 'Evaluate', count: result ? 1 : 0 }]} />

      {tab === 'build' && (
        <div className="essay-build">
          <Card className="essay-topic-card">
            <div className="panel-head"><h2><Feather size={18} /> Essay topic</h2><Badge tone="accent">Essay paper</Badge></div>
            <Textarea rows={2} value={topic} onChange={e => setTopic(e.target.value)} className="essay-topic-input" aria-label="Essay topic" />
            <div className="essay-topic-list">
              {essayTopics.slice(0, 8).map(t => <button key={t} onClick={() => { setTopic(t); setResult(null) }} className={cn(topic === t && 'active')}>{t}</button>)}
            </div>
          </Card>

          <div className="essay-grid">
            <Card className="panel">
              <h3><BrainCircuit size={17} /> Multi-dimensional analysis</h3>
              <p className="muted small">Choose the dimensions that genuinely illuminate your topic. An essay that covers everything superficially is weaker than one that goes deep in four directions.</p>
              <div className="dimension-cards">
                {dimensions.map((d, i) => (
                  <div key={d.label} className="dimension-card">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <div><strong>{d.label}</strong><p>{d.text}</p></div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="essay-side">
              <Card className="panel">
                <h3><Target size={17} /> Thesis development</h3>
                <p className="muted small">A thesis is a claim that can be argued, not a description of the topic. State it in one sentence and test every paragraph against it.</p>
                <Button size="sm" variant="secondary" onClick={buildThesis}><Lightbulb size={14} /> Build thesis options</Button>
                {thesis && <div className="thesis-box"><Markdown content={thesis} /></div>}
              </Card>
              <Card className="panel">
                <h3><BookOpen size={17} /> Introduction builder</h3>
                <ol className="protocol-list">
                  <li><strong>Hook:</strong> a scene, paradox, statistic or idea.</li>
                  <li><strong>Context:</strong> why the question matters now.</li>
                  <li><strong>Thesis:</strong> your central claim in one sentence.</li>
                  <li><strong>Roadmap:</strong> the dimensions you will cover.</li>
                </ol>
                <div className="intro-example">
                  <span>Example opening</span>
                  <p>A city that floods every monsoon is not surprised by the rain. It is surprised by its own choices. The question of urban resilience is therefore less about water than about who decides, who pays and who is remembered when the water recedes.</p>
                </div>
              </Card>
              <Card className="panel">
                <h3><Quote size={17} /> Quote bank</h3>
                <div className="quote-list">
                  {quotes.map(q => <div key={q.text}><p>“{q.text}”</p><span>— {q.author}</span></div>)}
                </div>
              </Card>
            </div>
          </div>

          <Card className="essay-cta">
            <div><strong>Ready to write?</strong><p>Set a 90-minute timer, outline first, then write continuously.</p></div>
            <Button onClick={() => setTab('write')}>Open the writing desk <ArrowRight size={15} /></Button>
          </Card>
        </div>
      )}

      {tab === 'write' && (
        <div className="essay-write">
          <Card className="essay-editor-card">
            <div className="essay-editor-head">
              <div><span className="eyebrow">Essay</span><h2>{topic}</h2></div>
              <div className="write-tools">
                <button className={cn('timer-btn', running && 'active')} onClick={timer}>{running ? <Pause size={14} /> : <Play size={14} />} <span className="mono">{clock}</span></button>
                <button className="icon-btn" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={15} /></button>
              </div>
            </div>
            <Textarea rows={22} value={essay} onChange={e => setEssay(e.target.value)} className="essay-editor" placeholder="Write your essay. Aim for 1,000–1,200 words. Open with a hook, state a thesis, develop 4–6 sections, acknowledge complexity, and close with a forward-looking synthesis." aria-label="Your essay" />
            <div className="essay-editor-foot">
              <div className="word-meter"><div className="word-meter__bar"><span style={{ width: `${Math.min(100, (words / 1000) * 100)}%` }} /></div><span><strong>{words}</strong> / 1000 words</span></div>
              <div className="write-actions">
                <Button variant="ghost" size="sm" onClick={() => setTab('build')}>Back to build</Button>
                <Button size="sm" loading={busy} onClick={evaluate}><Sparkles size={15} /> Evaluate essay</Button>
              </div>
            </div>
          </Card>
          <aside className="essay-write-side">
            <Card><h3>Structure check</h3><ul className="protocol-list"><li>Does the introduction state a thesis?</li><li>Does each section advance the argument?</li><li>Is there a counter-view?</li><li>Does the conclusion return to the opening?</li><li>Have you avoided unverified statistics?</li></ul></Card>
            <Card><h3>Words to avoid</h3><p className="muted small">“Very”, “really”, “society says”, “since time immemorial”, and long lists of schemes without an argument. Prefer precise verbs and concrete examples.</p></Card>
          </aside>
        </div>
      )}

      {tab === 'evaluate' && (
        <div className="essay-evaluation">
          {!result ? (
            <EmptyState icon={<Feather size={24} />} title="No essay evaluated yet" description="Write at least 150 words and run the evaluation to see the rubric, missing dimensions and a model architecture." action={<Button onClick={() => setTab('write')}>Open the writing desk</Button>} />
          ) : (
            <>
              <Card className="evaluation-hero">
                <div className="evaluation-score">
                  <ProgressRing value={(result.score / result.maxScore) * 100} size={120} stroke={9} tone="teal" label="Essay score"><strong>{result.score}</strong><small>/ {result.maxScore}</small></ProgressRing>
                  <div><Badge tone="warn"><TriangleAlert size={12} /> Practice signal, not UPSC marks</Badge><h2>{result.wordCount} words</h2><p>{result.strengths.length} strong dimensions · {result.weaknesses.length} to improve</p></div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setResult(null); setEssay(''); setTab('write') }}>Write another</Button>
              </Card>
              <div className="evaluation-grid">
                <Card className="panel">
                  <h3>Rubric detail</h3>
                  <div className="dimension-list">
                    {result.dimensions.map(d => (
                      <div key={d.label} className="dimension"><div><span>{d.label}</span><strong>{d.score}/10</strong></div><ProgressBar value={d.score * 10} hideValue tone={d.score < 6 ? 'danger' : 'teal'} /><p>{d.feedback}</p></div>
                    ))}
                  </div>
                </Card>
                <div className="evaluation-side">
                  <Card className="panel feedback-list"><h3 className="text-success"><CheckCircle2 size={16} /> Strengths</h3><ul>{result.strengths.map(s => <li key={s}>{s}</li>)}</ul></Card>
                  <Card className="panel feedback-list"><h3 className="text-danger"><TriangleAlert size={16} /> Weaknesses</h3><ul>{result.weaknesses.map(s => <li key={s}>{s}</li>)}</ul></Card>
                  <Card className="panel feedback-list"><h3><Target size={16} /> Missing dimensions</h3><ul>{result.missing.length ? result.missing.map(s => <li key={s}>{s}</li>) : <li>No major gap detected.</li>}</ul></Card>
                </div>
              </div>
              <Card className="panel"><h3>Improvement suggestions</h3><ol className="suggestion-list">{result.suggestions.map(s => <li key={s}>{s}</li>)}</ol></Card>
              <Card className="panel model-answer"><h3><Sparkles size={16} /> Essay architecture</h3><Markdown content={result.modelAnswer} /></Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
