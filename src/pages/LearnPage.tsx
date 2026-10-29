import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Compass, Layers3, Search, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { papers, subjects, topics, totalTopics } from '../data/syllabus'
import type { PaperId } from '../types'
import { Badge, Button, Card, EmptyState, Input, ProgressBar, ProgressRing, SectionHeader } from '../components/ui'
import { SubjectCard, TopicCard } from '../components/cards'
import { cn } from '../lib/cn'

export function LearnPage() {
  const { data, t, lang } = useApp()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const paperId = (params.get('paper') as PaperId) || 'prelims-gs1'
  const selectedSubject = params.get('subject')
  const paper = papers.find(p => p.id === paperId) ?? papers[0]
  const paperSubjects = subjects.filter(s => s.paperId === paperId)
  const paperTopics = topics.filter(t => t.paperId === paperId)

  const progress = data?.topicProgress ?? {}
  const started = Object.values(progress).filter(p => p.status !== 'not-started').length
  const overall = Math.round((started / totalTopics) * 100)

  const filteredSubjects = useMemo(() => {
    if (!query.trim()) return paperSubjects
    const q = query.toLowerCase()
    return paperSubjects.filter(s =>
      s.name.toLowerCase().includes(q) || s.nameHi.includes(q) || topics.some(t => t.subjectId === s.id && (t.name.toLowerCase().includes(q) || t.nameHi.includes(q))))
  }, [paperSubjects, query])

  const filteredTopics = useMemo(() => {
    const list = selectedSubject ? paperTopics.filter(t => t.subjectId === selectedSubject) : paperTopics
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(t => t.name.toLowerCase().includes(q) || t.nameHi.includes(q) || t.subtopics.some(s => s.toLowerCase().includes(q)))
  }, [paperTopics, selectedSubject, query])

  const currentSubject = subjects.find(s => s.id === selectedSubject)

  const selectPaper = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('paper', id)
    next.delete('subject')
    setParams(next)
  }

  const selectSubject = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('subject', id)
    setParams(next)
    window.setTimeout(() => document.getElementById('topic-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
  }

  return (
    <div className="page learn">
      <header className="page-head">
        <div>
          <p className="eyebrow">Syllabus navigator</p>
          <h1>Learn the syllabus, not a random feed.</h1>
          <p className="page-head__sub">Every topic is a learning session: concept, relevance, facts, PYQ connection, mistakes, revision and practice.</p>
        </div>
        <Card className="syllabus-progress">
          <ProgressRing value={overall} size={72} stroke={6} label="Overall syllabus progress"><strong>{overall}%</strong></ProgressRing>
          <div><strong>{started} of {totalTopics} topics</strong><small>started across all papers</small></div>
        </Card>
      </header>

      <div className="paper-tabs" role="tablist" aria-label="Syllabus papers">
        {papers.map(p => {
          const pTopics = topics.filter(t => t.paperId === p.id)
          const pStarted = pTopics.filter(t => (progress[t.id]?.status ?? 'not-started') !== 'not-started').length
          return (
            <button key={p.id} role="tab" aria-selected={paperId === p.id} className={cn('paper-tab', paperId === p.id && 'paper-tab--active')} onClick={() => selectPaper(p.id)}>
              <span>{p.shortName}</span>
              <small>{pStarted}/{pTopics.length}</small>
            </button>
          )
        })}
      </div>

      <div className="learn__toolbar">
        <div className="search-inline">
          <Search size={16} />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a subject, topic or subtopic…" aria-label="Search syllabus" />
        </div>
        <div className="learn__toolbar-meta">
          <Badge tone="neutral"><Layers3 size={12} /> {paperTopics.length} topics</Badge>
          {selectedSubject && <Button variant="ghost" size="sm" onClick={() => { const next = new URLSearchParams(params); next.delete('subject'); setParams(next) }}>Clear subject</Button>}
        </div>
      </div>

      <section className="learn__paper-head">
        <div>
          <h2>{lang === 'hi' ? paper.nameHi : paper.name}</h2>
          <p>{paper.description}</p>
        </div>
        <span className="learn__paper-code mono">{paper.shortName.toUpperCase()}</span>
      </section>

      {!query && (
        <div className="subject-grid">
          {filteredSubjects.map(subject => {
            const sTopics = topics.filter(t => t.subjectId === subject.id)
            const sStarted = sTopics.filter(t => (progress[t.id]?.status ?? 'not-started') !== 'not-started').length
            const pct = sTopics.length ? Math.round((sStarted / sTopics.length) * 100) : 0
            return <SubjectCard key={subject.id} subject={subject} topicCount={sTopics.length} completed={sStarted} progress={pct} onClick={() => selectSubject(subject.id)} />
          })}
        </div>
      )}

      <section id="topic-list" className="learn__topics">
        <SectionHeader
          eyebrow={currentSubject ? (lang === 'hi' ? currentSubject.nameHi : currentSubject.name) : 'All subjects'}
          title={query ? `Results for “${query}”` : currentSubject ? 'Topics in this subject' : 'Explore high-yield topics'}
          description={currentSubject ? currentSubject.description : 'Start with a subject above, or browse every topic in this paper.'}
          action={<Link to="/study-plan" className="text-link">Add to plan <ArrowRight size={14} /></Link>}
        />
        {filteredTopics.length ? (
          <div className="topic-grid">
            {filteredTopics.map(topic => {
              const p = progress[topic.id]
              const topicPct = p ? (p.status === 'confident' ? 100 : p.status === 'revising' ? 70 : p.status === 'learning' ? 35 : 0) : 0
              return <TopicCard key={topic.id} topic={topic} progress={topicPct} status={p?.status.replace('-', ' ')} />
            })}
          </div>
        ) : (
          <EmptyState icon={<Compass size={24} />} title="No matching topics" description="Try a broader search term or switch to another paper." action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>} />
        )}
      </section>

      <Card className="learn__note">
        <BookOpen size={18} />
        <div>
          <strong>Content is data-driven.</strong>
          <p>Subjects, topics, optional papers, questions and current affairs are stored as structured content. Add new material through the Admin console without rewriting a single page.</p>
        </div>
        <Link to="/pyq" className="text-link">Browse question bank <ArrowRight size={14} /></Link>
      </Card>
    </div>
  )
}
