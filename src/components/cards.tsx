import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ChevronRight, Clock3, Layers3 } from 'lucide-react'
import type { MCQQuestion, Subject, Topic } from '../types'
import { useApp } from '../contexts/AppContext'
import { Badge, Card, IconButton, ProgressBar } from './ui'
import { subjectName } from '../data/syllabus'

export function TopicCard({ topic, progress = 0, status }: { topic: Topic; progress?: number; status?: string }) {
  const { lang, t } = useApp()
  return (
    <Link to={`/learn/topic/${topic.id}`} className="topic-card card">
      <div className="topic-card__top">
        <Badge tone={topic.weight === 'high' ? 'accent' : topic.weight === 'medium' ? 'info' : 'neutral'}>{topic.weight}</Badge>
        {status && status !== 'not-started' && <Badge tone={status === 'confident' ? 'success' : 'warn'}>{status}</Badge>}
      </div>
      <h3>{lang === 'hi' ? topic.nameHi : topic.name}</h3>
      <p>{subjectName(topic.subjectId, lang)} · {topic.subtopics.slice(0, 2).join(' · ')}</p>
      <ProgressBar value={progress} hideValue label={`${progress}%`} tone={progress > 66 ? 'success' : topic.weight === 'high' ? 'accent' : 'info'} />
      <span className="topic-card__link">{t('startLearning')} <ChevronRight size={14} /></span>
    </Link>
  )
}

export function SubjectCard({ subject, topicCount, completed, progress, onClick }: { subject: Subject; topicCount: number; completed: number; progress: number; onClick?: () => void }) {
  const { lang } = useApp()
  return (
    <button type="button" className="subject-card card" onClick={onClick} style={{ '--subject-color': subject.color } as React.CSSProperties}>
      <span className="subject-card__dot" />
      <div className="subject-card__body">
        <div className="subject-card__head">
          <h3>{lang === 'hi' ? subject.nameHi : subject.name}</h3>
          <span className="mono subject-card__pct">{progress}%</span>
        </div>
        <p>{topicCount} topics · {completed} started</p>
        <ProgressBar value={progress} hideValue label="" tone={subject.color.includes('#') ? 'info' : 'info'} />
      </div>
      <ChevronRight size={16} className="subject-card__arrow" />
    </button>
  )
}

export function QuestionListCard({ question }: { question: MCQQuestion }) {
  const { data, toggleBookmark, t } = useApp()
  const bookmarked = data?.bookmarks.includes(question.id)
  const isPyq = question.source.type === 'pyq'
  return (
    <Card className="question-card">
      <div className="question-card__meta">
        <Badge tone={isPyq ? 'purple' : 'neutral'}>{isPyq ? `PYQ · ${question.source.year}` : t('aiPractice')}</Badge>
        <Badge tone={question.difficulty === 'hard' ? 'danger' : question.difficulty === 'medium' ? 'warn' : 'success'}>{question.difficulty}</Badge>
        <span className="question-card__subject">{subjectName(question.subjectId)}</span>
      </div>
      <Link to={`/pyq/${question.id}`} className="question-card__stem">{question.stem.split('\n')[0]}</Link>
      <div className="question-card__footer">
        <span className="muted"><Layers3 size={14} /> {question.tags.slice(0, 2).join(' · ')}</span>
        <IconButton label={bookmarked ? 'Remove bookmark' : 'Bookmark question'} onClick={() => toggleBookmark(question.id)}>
          {bookmarked ? <BookmarkCheck size={17} className="text-accent" /> : <Bookmark size={17} />}
        </IconButton>
      </div>
    </Card>
  )
}

export function MetaLine({ date, minutes, type }: { date?: string; minutes?: number; type?: string }) {
  return (
    <span className="meta-line">
      {type && <Badge tone="neutral">{type}</Badge>}
      {minutes ? <span><Clock3 size={13} /> {minutes} min</span> : null}
      {date ? <span>{date}</span> : null}
    </span>
  )
}
