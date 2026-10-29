import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle2, CircleHelp, ExternalLink,
  Info, Lightbulb, NotebookPen, Sparkles, XCircle,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { questionById, questions } from '../data/questions'
import { currentAffairs } from '../data/currentAffairs'
import { subjectById, topicById } from '../data/syllabus'
import { Badge, Button, Card, EmptyState, Field, Textarea } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

export function QuestionPage() {
  const { questionId } = useParams()
  const { data, toggleBookmark, addNote, t } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const question = questionId ? questionById(questionId) : undefined
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [note, setNote] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)

  if (!question) {
    return <div className="page"><EmptyState icon={<CircleHelp size={24} />} title="Question not found" description="This question may no longer exist in the bank." action={<Button onClick={() => navigate('/pyq')}>Back to PYQ engine</Button>} /></div>
  }

  const subject = subjectById(question.subjectId)
  const topic = topicById(question.topicId)
  const bookmarked = data?.bookmarks.includes(question.id)
  const isPyq = question.source.type === 'pyq'
  const correctIndices = Array.isArray(question.correct) ? question.correct : [question.correct]
  const linkedCa = question.currentAffairsId ? currentAffairs.find(c => c.id === question.currentAffairsId) : currentAffairs.find(c => c.linkedQuestionIds.includes(question.id))
  const similar = questions.filter(q => q.id !== question.id && (q.topicId === question.topicId || q.relatedTopicIds?.includes(question.topicId))).slice(0, 3)
  const relatedNotes = data?.notes.filter(n => n.sourceId === question.id) ?? []

  const isCorrect = selected !== null && correctIndices.includes(selected)

  const aiExplanation = `## AI explanation — ${subject?.name ?? ''}
**The core concept.** ${question.explanation}

### Why the distractors fail
${question.optionRationales.map((r, i) => `- **Option ${String.fromCharCode(65 + i)}:** ${r}`).join('\n')}

### Exam pattern
This is a ${question.difficulty} ${isPyq ? 'curated PYQ record' : 'AI Generated Practice Question'} on **${topic?.name ?? question.topicId}**. The likely trap is treating a partial truth as a complete statement. Break multi-statement questions into one claim at a time.

> ${isPyq ? 'Verify the original question and answer key against the official UPSC paper before treating this as definitive.' : 'This question was generated for practice and is not an official UPSC PYQ.'}`

  return (
    <div className="page question-page">
      <button onClick={() => navigate(-1)} className="back-link"><ArrowLeft size={15} /> Back</button>

      <div className="question-layout">
        <div className="question-main">
          <Card className="question-detail">
            <div className="question-detail__meta">
              <Badge tone={isPyq ? 'purple' : 'neutral'}>{isPyq ? `${question.source.exam} ${question.source.year}` : t('aiPractice')}</Badge>
              <Badge tone={question.difficulty === 'hard' ? 'danger' : question.difficulty === 'medium' ? 'warn' : 'success'}>{question.difficulty}</Badge>
              <span className="muted small">{subject?.name} · {topic?.name}</span>
              <button className="question-bookmark" onClick={() => toggleBookmark(question.id)} aria-label="Bookmark question">
                {bookmarked ? <BookmarkCheck size={18} className="text-accent" /> : <Bookmark size={18} />}
              </button>
            </div>

            <h1 className="question-stem">{question.stem.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</h1>

            <div className="option-list" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, i) => {
                const correct = revealed && correctIndices.includes(i)
                const wrong = revealed && selected === i && !correctIndices.includes(i)
                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={selected === i}
                    className={cn('option', selected === i && 'option--selected', correct && 'option--correct', wrong && 'option--wrong')}
                    onClick={() => { if (!revealed) setSelected(i) }}
                  >
                    <span className="option__key">{String.fromCharCode(65 + i)}</span>
                    <span className="option__text">{option}</span>
                    {correct && <CheckCircle2 size={18} className="option__mark" />}
                    {wrong && <XCircle size={18} className="option__mark" />}
                  </button>
                )
              })}
            </div>

            {!revealed ? (
              <div className="question-detail__actions">
                <Button onClick={() => setRevealed(true)} disabled={selected === null}>Check answer</Button>
                <Button variant="ghost" onClick={() => { setRevealed(true); setSelected(null) }}>Reveal without answering</Button>
              </div>
            ) : (
              <div className={cn('result-banner', isCorrect ? 'result-banner--correct' : 'result-banner--wrong')}>
                {isCorrect ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
                <div>
                  <strong>{selected === null ? 'Answer revealed' : isCorrect ? 'Correct' : 'Not quite'}</strong>
                  <p>Correct answer: {correctIndices.map(i => String.fromCharCode(65 + i)).join(', ')}</p>
                </div>
              </div>
            )}
          </Card>

          {revealed && (
            <>
              <Card className="explanation-card">
                <div className="panel-head"><h2><Lightbulb size={18} /> Detailed explanation</h2><Badge tone="success">Answer {correctIndices.map(i => String.fromCharCode(65 + i)).join(', ')}</Badge></div>
                <p>{question.explanation}</p>
                <h3>{t('whyOthersWrong')}</h3>
                <div className="rationale-list">
                  {question.optionRationales.map((r, i) => (
                    <div key={i} className={cn('rationale', correctIndices.includes(i) && 'rationale--correct')}>
                      <span>{String.fromCharCode(65 + i)}</span>
                      <p>{r}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="explanation-card">
                <div className="panel-head"><h2><Sparkles size={18} /> AI explanation</h2><Badge tone="accent">Structured</Badge></div>
                <Markdown content={aiExplanation} />
                {isPyq && (
                  <div className="source-line">
                    <Info size={14} />
                    <span>Source: {question.source.sourceName ?? 'Curated record'} · confidence: {question.source.confidence ?? 'curated-demo'}. Verify with the official UPSC paper.</span>
                    {question.source.sourceUrl && <a href={question.source.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a>}
                  </div>
                )}
              </Card>
            </>
          )}

          <Card className="question-note">
            <div className="panel-head">
              <h2><NotebookPen size={17} /> My note on this question</h2>
              <Button size="sm" variant="ghost" onClick={() => setNoteOpen(v => !v)}>{noteOpen ? 'Hide' : 'Add note'}</Button>
            </div>
            {relatedNotes.length > 0 && relatedNotes.map(n => <p key={n.id} className="muted small">{n.content.slice(0, 180)}</p>)}
            {noteOpen && (
              <>
                <Field label="What is the trap? What will you remember?">
                  <Textarea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Write a short note linked to this question…" />
                </Field>
                <Button size="sm" onClick={() => {
                  if (!note.trim()) return
                  addNote({ title: `PYQ note — ${subject?.name ?? 'Question'}`, content: note, tags: [subject?.name.toLowerCase() ?? 'pyq', question.difficulty], topicId: question.topicId, subjectId: question.subjectId, sourceType: 'pyq', sourceId: question.id })
                  setNote(''); setNoteOpen(false); toast('Note saved')
                }}>Save note</Button>
              </>
            )}
          </Card>
        </div>

        <aside className="question-side">
          <Card>
            <h3>{t('relevantSyllabus')}</h3>
            <Link to={`/learn/topic/${question.topicId}`} className="side-topic">
              <strong>{topic?.name}</strong><small>{subject?.name} · {topic?.subtopics.slice(0, 3).join(', ')}</small><ArrowRight size={14} />
            </Link>
            <div className="side-tags">{question.tags.map(tag => <span key={tag} className="chip chip--sm">{tag}</span>)}</div>
          </Card>

          {linkedCa && (
            <Card>
              <h3>{t('currentAffairsLink')}</h3>
              <Link to={`/current-affairs/${linkedCa.id}`} className="side-ca">
                <Badge tone="info">{linkedCa.category}</Badge>
                <strong>{linkedCa.title}</strong>
                <small>{linkedCa.summary.slice(0, 110)}…</small>
              </Link>
            </Card>
          )}

          <Card>
            <h3>{t('relatedConcepts')}</h3>
            <div className="related-concepts">
              {topic?.subtopics.map(s => <span key={s} className="chip chip--sm">{s}</span>)}
              {question.relatedTopicIds?.map(id => {
                const rt = topicById(id)
                return rt ? <Link key={id} to={`/learn/topic/${id}`} className="chip chip--sm chip--link">{rt.name}</Link> : null
              })}
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/mentor?topic=${question.topicId}`)}><Sparkles size={14} /> Ask the mentor</Button>
          </Card>

          <Card>
            <h3>{t('similarQuestions')}</h3>
            <div className="similar-list">
              {similar.map(q => (
                <Link key={q.id} to={`/pyq/${q.id}`}>
                  <Badge tone={q.source.type === 'pyq' ? 'purple' : 'neutral'}>{q.source.type === 'pyq' ? 'PYQ' : 'AI'}</Badge>
                  <span>{q.stem.split('\n')[0].slice(0, 90)}…</span>
                </Link>
              ))}
              {!similar.length && <p className="muted small">No related questions in the bank yet.</p>}
            </div>
          </Card>

          <Card>
            <h3>Practice next</h3>
            <div className="practice-next">
              <Button size="sm" onClick={() => navigate(`/prelims?type=topic&topic=${question.topicId}`)}>Topic test</Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/pyq')}>Browse PYQs</Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
