import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BarChart3, CheckCircle2, ChevronDown, Clock3, RefreshCw,
  RotateCcw, Sparkles, Target, TrendingDown, XCircle,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { questionById } from '../data/questions'
import { subjectName, topicName } from '../data/syllabus'
import { attemptAnswers } from '../lib/analytics'
import { pct } from '../lib/scoring'
import { todayISO } from '../lib/date'
import { uid } from '../lib/id'
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, SectionHeader } from '../components/ui'
import { BarChart, LineChart } from '../components/Charts'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

export function ResultsPage() {
  const { attemptId } = useParams()
  const { data, update } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)
  const attempt = data?.attempts.find(a => a.id === attemptId)

  const analysis = useMemo(() => {
    if (!attempt) return null
    const detail = attemptAnswers(attempt)
    const subjectMap = new Map<string, { attempted: number; correct: number }>()
    const topicMap = new Map<string, { attempted: number; correct: number }>()
    for (const a of detail) {
      const q = a.question!
      const s = subjectMap.get(q.subjectId) ?? { attempted: 0, correct: 0 }
      if (a.selected !== null) s.attempted += 1
      if (a.isCorrect) s.correct += 1
      subjectMap.set(q.subjectId, s)
      const t = topicMap.get(q.topicId) ?? { attempted: 0, correct: 0 }
      if (a.selected !== null) t.attempted += 1
      if (a.isCorrect) t.correct += 1
      topicMap.set(q.topicId, t)
    }
    const subjects = [...subjectMap.entries()].map(([id, v]) => ({ id, name: subjectName(id), ...v, accuracy: pct(v.correct, v.attempted) })).sort((a, b) => a.accuracy - b.accuracy)
    const topics = [...topicMap.entries()].map(([id, v]) => ({ id, name: topicName(id), ...v, accuracy: pct(v.correct, v.attempted) })).sort((a, b) => a.accuracy - b.accuracy)
    const negativeLoss = attempt.negativeMarking ? Number((attempt.incorrect / 3).toFixed(2)) : 0
    const weak = topics.filter(t => t.accuracy < 60 && t.attempted > 0).slice(0, 4)
    return { detail, subjects, topics, negativeLoss, weak }
  }, [attempt])

  if (!data || !attempt || !analysis) {
    return <div className="page"><EmptyState icon={<BarChart3 size={24} />} title="Attempt not found" description="This test result is not available on this device." action={<Button onClick={() => navigate('/prelims')}>Back to tests</Button>} /></div>
  }

  const scorePct = Math.round((attempt.score / attempt.maxScore) * 100)
  const totalMinutes = Math.round(attempt.durationSec / 60)
  const avgTime = Math.round(attempt.durationSec / attempt.questionIds.length)

  const addWeakToRevision = () => {
    let added = 0
    update(d => {
      for (const w of analysis.weak) {
        if (!d.revisions.some(r => r.topicId === w.id && !r.completed)) {
          d.revisions.push({ id: uid('rev'), userId: user?.id ?? '', topicId: w.id, title: `Review — ${w.name}`, reason: `Low accuracy (${w.accuracy}%) in ${attempt.testName}`, priority: 90, dueDate: todayISO(), completed: false, source: 'test' })
          added += 1
        }
      }
    })
    toast(added ? `${added} topic${added === 1 ? '' : 's'} added to revision` : 'Weak topics are already in your revision queue', added ? 'success' : 'info')
  }

  return (
    <div className="page results-page">
      <div className="results-top">
        <Link to="/prelims" className="back-link"><ArrowLeft size={15} /> Back to test engine</Link>
        <div className="results-top__actions">
          <Button variant="secondary" onClick={() => navigate('/prelims')}><RefreshCw size={15} /> Retake a test</Button>
          <Button onClick={addWeakToRevision}><RotateCcw size={15} /> Add weak topics to revision</Button>
        </div>
      </div>

      <Card className="results-hero">
        <div className="results-score">
          <ProgressRing value={scorePct} size={132} stroke={9} tone={scorePct >= 65 ? 'success' : scorePct >= 40 ? 'accent' : 'danger'} label="Test score">
            <strong>{scorePct}%</strong>
            <small>score</small>
          </ProgressRing>
          <div className="results-score__text">
            <Badge tone={attempt.negativeMarking ? 'warn' : 'neutral'}>{attempt.negativeMarking ? 'Negative marking on' : 'No negative marking'}</Badge>
            <h1>{attempt.testName}</h1>
            <p>{attempt.score} / {attempt.maxScore} marks · {totalMinutes} minutes · {attempt.mode} test</p>
          </div>
        </div>
        <div className="results-stat-grid">
          <div><span>Accuracy</span><strong>{attempt.accuracy}%</strong></div>
          <div><span>Attempted</span><strong>{attempt.correct + attempt.incorrect}<small>/{attempt.questionIds.length}</small></strong></div>
          <div><span>Correct</span><strong className="text-success">{attempt.correct}</strong></div>
          <div><span>Incorrect</span><strong className="text-danger">{attempt.incorrect}</strong></div>
          <div><span>Unattempted</span><strong>{attempt.unattempted}</strong></div>
          <div><span>Avg. time</span><strong>{avgTime}s<small>/q</small></strong></div>
        </div>
      </Card>

      <div className="results-grid">
        <Card className="panel">
          <SectionHeader eyebrow="Diagnosis" title="Where the marks went" />
          <div className="diagnosis">
            {attempt.incorrect > 0 && (
              <div className="diagnosis__item diagnosis__item--danger">
                <XCircle size={17} />
                <div><strong>{attempt.incorrect} incorrect answers</strong><p>{attempt.negativeMarking ? `Negative marking cost you about ${analysis.negativeLoss} marks.` : 'No negative marking, but the concepts still need repair.'} {analysis.negativeLoss > 0 ? 'In a high-stakes mock, guess only when you can eliminate two options.' : ''}</p></div>
              </div>
            )}
            {attempt.unattempted > 0 && (
              <div className="diagnosis__item diagnosis__item--warn">
                <Target size={17} />
                <div><strong>{attempt.unattempted} unattempted</strong><p>Review whether these were deliberate skips or time-management losses. A skip is smart only when you have eliminated options and still cannot decide.</p></div>
              </div>
            )}
            {analysis.weak.length > 0 && (
              <div className="diagnosis__item diagnosis__item--accent">
                <TrendingDown size={17} />
                <div><strong>Weakest areas: {analysis.weak.map(w => w.name).join(', ')}</strong><p>Start with {analysis.weak[0].name}. Rebuild the concept, then attempt five focused questions before returning to mixed practice.</p></div>
              </div>
            )}
            {attempt.incorrect === 0 && attempt.unattempted === 0 && (
              <div className="diagnosis__item diagnosis__item--success"><CheckCircle2 size={17} /><div><strong>Clean attempt</strong><p>Raise the difficulty or reduce the time limit. Accuracy without time pressure is only the first milestone.</p></div></div>
            )}
          </div>
          <div className="ai-analysis">
            <div className="ai-analysis__head"><Sparkles size={16} /><h3>AI analysis — why did I lose marks?</h3></div>
            <p>{attempt.incorrect > attempt.correct * 0.25
              ? `The main loss is conceptual, not speed. You are converting too few attempts into correct answers. The highest-value next step is to revise ${analysis.weak[0]?.name ?? 'your weakest topic'} and re-attempt a short focused set before another full mock.`
              : analysis.subjects[0] && analysis.subjects[0].accuracy < 50
                ? `Your overall score is held back by ${analysis.subjects[0].name}, where accuracy was ${analysis.subjects[0].accuracy}%. Your other sections are relatively stronger. Rebalance your next week toward this subject.`
                : attempt.unattempted > attempt.questionIds.length * 0.2
                  ? `You left ${attempt.unattempted} questions untouched. That may be prudent, but at this stage it suggests uncertainty. Build a decision rule: attempt if you can eliminate at least two options.`
                  : `The score is consistent with your recent attempts. To move up, increase the difficulty of practice and write one Mains answer linking the weakest topic to current affairs.`}</p>
            <div className="ai-analysis__next">
              <span><Target size={14} /> Next best action</span>
              <strong>{analysis.weak[0] ? `Revise ${analysis.weak[0].name}` : 'Take a higher-difficulty sectional test'}</strong>
              <Button size="sm" variant="secondary" onClick={() => navigate('/study-plan')}>Open revision queue</Button>
            </div>
          </div>
        </Card>

        <div className="results-side">
          <Card className="panel">
            <SectionHeader eyebrow="Breakdown" title="Subject performance" />
            <BarChart horizontal data={analysis.subjects.map(s => ({ label: s.name, value: s.accuracy }))} height={Math.max(160, analysis.subjects.length * 34)} tone="var(--accent)" />
          </Card>
          <Card className="panel">
            <SectionHeader eyebrow="Topics" title="Accuracy by topic" />
            <div className="topic-accuracy-list">
              {analysis.topics.slice(0, 6).map(t => (
                <div key={t.id} className="topic-accuracy">
                  <div><span>{t.name}</span><strong className={cn(t.accuracy < 50 ? 'text-danger' : t.accuracy >= 75 ? 'text-success' : '')}>{t.accuracy}%</strong></div>
                  <ProgressBar value={t.accuracy} hideValue tone={t.accuracy < 50 ? 'danger' : t.accuracy >= 75 ? 'success' : 'accent'} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="panel">
            <SectionHeader eyebrow="Pace" title="Time discipline" />
            <div className="pace-row"><Clock3 size={15} /><span>Total time</span><strong>{totalMinutes} min</strong></div>
            <div className="pace-row"><Clock3 size={15} /><span>Per question</span><strong>{avgTime}s</strong></div>
            <LineChart data={attempt.answers.map((a, i) => ({ label: `${i + 1}`, value: Math.min(100, Math.round((a.timeSpent / Math.max(1, avgTime)) * 50)) }))} height={150} tone="var(--teal)" suffix="" />
            <p className="muted small">Relative time per question. Spikes often mark uncertainty or over-reading.</p>
          </Card>
        </div>
      </div>

      <section className="review-section">
        <SectionHeader eyebrow="Review" title="Question-by-question" description="Open an explanation only after you have tried to recall the reasoning yourself." action={<Badge tone="neutral">{attempt.questionIds.length} questions</Badge>} />
        <div className="review-list">
          {analysis.detail.map((a, i) => {
            const q = a.question!
            const correct = Array.isArray(q.correct) ? q.correct : [q.correct]
            const isOpen = open === q.id
            return (
              <Card key={q.id} className={cn('review-item', a.isCorrect ? 'review-item--correct' : a.selected === null ? 'review-item--skipped' : 'review-item--wrong')}>
                <button className="review-item__head" onClick={() => setOpen(isOpen ? null : q.id)} aria-expanded={isOpen}>
                  <span className="review-item__num mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className={cn('review-item__status', a.isCorrect ? 'ok' : a.selected === null ? 'skip' : 'bad')}>
                    {a.isCorrect ? <CheckCircle2 size={17} /> : a.selected === null ? <Clock3 size={17} /> : <XCircle size={17} />}
                  </span>
                  <span className="review-item__stem">{q.stem.split('\n')[0]}</span>
                  <Badge tone={a.isCorrect ? 'success' : a.selected === null ? 'neutral' : 'danger'}>{a.isCorrect ? 'Correct' : a.selected === null ? 'Skipped' : 'Incorrect'}</Badge>
                  <ChevronDown size={16} className={cn('review-item__chev', isOpen && 'open')} />
                </button>
                {isOpen && (
                  <div className="review-item__body">
                    <div className="review-options">
                      {q.options.map((option, oi) => (
                        <div key={oi} className={cn('review-option', correct.includes(oi) && 'review-option--correct', a.selected === oi && !correct.includes(oi) && 'review-option--wrong')}>
                          <span>{String.fromCharCode(65 + oi)}</span><p>{option}</p>
                          {correct.includes(oi) && <CheckCircle2 size={15} />}
                          {a.selected === oi && !correct.includes(oi) && <XCircle size={15} />}
                        </div>
                      ))}
                    </div>
                    <p className="review-explanation"><strong>Explanation.</strong> {q.explanation}</p>
                    <div className="review-item__links">
                      <Link to={`/learn/topic/${q.topicId}`} className="text-link">Revise topic <ArrowRight size={13} /></Link>
                      <Link to={`/pyq/${q.id}`} className="text-link">Open question <ArrowRight size={13} /></Link>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
