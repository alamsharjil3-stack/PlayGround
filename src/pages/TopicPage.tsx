import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, CalendarPlus, CheckCircle2, Clock3, FileText, Layers3, NotebookPen, Sparkles, Target } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { paperById, subjectById, topicById } from '../data/syllabus'
import { questionsForTopic } from '../data/questions'
import { currentAffairsForTopic } from '../data/currentAffairs'
import { buildLesson, notesForTopic } from '../services/ai'
import { Badge, Button, Card, EmptyState, Field, Modal, ProgressBar, Tabs, Textarea } from '../components/ui'
import { QuestionListCard } from '../components/cards'
import { Markdown } from '../components/Markdown'
import { todayISO } from '../lib/date'
import { useToast } from '../contexts/ToastContext'
import { cn } from '../lib/cn'

export function TopicPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { data, lang, t, markTopic, addRevision, addTask, addNote, logStudy } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('lesson')
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const topic = topicId ? topicById(topicId) : undefined
  const subject = topic ? subjectById(topic.subjectId) : undefined
  const paper = topic ? paperById(topic.paperId) : undefined
  const progress = topic ? data?.topicProgress[topic.id] : undefined
  const topicQuestions = topic ? questionsForTopic(topic.id) : []
  const linkedCa = topic ? currentAffairsForTopic(topic.id) : []
  const notes = data?.notes.filter(n => n.topicId === topicId) ?? []

  const lesson = useMemo(() => topic ? buildLesson(topic, lang, user?.profile.level ?? 'beginner') : '', [topic, lang, user?.profile.level])

  if (!topic || !subject) {
    return <div className="page"><EmptyState icon={<BookOpen size={24} />} title="Topic not found" description="This topic may have been removed from the syllabus." action={<Button onClick={() => navigate('/learn')}>Back to syllabus</Button>} /></div>
  }

  const status = progress?.status ?? 'not-started'
  const pct = status === 'confident' ? 100 : status === 'revising' ? 70 : status === 'learning' ? 35 : 0

  const addToPlan = () => {
    addTask({ title: `Deep study — ${topic.name}`, date: todayISO(), type: 'study', minutes: 45, topicId: topic.id, subjectId: topic.subjectId, note: 'Generated from the topic page' })
  }

  const saveLessonNote = () => {
    addNote({
      title: `Revision notes — ${topic.name}`,
      content: notesForTopic(topic),
      tags: [subject.name.toLowerCase(), ...topic.subtopics.slice(0, 2).map(s => s.toLowerCase())],
      topicId: topic.id,
      subjectId: topic.subjectId,
      sourceType: 'topic',
    })
  }

  const openMentor = () => navigate(`/mentor?topic=${topic.id}`)

  return (
    <div className="page topic-page">
      <Link to={`/learn?paper=${topic.paperId}&subject=${topic.subjectId}`} className="back-link"><ArrowLeft size={15} /> Back to {subject.name}</Link>

      <header className="topic-hero">
        <div className="topic-hero__main">
          <div className="topic-hero__meta">
            <Badge tone="info">{paper?.shortName}</Badge>
            <Badge tone={topic.weight === 'high' ? 'accent' : 'neutral'}>{topic.weight} weight</Badge>
            <Badge tone={status === 'confident' ? 'success' : status === 'learning' ? 'warn' : status === 'revising' ? 'info' : 'neutral'}>{status.replace('-', ' ')}</Badge>
          </div>
          <h1>{lang === 'hi' ? topic.nameHi : topic.name}</h1>
          <p>{topic.description}</p>
          <div className="topic-hero__actions">
            <Button onClick={openMentor}><Sparkles size={16} /> Learn with AI mentor</Button>
            <Button variant="secondary" onClick={() => markTopic(topic.id, 'revising', 0)}><BookOpen size={16} /> Mark studying</Button>
            <Button variant="ghost" onClick={addToPlan}><CalendarPlus size={16} /> Add to plan</Button>
            <Button variant="ghost" onClick={() => addRevision({ topicId: topic.id, title: topic.name, reason: 'Added from the syllabus', dueDate: todayISO(), priority: 70 })}><Clock3 size={16} /> Revision queue</Button>
          </div>
        </div>
        <Card className="topic-hero__side">
          <div className="topic-progress-row">
            <span>Topic progress</span><strong className="mono">{pct}%</strong>
          </div>
          <ProgressBar value={pct} hideValue />
          <div className="topic-status-grid">
            {(['learning', 'revising', 'confident'] as const).map(s => (
              <button key={s} className={cn('status-btn', status === s && 'status-btn--active')} onClick={() => { markTopic(topic.id, s, s === 'confident' ? 5 : 0); toast(`Marked as ${s}`, 'success') }}>
                {s === 'learning' ? <BookOpen size={13} /> : s === 'revising' ? <Clock3 size={13} /> : <CheckCircle2 size={13} />} {s}
              </button>
            ))}
          </div>
          <div className="topic-stat">
            <span><Layers3 size={14} /> Subtopics</span><strong>{topic.subtopics.length}</strong>
          </div>
          <div className="topic-stat">
            <span><Target size={14} /> Practice questions</span><strong>{topicQuestions.length}</strong>
          </div>
          <div className="topic-stat">
            <span><FileText size={14} /> Studied</span><strong>{progress?.minutes ?? 0} min</strong>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { logStudy(25, topic.id); toast('25 minutes logged') }}>Log 25 min</Button>
        </Card>
      </header>

      <div className="topic-subtopics">
        {topic.subtopics.map(s => <span key={s} className="chip">{s}</span>)}
      </div>

      <Tabs
        className="topic-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'lesson', label: 'Learning session' },
          { id: 'practice', label: 'Practice', count: topicQuestions.length },
          { id: 'affairs', label: 'Current affairs', count: linkedCa.length },
          { id: 'notes', label: 'My notes', count: notes.length },
        ]}
      />

      {tab === 'lesson' && (
        <div className="lesson-layout">
          <Card className="lesson-content">
            <div className="lesson-content__head">
              <span className="eyebrow">AI teacher · structured session</span>
              <div>
                <Button size="sm" variant="secondary" onClick={saveLessonNote}><NotebookPen size={14} /> Save as revision note</Button>
                <Button size="sm" variant="ghost" onClick={openMentor}><BrainCircuit size={14} /> Ask a follow-up</Button>
              </div>
            </div>
            <Markdown content={lesson} />
          </Card>
          <aside className="lesson-aside">
            <Card>
              <h3>Session map</h3>
              <ol className="session-map">
                {['Concept introduction', 'Simple explanation', 'UPSC relevance', 'Important facts', 'Example', 'PYQ connection', 'Common mistakes', 'Quick revision', 'Practice question', 'Progressive depth'].map((s, i) => (
                  <li key={s}><span>{String(i + 1).padStart(2, '0')}</span>{s}</li>
                ))}
              </ol>
            </Card>
            <Card className="lesson-aside__action">
              <h3>Turn this into practice</h3>
              <p>Answer the topic quiz, then write a 150-word Mains answer using the same concept.</p>
              <Button size="sm" variant="secondary" onClick={() => navigate('/prelims?type=topic&topic=' + topic.id)}>Topic quiz</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/mains?topic=' + topic.id)}>Write an answer</Button>
            </Card>
          </aside>
        </div>
      )}

      {tab === 'practice' && (
        <div className="stack">
          {topicQuestions.length ? topicQuestions.map(q => <QuestionListCard key={q.id} question={q} />) : (
            <EmptyState icon={<Target size={24} />} title="No practice questions yet" description="This topic has no questions in the bank. Add them through the Admin console or ask the mentor for a practice set." action={<Button onClick={openMentor}>Ask for practice questions</Button>} />
          )}
        </div>
      )}

      {tab === 'affairs' && (
        <div className="stack">
          {linkedCa.length ? linkedCa.map(ca => (
            <Card key={ca.id} className="linked-ca">
              <div><Badge tone="info">{ca.category}</Badge><h3>{ca.title}</h3><p>{ca.summary}</p></div>
              <Link to={`/current-affairs/${ca.id}`} className="text-link">Open briefing <ArrowRight size={14} /></Link>
            </Card>
          )) : <EmptyState icon={<FileText size={24} />} title="No linked current affairs" description="Relevant briefings will appear here as the content library grows." />}
        </div>
      )}

      {tab === 'notes' && (
        <div className="stack">
          <div className="section-head">
            <div><h2>Notes on this topic</h2><p>Link personal notes to the syllabus so revision stays organised.</p></div>
            <Button size="sm" onClick={() => { setNoteText(''); setNoteOpen(true) }}><NotebookPen size={15} /> Add a note</Button>
          </div>
          {notes.length ? notes.map(note => (
            <Card key={note.id} className="note-preview">
              <div><strong>{note.title}</strong><small>{note.tags.join(' · ')}</small></div>
              <p>{note.content.slice(0, 240)}{note.content.length > 240 ? '…' : ''}</p>
              <Link to={`/notes?note=${note.id}`} className="text-link">Open note <ArrowRight size={14} /></Link>
            </Card>
          )) : <EmptyState icon={<NotebookPen size={24} />} title="No notes on this topic" description="Write a short recall note after studying. It makes revision far more effective." action={<Button onClick={() => setNoteOpen(true)}>Write the first note</Button>} />}
        </div>
      )}

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={`Add a note — ${topic.name}`}
        footer={<><Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button><Button onClick={() => { if (!noteText.trim()) return; addNote({ title: `Note — ${topic.name}`, content: noteText, tags: [subject.name.toLowerCase()], topicId: topic.id, subjectId: topic.subjectId }); setNoteOpen(false) }}>Save note</Button></>}
      >
        <Field label="Your note"><Textarea rows={6} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What did you learn? What do you keep forgetting?" /></Field>
      </Modal>
    </div>
  )
}
