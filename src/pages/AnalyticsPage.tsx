import { Link } from 'react-router-dom'
import {
  Activity, ArrowRight, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2, Clock3,
  Download, Flame, Layers3, Target, TrendingUp, TriangleAlert,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import {
  dailyMinutes, overallStats, readinessBreakdown, scoreTrend, subjectStats, strongTopics, weakTopics, attemptAnswers,
} from '../lib/analytics'
import { formatDate, todayISO } from '../lib/date'
import { topicById, subjectName } from '../data/syllabus'
import { BarChart, LineChart } from '../components/Charts'
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, SectionHeader, Stat } from '../components/ui'
import { cn } from '../lib/cn'

export function AnalyticsPage() {
  const { data, t } = useApp()
  const { user } = useAuth()
  if (!data) return null
  const stats = overallStats(data)
  const subjects = subjectStats(data.attempts, data.topicProgress).sort((a, b) => b.attempted - a.attempted)
  const weak = weakTopics(data.attempts, data.topicProgress)
  const strong = strongTopics(data.attempts, data.topicProgress)
  const trend = scoreTrend(data.attempts)
  const minutes = dailyMinutes(data.studyLog, 14)
  const readiness = readinessBreakdown(data)
  const examDate = user?.profile.examDate
  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - new Date(todayISO()).getTime()) / 86_400_000)) : null
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i)); const key = d.toISOString().slice(0, 10)
    const entry = data.studyLog.find(l => l.date === key)
    return { date: key, minutes: entry?.minutes ?? 0 }
  })

  const hasData = data.attempts.length > 0 || data.studyLog.length > 0

  return (
    <div className="page analytics-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Performance analytics</p>
          <h1>Evidence, not vibes.</h1>
          <p className="page-head__sub">Test accuracy, syllabus coverage, study consistency and answer quality — read together, not in isolation.</p>
        </div>
        <div className="page-head__actions">
          {daysLeft !== null && <Badge tone={daysLeft < 120 ? 'warn' : 'info'}><CalendarDays size={12} /> {daysLeft} days to exam</Badge>}
        </div>
      </header>

      <Card className="readiness-hero">
        <div className="readiness-hero__main">
          <div className="readiness-rings">
            <ProgressRing value={stats.prelimsReadiness} size={128} stroke={9} tone="accent" label="Prelims readiness"><strong>{stats.prelimsReadiness}%</strong><small>Prelims</small></ProgressRing>
            <ProgressRing value={stats.mainsReadiness} size={128} stroke={9} tone="teal" label="Mains readiness"><strong>{stats.mainsReadiness}%</strong><small>Mains</small></ProgressRing>
          </div>
          <div className="readiness-copy">
            <span className="eyebrow">Estimated readiness</span>
            <h2>{stats.prelimsReadiness < 40 ? 'Foundation phase' : stats.prelimsReadiness < 65 ? 'Building momentum' : 'Consolidation phase'}</h2>
            <p>{stats.attempted < 25
              ? 'There is not enough test evidence yet. Take a 30-question mixed test to establish a baseline; until then, treat these numbers as provisional.'
              : `You have answered ${stats.attempted} questions with ${stats.accuracy}% accuracy and covered ${stats.syllabus}% of the syllabus. ${stats.revisionsDue ? `${stats.revisionsDue} revision items are due.` : 'Your revision queue is under control.'}`}</p>
            <div className="readiness-tags"><span><Target size={12} /> {stats.accuracy}% accuracy</span><span><BookOpenCheck size={12} /> {stats.syllabus}% syllabus</span><span><Activity size={12} /> {stats.tests} tests</span><span><Clock3 size={12} /> {stats.hours} hours</span></div>
          </div>
        </div>
        <div className="readiness-side">
          {readiness.map(r => <div key={r.label}><div><span>{r.label}</span><strong>{r.value}%</strong></div><ProgressBar value={r.value} hideValue tone={r.tone} /></div>)}
        </div>
      </Card>

      <div className="kpi-grid">
        <Stat label="MCQ accuracy" value={`${stats.accuracy}%`} sub={`${stats.correct} correct of ${stats.attempted}`} icon={<Target size={18} />} tone="accent" />
        <Stat label="Tests taken" value={stats.tests} sub="Every test feeds the model" icon={<BarChart3 size={18} />} tone="indigo" />
        <Stat label="Study hours" value={stats.hours} sub="Logged across all sessions" icon={<Clock3 size={18} />} tone="teal" />
        <Stat label="Mains avg." value={stats.evalAvg ? `${stats.evalAvg}%` : '—'} sub={`${data.evaluations.length} evaluated answers`} icon={<TrendingUp size={18} />} tone="amber" />
        <Stat label="Flashcards due" value={stats.flashcardsDue} sub={`${data.flashcards.length} total cards`} icon={<Layers3 size={18} />} tone="purple" />
      </div>

      {!hasData ? (
        <EmptyState icon={<BarChart3 size={26} />} title="Your analytics start with one honest test" description="Take a mixed prelims test or log a study session, and this page will begin to show patterns." action={<Link to="/prelims"><Button>Take a test <ArrowRight size={15} /></Button></Link>} />
      ) : (
        <>
          <div className="chart-grid-2">
            <Card className="panel">
              <SectionHeader eyebrow="Trend" title="Test score trend" description="Percentage of maximum marks across the last ten tests." action={<Badge tone="neutral">{data.attempts.length} attempts</Badge>} />
              {trend.length ? <LineChart data={trend} /> : <div className="chart-empty">Take at least one test to see a trend.</div>}
            </Card>
            <Card className="panel">
              <SectionHeader eyebrow="Consistency" title="Study minutes · last 14 days" description="The height of the bar is the habit." action={<Badge tone="success"><Flame size={12} /> {minutes.filter(m => m.value > 0).length} active days</Badge>} />
              <BarChart data={minutes} max={Math.max(60, ...minutes.map(m => m.value))} suffix=" min" tone="var(--teal)" />
            </Card>
          </div>

          <div className="analytics-grid">
            <Card className="panel">
              <SectionHeader eyebrow="Subject performance" title="Where accuracy and coverage diverge" description="Accuracy is only meaningful alongside the number of questions attempted." />
              {subjects.length ? (
                <div className="subject-performance">
                  {subjects.map(s => (
                    <div key={s.subjectId} className="subject-perf">
                      <div className="subject-perf__head"><span className="subject-perf__dot" style={{ background: s.color }} /><strong>{s.name}</strong><span className="muted small">{s.attempted} attempted · {s.progress}% covered</span><span className={cn('mono', s.accuracy < 50 ? 'text-danger' : s.accuracy >= 75 ? 'text-success' : '')}>{s.attempted ? `${s.accuracy}%` : '—'}</span></div>
                      <div className="subject-perf__bars"><ProgressBar value={s.accuracy} hideValue tone={s.accuracy < 50 ? 'danger' : s.accuracy >= 75 ? 'success' : 'accent'} /><ProgressBar value={s.progress} hideValue tone="info" /></div>
                      <div className="subject-perf__legend"><span>accuracy</span><span>coverage</span></div>
                    </div>
                  ))}
                </div>
              ) : <div className="chart-empty">No subject evidence yet.</div>}
            </Card>

            <div className="analytics-side">
              <Card className="panel">
                <h3><TriangleAlert size={16} className="text-danger" /> Weakest topics</h3>
                {weak.length ? <div className="weak-list">{weak.map(w => <Link key={w.topicId} to={`/learn/topic/${w.topicId}`} className="weak-row"><div><strong>{w.name}</strong><small>{subjectName(w.subjectId)}</small></div><span className="mono text-danger">{w.accuracy}%</span><ArrowRight size={14} /></Link>)}</div> : <p className="muted small">Not enough per-topic attempts to identify weaknesses. Take a topic test.</p>}
                {weak.length > 0 && <Link to={`/prelims?mode=topic&topic=${weak[0].topicId}`}><Button size="sm" variant="secondary" className="mt-12">Practise weakest topic</Button></Link>}
              </Card>
              <Card className="panel">
                <h3><CheckCircle2 size={16} className="text-success" /> Reliable strengths</h3>
                {strong.length ? <div className="strength-list">{strong.map(s => <div key={s.topicId}><span>{s.name}</span><Badge tone="success">{s.accuracy}%</Badge></div>)}</div> : <p className="muted small">Strengths appear after two or more accurate attempts on a topic.</p>}
              </Card>
            </div>
          </div>

          <Card className="panel">
            <SectionHeader eyebrow="Consistency map" title="Last 28 days" description="Dark cells are active study days. Gaps are data, not judgement." action={<Badge tone="neutral">{last28.filter(d => d.minutes > 0).length} active days</Badge>} />
            <div className="heatmap" aria-label="Study activity over 28 days">
              {last28.map(d => <div key={d.date} className={cn('heat-cell', d.minutes > 0 && d.minutes < 60 ? 'level-1' : d.minutes >= 60 && d.minutes < 150 ? 'level-2' : d.minutes >= 150 ? 'level-3' : '')} title={`${formatDate(d.date)}: ${d.minutes} min`} />)}
            </div>
            <div className="heatmap-legend"><span>Less</span><i /><i className="level-1" /><i className="level-2" /><i className="level-3" /><span>More</span></div>
          </Card>

          <Card className="panel">
            <SectionHeader eyebrow="Test history" title="Every attempt, including the uncomfortable ones" />
            <div className="attempt-table">
              <div className="attempt-table__head"><span>Test</span><span>Date</span><span>Score</span><span>Accuracy</span><span>Result</span></div>
              {data.attempts.slice(0, 10).map(a => {
                const answers = attemptAnswers(a)
                const skipped = answers.filter(x => x.selected === null).length
                return (
                  <Link key={a.id} to={`/prelims/results/${a.id}`} className="attempt-row">
                    <span><strong>{a.testName}</strong><small>{a.mode} · {a.questionIds.length} questions</small></span>
                    <span>{formatDate(a.finishedAt)}</span>
                    <span className="mono">{a.score}/{a.maxScore}</span>
                    <span className="mono">{a.accuracy}%</span>
                    <span><Badge tone={a.accuracy >= 66 ? 'success' : a.accuracy >= 45 ? 'warn' : 'danger'}>{a.accuracy >= 66 ? 'Strong' : a.accuracy >= 45 ? 'Developing' : 'Needs work'}</Badge>{skipped > 0 && <small>{skipped} skipped</small>}</span>
                  </Link>
                )
              })}
            </div>
            {!data.attempts.length && <div className="chart-empty">No tests yet.</div>}
          </Card>

          <div className="analytics-note">
            <Download size={14} />
            <span>Analytics are computed locally from your attempts, study log and syllabus coverage. They are learning signals, not predictions of your UPSC result.</span>
          </div>
        </>
      )}
    </div>
  )
}
