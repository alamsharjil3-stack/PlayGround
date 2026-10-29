import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, ExternalLink, Globe2, Landmark,
  ListChecks, Newspaper, NotebookPen, RotateCcw, Scale, Sparkles, Target, TriangleAlert,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { currentAffairById } from '../data/currentAffairs'
import { paperById, topicById } from '../data/syllabus'
import { questionById } from '../data/questions'
import { Badge, Button, Card, EmptyState, Field, Modal, Textarea } from '../components/ui'
import { todayISO } from '../lib/date'
import { useToast } from '../contexts/ToastContext'

export function CurrentAffairPage() {
  const { affairId } = useParams()
  const { data, toggleBookmark, addNote, addRevision, t, lang } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const ca = affairId ? currentAffairById(affairId) : undefined
  const saved = ca ? data?.bookmarks.includes(ca.id) : false

  if (!ca) {
    return <div className="page"><EmptyState icon={<Newspaper size={24} />} title="Briefing not found" description="This issue brief is not available." action={<Button onClick={() => navigate('/current-affairs')}>Back to current affairs</Button>} /></div>
  }

  const questions = ca.linkedQuestionIds.map(id => questionById(id)).filter(Boolean)

  const addTopicsToRevision = () => {
    const first = ca.linkedTopicIds[0]
    addRevision({ topicId: first, title: ca.title, reason: 'Current affairs linking', dueDate: todayISO(), priority: 80 })
  }

  return (
    <div className="page ca-detail">
      <Link to="/current-affairs" className="back-link"><ArrowLeft size={15} /> Back to current affairs</Link>

      <header className="ca-detail__hero">
        <div className="ca-detail__meta">
          <Badge tone="accent">{ca.category}</Badge>
          <span>{ca.updatedLabel}</span>
          <span className="muted">{ca.sourceName}</span>
        </div>
        <h1>{ca.title}</h1>
        <p>{ca.summary}</p>
        <div className="ca-detail__actions">
          <Button variant="secondary" onClick={() => toggleBookmark(ca.id)}>{saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? 'Bookmarked' : 'Bookmark'}</Button>
          <Button variant="secondary" onClick={() => setNoteOpen(true)}><NotebookPen size={15} /> Add note</Button>
          <Button variant="ghost" onClick={addTopicsToRevision}><RotateCcw size={15} /> Add to revision</Button>
          <Button variant="ghost" onClick={() => navigate(`/mentor?topic=${ca.linkedTopicIds[0]}`)}><Sparkles size={15} /> Ask the mentor</Button>
        </div>
        <div className="ca-detail__papers">
          {ca.gsPaper.map(p => <span key={p} className="chip chip--sm">{paperById(p)?.shortName ?? p}</span>)}
        </div>
      </header>

      <div className="ca-detail__grid">
        <main className="ca-article">
          <Card className="ca-section ca-section--lead">
            <h2><Newspaper size={18} /> {t('whatHappened')}</h2>
            <p>{ca.whatHappened}</p>
          </Card>
          <Card className="ca-section ca-section--accent">
            <h2><Target size={18} /> {t('whyImportant')}</h2>
            <p>{ca.whyImportant}</p>
          </Card>

          <Card className="ca-section">
            <h2>{t('background')}</h2>
            <ul className="ca-list">{ca.background.map(b => <li key={b}>{b}</li>)}</ul>
          </Card>

          <Card className="ca-section">
            <h2><ListChecks size={18} /> {t('prelimsFacts')}</h2>
            <ul className="fact-list">{ca.prelimsFacts.map(f => <li key={f}><span className="fact-dot" />{f}</li>)}</ul>
          </Card>

          <Card className="ca-section">
            <h2>{t('mainsDimensions')}</h2>
            <div className="mains-dimensions">
              {ca.mainsDimensions.map((d, i) => (
                <div key={d.label} className="mains-dimension">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div><strong>{d.label}</strong><p>{d.text}</p></div>
                </div>
              ))}
            </div>
          </Card>

          {ca.constitutionalAngle && (
            <Card className="ca-section">
              <h2><Scale size={18} /> {t('constitutionalAngle')}</h2>
              <p>{ca.constitutionalAngle}</p>
            </Card>
          )}

          <Card className="ca-section">
            <h2><Landmark size={18} /> {t('schemes')}</h2>
            <div className="scheme-chips">{ca.schemes.map(s => <span key={s} className="chip">{s}</span>)}</div>
            {ca.internationalAngle && <><h3><Globe2 size={16} /> {t('internationalAngle')}</h3><p>{ca.internationalAngle}</p></>}
          </Card>

          <div className="ca-two-col">
            <Card className="ca-section">
              <h2><TriangleAlert size={18} /> {t('challenges')}</h2>
              <ul className="ca-list">{ca.challenges.map(c => <li key={c}>{c}</li>)}</ul>
            </Card>
            <Card className="ca-section">
              <h2><ArrowRight size={18} /> {t('wayForward')}</h2>
              <ul className="ca-list">{ca.wayForward.map(w => <li key={w}>{w}</li>)}</ul>
            </Card>
          </div>

          <Card className="ca-section ca-section--questions">
            <h2><Sparkles size={18} /> {t('possibleQuestions')}</h2>
            <div className="possible-questions">
              {ca.questions.map((q, i) => <div key={q}><span>Q{i + 1}</span><p>{q}</p></div>)}
            </div>
            <div className="ca-question-actions">
              <Button size="sm" variant="secondary" onClick={() => navigate('/essay')}>Use in essay lab</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/mains')}>Write a Mains answer</Button>
            </div>
          </Card>
        </main>

        <aside className="ca-detail__side">
          <Card>
            <h3>{t('staticLink')}</h3>
            <div className="static-links">
              {ca.linkedTopicIds.map(id => {
                const topic = topicById(id)
                return topic ? <Link key={id} to={`/learn/topic/${id}`} className="static-link"><span>{lang === 'hi' ? topic.nameHi : topic.name}</span><ArrowRight size={13} /></Link> : null
              })}
            </div>
            <p className="muted small">{t('whyMatters')}</p>
            <p className="small">A current-affairs item becomes useful only when you can connect it to a static concept, a constitutional provision or a policy debate. Use the links above to revise the underlying syllabus.</p>
          </Card>

          <Card>
            <h3>Source & integrity</h3>
            <div className="source-box">
              <span>Primary source</span>
              <strong>{ca.sourceName}</strong>
              <a href={ca.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a>
            </div>
            <p className="muted small">This is an evergreen issue brief for learning. Verify time-sensitive facts and the latest developments against the official source before quoting them in an answer.</p>
          </Card>

          {questions.length > 0 && (
            <Card>
              <h3>Linked practice</h3>
              <div className="linked-questions">
                {questions.map(q => q && (
                  <Link key={q.id} to={`/pyq/${q.id}`}>
                    <Badge tone={q.source.type === 'pyq' ? 'purple' : 'neutral'}>{q.source.type === 'pyq' ? 'PYQ' : 'AI'}</Badge>
                    <span>{q.stem.split('\n')[0].slice(0, 100)}…</span>
                  </Link>
                ))}
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/prelims')}>Take a quiz</Button>
            </Card>
          )}

          <Card>
            <h3>Revision checklist</h3>
            <ul className="checklist">
              <li>One-line fact</li>
              <li>Static concept link</li>
              <li>Constitutional / institutional angle</li>
              <li>One argument and one counter-argument</li>
              <li>One possible question</li>
            </ul>
          </Card>
        </aside>
      </div>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={`Note — ${ca.title}`} footer={<><Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button><Button onClick={() => { if (!note.trim()) return; addNote({ title: `CA note — ${ca.title}`, content: note, tags: ['current affairs', ca.category.toLowerCase()], topicId: ca.linkedTopicIds[0], sourceType: 'current-affairs', sourceId: ca.id }); setNote(''); setNoteOpen(false); toast('Note saved') }}>Save note</Button></>}>
        <Field label="What matters for the exam?"><Textarea rows={6} value={note} onChange={e => setNote(e.target.value)} placeholder="Facts, static link, mains dimension, possible question…" /></Field>
      </Modal>
    </div>
  )
}
