import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarCheck2, CheckCircle2, Circle, Clock3, Flame, Newspaper,
  PenLine, Play, RotateCcw, Sparkles, Target, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { currentAffairs, currentAffairById } from '../data/currentAffairs'
import { questions } from '../data/questions'
import { subjectName, topicById, topicName } from '../data/syllabus'
import { overallStats, weakTopics } from '../lib/analytics'
import { daysUntil, formatDate, relativeDay, todayISO } from '../lib/date'
import { studyStreak, tasksForDate } from '../lib/planner'
import { Badge, Button, Card, EmptyState, ProgressBar, ProgressRing, SectionHeader, Skeleton } from '../components/ui'
import { cn } from '../lib/cn'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, ready, t, toggleTask, lang } = useApp()
  const navigate = useNavigate()

  if (!ready || !data) return <div className="page"><Skeleton lines={10} /></div>

  const stats = overallStats(data)
  const streak = studyStreak(data.studyLog)
  const todayTasks = tasksForDate(data.tasks)
  const doneToday = todayTasks.filter(t => t.completed).length
  const weak = weakTopics(data.attempts, data.topicProgress)
  const dueRevisions = data.revisions.filter(r => !r.completed && r.dueDate <= todayISO()).sort((a, b) => b.priority - a.priority)
  const upcomingRevisions = data.revisions.filter(r => !r.completed).sort((a, b) => b.priority - a.priority).slice(0, 3)
  const latestAttempts = [...data.attempts].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, 3)
  const practiceQ = questions[new Date().getDate() % questions.filter(q => q.source.type === 'ai-practice').length]
  const featuredCa = currentAffairs.slice(0, 2)
  const continueTopics = weak.length
    ? weak.slice(0, 2).map(w => topicById(w.topicId)).filter(Boolean)
    : Object.values(data.topicProgress).filter(p => p.status === 'learning').slice(0, 2).map(p => topicById(p.topicId)).filter(Boolean)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
  const days = daysUntil(user?.profile.examDate ?? '2027-05-23')
  const focusTask = todayTasks.find(t => !t.completed)

  const recommendation = weak.length
    ? `Your accuracy is weakest in ${subjectName(weak[0].subjectId, lang)}${weak[1] ? ` and ${subjectName(weak[1].subjectId, lang)}` : ''}. Start with ${weak[0].name}, then attempt 10 mixed MCQs.`
    : stats.tests === 0
      ? 'You have no test data yet. Take a 10-question diagnostic so the mentor can calibrate your plan.'
      : 'Your accuracy is stable. Move to a timed sectional test and one Mains answer today.'

  return (
    <div className="page dashboard">
      <header className="dashboard__greeting">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{greeting}, {user?.profile.name.split(' ')[0]}.</h1>
          <p className="dashboard__sub">Here is what deserves your attention today.</p>
        </div>
        <div className="dashboard__actions">
          <span className="exam-countdown"><Target size={15} /><strong className="mono">{days}</strong> {t('daysToExam')}</span>
          <Button onClick={() => navigate('/prelims')}><Play size={16} /> {t('startQuiz')}</Button>
        </div>
      </header>

      <div className="dashboard__grid">
        <Card className="today-card">
          <div className="today-card__head">
            <div>
              <span className="eyebrow">{t('todaysPlan')}</span>
              <h2>{doneToday} of {todayTasks.length} done</h2>
            </div>
            <ProgressRing value={todayTasks.length ? (doneToday / todayTasks.length) * 100 : 0} size={64} stroke={6} label="Today's task completion">
              <span className="mono">{doneToday}/{todayTasks.length}</span>
            </ProgressRing>
          </div>
          {focusTask ? (
            <div className="focus-block">
              <div className="focus-block__tag"><Sparkles size={14} /> Next best action</div>
              <h3>{focusTask.title}</h3>
              <p>{focusTask.note ?? `${focusTask.minutes} minutes · ${focusTask.type}`}</p>
              <div className="focus-block__actions">
                {focusTask.topicId ? (
                  <Button size="sm" onClick={() => navigate(`/learn/topic/${focusTask.topicId}`)}>Start session <ArrowRight size={15} /></Button>
                ) : focusTask.type === 'test' ? (
                  <Button size="sm" onClick={() => navigate('/prelims')}>Open test engine <ArrowRight size={15} /></Button>
                ) : focusTask.type === 'mains' ? (
                  <Button size="sm" onClick={() => navigate('/mains')}>Open answer writing <ArrowRight size={15} /></Button>
                ) : (
                  <Button size="sm" onClick={() => navigate('/current-affairs')}>Read the brief <ArrowRight size={15} /></Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => toggleTask(focusTask.id)}><CheckCircle2 size={15} /> {t('markComplete')}</Button>
              </div>
            </div>
          ) : (
            <EmptyState icon={<CheckCircle2 size={22} />} title="Today’s plan is complete" description="Consolidate with a 10-minute recall or move to tomorrow’s first task." />
          )}
          <div className="task-list">
            {todayTasks.slice(0, 5).map(task => (
              <div key={task.id} className={cn('task-row', task.completed && 'task-row--done')}>
                <button className="task-check" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>
                  {task.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                </button>
                <div className="task-row__body">
                  <strong>{task.title}</strong>
                  <span><Clock3 size={12} /> {task.minutes} min · {task.type.replace('-', ' ')}</span>
                </div>
                {task.topicId && <Link to={`/learn/topic/${task.topicId}`} className="task-row__open" aria-label="Open topic"><ArrowRight size={15} /></Link>}
              </div>
            ))}
          </div>
          <Link to="/study-plan" className="card-link">Open full study plan <ArrowRight size={14} /></Link>
        </Card>

        <div className="dashboard__side">
          <Card className="readiness-card">
            <SectionHeader eyebrow="Preparation" title="Readiness" action={<Link to="/analytics" className="text-link">Details</Link>} />
            <div className="readiness-rings">
              <ProgressRing value={stats.prelimsReadiness} size={104} tone="accent" label="Prelims readiness"><strong>{stats.prelimsReadiness}%</strong><small>Prelims</small></ProgressRing>
              <ProgressRing value={stats.mainsReadiness} size={104} tone="teal" label="Mains readiness"><strong>{stats.mainsReadiness}%</strong><small>Mains</small></ProgressRing>
            </div>
            <div className="readiness-meta">
              <div><span>Syllabus</span><strong>{stats.syllabus}%</strong></div>
              <div><span>Accuracy</span><strong>{stats.accuracy}%</strong></div>
              <div><span>Tests</span><strong>{stats.tests}</strong></div>
            </div>
          </Card>

          <Card className="ai-reco">
            <div className="ai-reco__head"><span className="ai-orb"><Sparkles size={16} /></span><span>AI recommendation</span></div>
            <p>{recommendation}</p>
            <div className="ai-reco__actions">
              <Button size="sm" variant="secondary" onClick={() => navigate('/mentor')}>Ask mentor</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/analytics')}>See reasoning</Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="stat-grid">
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-amber"><Flame size={18} /></span><div><p>{t('studyStreak')}</p><strong>{streak} <small>days</small></strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-teal"><Clock3 size={18} /></span><div><p>{t('hoursStudied')}</p><strong>{stats.hours} <small>hrs</small></strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-indigo"><BookOpen size={18} /></span><div><p>{t('syllabusCompletion')}</p><strong>{stats.syllabus}<small>%</small></strong></div></Card>
        <Card className="mini-stat"><span className="mini-stat__icon tone-bg-rose"><RotateCcw size={18} /></span><div><p>{t('revisionDue')}</p><strong>{stats.revisionsDue} <small>topics</small></strong></div></Card>
      </div>

      <div className="dashboard__lower">
        <Card className="panel">
          <SectionHeader eyebrow="Continue" title="Pick up where you left off" action={<Link to="/learn" className="text-link">All subjects</Link>} />
          <div className="continue-list">
            {continueTopics.length ? continueTopics.map(topic => topic && (
              <Link key={topic.id} to={`/learn/topic/${topic.id}`} className="continue-item">
                <span className="continue-item__icon"><BookOpen size={17} /></span>
                <div><strong>{lang === 'hi' ? topic.nameHi : topic.name}</strong><small>{subjectName(topic.subjectId, lang)} · {topic.subtopics[0]}</small></div>
                <ArrowRight size={15} />
              </Link>
            )) : <p className="muted small">Begin a syllabus topic to see it here.</p>}
          </div>
          <div className="revision-block">
            <div className="revision-block__head">
              <h3><RotateCcw size={16} /> {t('revisionQueue')}</h3>
              <Badge tone={dueRevisions.length ? 'warn' : 'success'}>{dueRevisions.length} due</Badge>
            </div>
            {upcomingRevisions.length ? upcomingRevisions.map(rev => (
              <div key={rev.id} className="revision-row">
                <span className={cn('revision-row__dot', rev.dueDate <= todayISO() && 'is-due')} />
                <div><strong>{rev.title}</strong><small>{rev.reason}</small></div>
                <span className="revision-row__date">{relativeDay(rev.dueDate)}</span>
              </div>
            )) : <p className="muted small">No revision scheduled. It will appear as you study.</p>}
            <Link to="/study-plan" className="card-link">Open revision queue <ArrowRight size={14} /></Link>
          </div>
        </Card>

        <div className="dashboard__stack">
          <Card className="panel">
            <SectionHeader eyebrow="Practice" title="Tests &amp; PYQs" action={<Link to="/prelims" className="text-link">Test engine</Link>} />
            {latestAttempts.length ? (
              <div className="attempt-list">
                {latestAttempts.map(a => (
                  <Link key={a.id} to={`/prelims/results/${a.id}`} className="attempt-row">
                    <span className="attempt-row__score mono">{Math.round((a.score / a.maxScore) * 100)}%</span>
                    <div><strong>{a.testName}</strong><small>{formatDate(a.finishedAt, lang)} · {a.correct} correct · {a.incorrect} wrong</small></div>
                    <TrendingUp size={15} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Target size={20} />} title="No tests yet" description="Take a diagnostic to calibrate your plan." action={<Button size="sm" onClick={() => navigate('/prelims')}>Start diagnostic</Button>} />
            )}
            <div className="practice-q">
              <div className="practice-q__head"><Badge tone="accent">Daily question</Badge><span className="muted small">{subjectName(practiceQ.subjectId)}</span></div>
              <p>{practiceQ.stem.split('\n')[0]}</p>
              <Link to={`/pyq/${practiceQ.id}`} className="card-link">Attempt and review <ArrowRight size={14} /></Link>
            </div>
          </Card>

          <Card className="panel">
            <SectionHeader eyebrow="Current affairs" title="Today’s briefings" action={<Link to="/current-affairs" className="text-link">All issues</Link>} />
            <div className="ca-mini-list">
              {featuredCa.map(ca => (
                <Link key={ca.id} to={`/current-affairs/${ca.id}`} className="ca-mini">
                  <span className="ca-mini__icon"><Newspaper size={16} /></span>
                  <div><strong>{ca.title}</strong><small>{ca.category} · {ca.updatedLabel}</small></div>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </Card>

          <Card className="quick-card">
            <h3>{t('quickActions')}</h3>
            <div className="quick-grid">
              <button onClick={() => navigate('/mentor')}><Sparkles size={17} /><span>{t('askMentor')}</span></button>
              <button onClick={() => navigate('/prelims')}><Target size={17} /><span>{t('startQuiz')}</span></button>
              <button onClick={() => navigate('/mains')}><PenLine size={17} /><span>{t('writeAnswer')}</span></button>
              <button onClick={() => navigate('/current-affairs')}><Newspaper size={17} /><span>{t('readAffairs')}</span></button>
              <button onClick={() => navigate('/study-plan')}><CalendarCheck2 size={17} /><span>{t('studyPlan')}</span></button>
              <button onClick={() => navigate('/flashcards')}><BookOpen size={17} /><span>{t('flashcards')}</span></button>
            </div>
          </Card>
        </div>
      </div>

      <div className="dashboard__footer-note">
        <span><Sparkles size={14} /> Built around one loop: learn → practise → analyse → revise → improve.</span>
        <span className="muted">Last active {data.studyLog[0] ? formatDate(data.studyLog[0].date, lang) : 'today'}</span>
      </div>
    </div>
  )
}
