import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookmarkCheck, CalendarDays, CheckCircle2, Clock3, Newspaper, RotateCcw, Search, Sparkles } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { currentAffairs } from '../data/currentAffairs'
import { paperById, topicName } from '../data/syllabus'
import { Badge, Button, Card, EmptyState, Input, SectionHeader, Tabs } from '../components/ui'
import { cn } from '../lib/cn'

const categories = ['All', 'Polity', 'Economy', 'Environment', 'IR', 'Science & Tech', 'Governance', 'Society'] as const

export function CurrentAffairsPage() {
  const { data, t, toggleBookmark, addRevision } = useApp()
  const [tab, setTab] = useState('read')
  const [category, setCategory] = useState<string>('All')
  const [query, setQuery] = useState('')
  const bookmarks = data?.bookmarks ?? []

  const filtered = useMemo(() => currentAffairs.filter(c => {
    if (category !== 'All' && c.category !== category) return false
    if (query.trim() && !`${c.title} ${c.summary} ${c.category}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  }), [category, query])

  const featured = currentAffairs[0]

  return (
    <div className="page ca-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Current affairs studio</p>
          <h1>News, converted into syllabus-linked learning.</h1>
          <p className="page-head__sub">Each briefing gives you the facts, the static link, the Mains dimensions and the questions an examiner could ask.</p>
        </div>
        <div className="ca-head-stats">
          <div><Clock3 size={15} /><span>Daily · weekly · monthly revision</span></div>
          <div><Newspaper size={15} /><span>{currentAffairs.length} curated issue briefs</span></div>
        </div>
      </header>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'read', label: 'Read' }, { id: 'revise', label: 'Revise' }]} />

      {tab === 'read' && (
        <>
          <Link to={`/current-affairs/${featured.id}`} className="ca-featured">
            <div className="ca-featured__content">
              <div className="ca-featured__meta"><Badge tone="accent">Featured briefing</Badge><Badge tone="neutral">{featured.category}</Badge><span>{featured.updatedLabel}</span></div>
              <h2>{featured.title}</h2>
              <p>{featured.summary}</p>
              <div className="ca-featured__papers">{featured.gsPaper.map(p => <span key={p}>{paperById(p)?.shortName ?? p}</span>)}</div>
              <span className="text-link">Open the full briefing <ArrowRight size={14} /></span>
            </div>
            <div className="ca-featured__visual" aria-hidden="true">
              <span>UPSC</span>
              <strong>ISSUE<br />BRIEF</strong>
              <small>Facts · Static link · Mains dimensions</small>
            </div>
          </Link>

          <div className="ca-toolbar">
            <div className="search-inline"><Search size={16} /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search current affairs…" aria-label="Search current affairs" /></div>
            <div className="ca-categories">
              {categories.map(c => <button key={c} className={cn(category === c && 'active')} onClick={() => setCategory(c)}>{c}</button>)}
            </div>
          </div>

          <div className="ca-grid">
            {filtered.map(ca => {
              const saved = bookmarks.includes(ca.id)
              return (
                <Card key={ca.id} className="ca-card">
                  <div className="ca-card__top">
                    <Badge tone={ca.category === 'Polity' ? 'info' : ca.category === 'Economy' ? 'success' : ca.category === 'Environment' ? 'warn' : 'neutral'}>{ca.category}</Badge>
                    <button className="icon-btn icon-btn--xs" onClick={() => toggleBookmark(ca.id)} aria-label={saved ? 'Remove bookmark' : 'Bookmark'}>
                      {saved ? <BookmarkCheck size={16} className="text-accent" /> : <Bookmark size={16} />}
                    </button>
                  </div>
                  <Link to={`/current-affairs/${ca.id}`}><h3>{ca.title}</h3></Link>
                  <p>{ca.summary}</p>
                  <div className="ca-card__papers">{ca.gsPaper.map(p => <span key={p}>{paperById(p)?.shortName ?? p}</span>)}</div>
                  <div className="ca-card__foot">
                    <span className="muted small">{ca.sourceName}</span>
                    <Link to={`/current-affairs/${ca.id}`} className="text-link">Read <ArrowRight size={13} /></Link>
                  </div>
                </Card>
              )
            })}
          </div>
          {!filtered.length && <EmptyState icon={<Newspaper size={24} />} title="No briefings match" description="Try another category or a broader search." action={<Button variant="secondary" onClick={() => { setCategory('All'); setQuery('') }}>Reset</Button>} />}
        </>
      )}

      {tab === 'revise' && (
        <div className="ca-revise">
          <div className="revision-cards">
            {[
              { label: 'Daily', icon: <Clock3 size={18} />, text: 'Three issues, five facts each, one possible question.', count: 3, tone: 'accent' },
              { label: 'Weekly', icon: <CalendarDays size={18} />, text: 'A comparative revision of the week’s governance, economy and environment threads.', count: 5, tone: 'teal' },
              { label: 'Monthly', icon: <RotateCcw size={18} />, text: 'A cumulative checklist linked to static syllabus topics and Mains dimensions.', count: currentAffairs.length, tone: 'indigo' },
            ].map(card => (
              <Card key={card.label} className={cn('revision-mode', `tone-border-${card.tone}`)}>
                <span className={cn('mini-stat__icon', `tone-bg-${card.tone}`)}>{card.icon}</span>
                <h3>{card.label} revision</h3>
                <p>{card.text}</p>
                <div className="revision-mode__count"><strong>{card.count}</strong><span>briefings</span></div>
                <Button size="sm" variant="secondary" onClick={() => { const first = currentAffairs[0]; if (first) addRevision({ topicId: first.linkedTopicIds[0], title: first.title, reason: `${card.label} current-affairs revision`, dueDate: new Date().toISOString().slice(0, 10), priority: 75 }) }}>Add to revision queue</Button>
              </Card>
            ))}
          </div>

          <Card className="panel">
            <SectionHeader eyebrow="Revision desk" title="This week’s static links" description="Read the issue, then connect it to the syllabus topic. That is the skill UPSC tests." />
            <div className="revise-list">
              {currentAffairs.map(ca => (
                <div key={ca.id} className="revise-row">
                  <span className="revise-row__dot" />
                  <div className="revise-row__main">
                    <Link to={`/current-affairs/${ca.id}`}><strong>{ca.title}</strong></Link>
                    <small>{ca.linkedTopicIds.slice(0, 3).map(id => topicName(id)).join(' · ')}</small>
                  </div>
                  <Badge tone="neutral">{ca.category}</Badge>
                  <Link to={`/current-affairs/${ca.id}`} className="icon-btn" aria-label="Open briefing"><ArrowRight size={15} /></Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="revise-questions">
            <div className="revise-questions__head"><Sparkles size={18} /><h3>Rapid revision prompts</h3></div>
            <div className="prompt-grid">
              {currentAffairs.slice(0, 6).map((ca, i) => (
                <div key={ca.id} className="prompt-card"><span>{String(i + 1).padStart(2, '0')}</span><p>{ca.questions[0]}</p><small>{paperById(ca.gsPaper[ca.gsPaper.length - 1])?.shortName}</small></div>
              ))}
            </div>
          </Card>

          <Card className="ca-method">
            <CheckCircle2 size={18} />
            <div><strong>The current-affairs method</strong><p>For every issue: write the fact in one line, the static concept in one line, one constitutional or institutional angle, one main argument and one counter-argument. Then convert it into a possible question. Five lines per issue is enough.</p></div>
          </Card>
        </div>
      )}
    </div>
  )
}
