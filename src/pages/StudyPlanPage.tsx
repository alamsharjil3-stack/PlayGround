import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, Flame,
  ListTodo, Plus, RefreshCw, RotateCcw, Sparkles, Target, Trash2, TriangleAlert,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { planStats, studyStreak, tasksForDate, weekGrid } from '../lib/planner'
import { formatDate, todayISO, iso, addDays } from '../lib/date'
import { topicById, topics } from '../data/syllabus'
import { generateStudyPlan } from '../lib/planner'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, ProgressBar, ProgressRing, Select, Tabs } from '../components/ui'
import type { Task } from '../types'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

const taskIcons: Record<Task['type'], React.ReactNode> = {
  study: <Target size={15} />,
  revision: <RotateCcw size={15} />,
  test: <ListTodo size={15} />,
  pyq: <ListTodo size={15} />,
  mains: <Sparkles size={15} />,
  'current-affairs': <CalendarDays size={15} />,
}

const typeLabels: Record<Task['type'], string> = {
  study: 'Study', revision: 'Revision', test: 'Test', pyq: 'Practice', mains: 'Mains', 'current-affairs': 'Current affairs',
}

export function StudyPlanPage() {
  const { data, t, toggleTask, addTask, deleteTask, regeneratePlan, completeRevision } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('week')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [weekOffset, setWeekOffset] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Task['type']>('study')
  const [date, setDate] = useState(todayISO())
  const [minutes, setMinutes] = useState(45)
  const [topicId, setTopicId] = useState('')

  const tasks = data?.tasks ?? []
  const revisions = (data?.revisions ?? []).filter(r => !r.completed)
  const stats = planStats(tasks)
  const streak = studyStreak(data?.studyLog ?? [])
  const dayTasks = tasksForDate(tasks, selectedDate)
  const doneToday = dayTasks.filter(t => t.completed).length
  const todayMinutes = dayTasks.filter(t => t.completed).reduce((s, t) => s + t.minutes, 0)

  const calendar = useMemo(() => {
    if (weekOffset === 0) return weekGrid(tasks)
    const start = addDays(new Date(), weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = iso(addDays(start, i))
      const list = tasks.filter(t => t.date === d)
      return { date: d, tasks: list, done: list.filter(t => t.completed).length }
    })
  }, [tasks, weekOffset])

  const overdue = tasks.filter(t => !t.completed && t.date < todayISO())
  const upcoming = tasks.filter(t => !t.completed && t.date > todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12)

  const submitTask = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), type, date, minutes, topicId: topicId || undefined })
    setTitle(''); setAddOpen(false)
  }

  const refreshPlan = () => {
    if (!user) return
    regeneratePlan(generateStudyPlan(user.profile, 30))
  }

  if (!data) return null

  return (
    <div className="page plan-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Study plan</p>
          <h1>A plan you can actually keep.</h1>
          <p className="page-head__sub">Weak subjects first, high-weight topics early, revision built in, and one honest test every week.</p>
        </div>
        <div className="page-head__actions">
          <Button variant="ghost" onClick={refreshPlan}><RefreshCw size={15} /> Regenerate</Button>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add task</Button>
        </div>
      </header>

      <div className="plan-stats">
        <Card className="plan-stat plan-stat--wide">
          <ProgressRing value={stats.percent} size={92} stroke={8} tone="teal" label="Plan completion"><strong>{stats.percent}%</strong><small>done</small></ProgressRing>
          <div><span className="eyebrow">30-day plan</span><h3>{stats.done} of {stats.total} tasks complete</h3><p>Small, repeatable blocks beat heroic weekends. Protect the daily minimum.</p></div>
        </Card>
        <Card className="plan-stat"><div className="plan-stat__icon tone-bg-amber"><Flame size={18} /></div><div><span className="eyebrow">Study streak</span><strong>{streak} day{streak === 1 ? '' : 's'}</strong><p>Keep the chain alive today.</p></div></Card>
        <Card className="plan-stat"><div className="plan-stat__icon tone-bg-accent"><Clock3 size={18} /></div><div><span className="eyebrow">Today</span><strong>{todayMinutes} min</strong><p>{doneToday}/{dayTasks.length} tasks done</p></div></Card>
        <Card className="plan-stat"><div className="plan-stat__icon tone-bg-danger"><RotateCcw size={18} /></div><div><span className="eyebrow">Revision due</span><strong>{revisions.filter(r => r.dueDate <= todayISO()).length}</strong><p>Scheduled reviews waiting.</p></div></Card>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'week', label: 'Week board' }, { id: 'revision', label: 'Revision queue', count: revisions.length }, { id: 'upcoming', label: 'Upcoming' }, { id: 'overdue', label: 'Overdue', count: overdue.length }]} />

      {tab === 'week' && (
        <>
          <div className="calendar-nav">
            <button className="icon-btn" onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><ChevronLeft size={17} /></button>
            <span>{weekOffset === 0 ? 'This week' : weekOffset > 0 ? `In ${weekOffset} week${weekOffset > 1 ? 's' : ''}` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}</span>
            <button className="icon-btn" onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><ChevronRight size={17} /></button>
            {weekOffset !== 0 && <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>Jump to today</Button>}
          </div>
          <div className="week-board">
            {calendar.map((day, i) => {
              const d = new Date(day.date)
              const active = day.date === selectedDate
              const isToday = day.date === todayISO()
              return (
                <button key={day.date} className={cn('week-day', active && 'active', isToday && 'today')} onClick={() => setSelectedDate(day.date)}>
                  <span>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  <strong>{d.getDate()}</strong>
                  <div className="week-day__tasks">{day.tasks.slice(0, 3).map(t => <i key={t.id} className={cn(t.completed && 'done')} />)}</div>
                  <small>{day.done}/{day.tasks.length} done</small>
                </button>
              )
            })}
          </div>

          <div className="plan-day">
            <Card className="panel">
              <div className="panel-head">
                <div><span className="eyebrow">{selectedDate === todayISO() ? 'Today' : formatDate(selectedDate)}</span><h2>{dayTasks.length} planned tasks</h2></div>
                <Badge tone={doneToday === dayTasks.length && dayTasks.length > 0 ? 'success' : 'neutral'}>{doneToday}/{dayTasks.length} complete</Badge>
              </div>
              <div className="task-list">
                {dayTasks.map(task => (
                  <div key={task.id} className={cn('task-row', task.completed && 'done')}>
                    <button className="task-check" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed ? <CheckCircle2 size={21} /> : <Circle size={21} />}</button>
                    <div className="task-row__body">
                      <div className="task-row__title"><Badge tone={task.type === 'test' ? 'warn' : task.type === 'revision' ? 'purple' : task.type === 'mains' ? 'info' : 'neutral'}>{taskIcons[task.type]} {typeLabels[task.type]}</Badge><strong>{task.title}</strong></div>
                      <div className="task-row__meta"><Clock3 size={12} /> {task.minutes} min {task.topicId && <>· <Link to={`/learn/topic/${task.topicId}`}>{topicById(task.topicId)?.name}</Link></>}</div>
                      {task.note && <p>{task.note}</p>}
                    </div>
                    <button className="icon-btn icon-btn--xs" onClick={() => deleteTask(task.id)} aria-label="Delete task"><Trash2 size={14} /></button>
                  </div>
                ))}
                {!dayTasks.length && <EmptyState icon={<CalendarDays size={22} />} title="Nothing scheduled" description="Use this space for free revision, or add a task." action={<Button size="sm" onClick={() => { setDate(selectedDate); setAddOpen(true) }}>Add a task</Button>} />}
              </div>
            </Card>
            <aside className="plan-day__side">
              <Card><h3><Target size={16} /> Daily method</h3><ol className="protocol-list"><li>Study 45 minutes without notifications.</li><li>Close the book and write a one-page recall.</li><li>Do 10 MCQs on the same topic.</li><li>Log one doubt for the mentor.</li></ol></Card>
              <Card><h3><Sparkles size={16} /> Plan rationale</h3><p className="small muted">{data.plan?.rationale ?? 'Regenerate the plan to see the reasoning behind it.'}</p></Card>
              <Card><h3><RotateCcw size={16} /> Due revision</h3>{revisions.filter(r => r.dueDate <= todayISO()).slice(0, 3).map(r => <div key={r.id} className="mini-revision"><span>{r.title}</span><button className="icon-btn icon-btn--xs" onClick={() => completeRevision(r.id)} aria-label="Complete revision"><Check size={13} /></button></div>)}{!revisions.filter(r => r.dueDate <= todayISO()).length && <p className="small muted">Nothing due. Good.</p>}</Card>
            </aside>
          </div>
        </>
      )}

      {tab === 'revision' && (
        <Card className="panel">
          <div className="panel-head"><div><span className="eyebrow">Spaced revision</span><h2>Your revision queue</h2></div><Badge tone="purple">{revisions.length} pending</Badge></div>
          <div className="revision-list">
            {revisions.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.priority - a.priority).map(item => (
              <div key={item.id} className="revision-row">
                <span className={cn('revision-dot', item.dueDate <= todayISO() && 'due')} />
                <div className="revision-row__body">
                  <Link to={`/learn/topic/${item.topicId}`}><strong>{item.title}</strong></Link>
                  <span>{item.reason}</span>
                </div>
                <div className="revision-row__meta"><Badge tone={item.dueDate <= todayISO() ? 'danger' : 'neutral'}>{item.dueDate <= todayISO() ? 'Due' : formatDate(item.dueDate)}</Badge><span className="mono small">P{item.priority}</span></div>
                <Button size="sm" variant="secondary" onClick={() => completeRevision(item.id)}><Check size={14} /> Done</Button>
              </div>
            ))}
            {!revisions.length && <EmptyState icon={<RotateCcw size={22} />} title="No revision queued" description="Mark a topic as learning or take a test to generate spaced reviews." action={<Link to="/learn"><Button size="sm">Open syllabus</Button></Link>} />}
          </div>
        </Card>
      )}

      {tab === 'upcoming' && (
        <div className="upcoming-list">
          {upcoming.map(task => (
            <Card key={task.id} className="upcoming-row">
              <div className="upcoming-row__date"><strong>{new Date(task.date).getDate()}</strong><span>{new Date(task.date).toLocaleDateString('en-IN', { month: 'short' })}</span></div>
              <div><Badge tone="neutral">{typeLabels[task.type]}</Badge><h3>{task.title}</h3><p className="small muted">{task.minutes} min{task.topicId ? ` · ${topicById(task.topicId)?.name}` : ''}</p></div>
              <button className="icon-btn" onClick={() => toggleTask(task.id)} aria-label="Complete task"><Circle size={18} /></button>
            </Card>
          ))}
          {!upcoming.length && <EmptyState icon={<CalendarDays size={22} />} title="No upcoming tasks" description="Your plan may need regenerating or extending." action={<Button onClick={refreshPlan}><RefreshCw size={14} /> Regenerate plan</Button>} />}
        </div>
      )}

      {tab === 'overdue' && (
        <Card className="panel">
          <div className="panel-head"><div><span className="eyebrow">Catch-up</span><h2>Overdue tasks</h2></div><Badge tone="danger">{overdue.length}</Badge></div>
          {overdue.map(task => (
            <div key={task.id} className="task-row">
              <button className="task-check" onClick={() => toggleTask(task.id)} aria-label="Complete"><Circle size={21} /></button>
              <div className="task-row__body"><div className="task-row__title"><Badge tone="danger"><TriangleAlert size={12} /> {formatDate(task.date)}</Badge><strong>{task.title}</strong></div><div className="task-row__meta">{task.minutes} min</div></div>
              <button className="icon-btn icon-btn--xs" onClick={() => deleteTask(task.id)} aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
          {!overdue.length && <EmptyState icon={<CheckCircle2 size={22} />} title="Nothing overdue" description="You are on top of the plan. Keep the buffer." />}
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a study task" description="Keep it small enough to finish today." footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={submitTask}>Add task</Button></>}>
        <div className="stack">
          <Field label="Task title"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Revise monetary policy tools" autoFocus /></Field>
          <div className="form-grid-2">
            <Field label="Type"><Select value={type} onChange={e => setType(e.target.value as Task['type'])}>{Object.entries(typeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field>
            <Field label="Date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          </div>
          <div className="form-grid-2">
            <Field label="Minutes"><Input type="number" min={10} max={300} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></Field>
            <Field label="Topic (optional)"><Select value={topicId} onChange={e => setTopicId(e.target.value)}><option value="">No specific topic</option>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</Select></Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
