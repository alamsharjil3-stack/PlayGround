import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Layers, Plus, Sparkles, Timer } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { dueCards, reviewCard } from '../lib/srs'
import { todayISO, formatDate } from '../lib/date'
import { uid } from '../lib/id'
import { topics, topicById } from '../data/syllabus'
import { buildLesson, flashcardsFromText } from '../services/ai'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, ProgressBar, Select, Tabs, Textarea } from '../components/ui'
import { cn } from '../lib/cn'
import type { Flashcard } from '../types'
import { useToast } from '../contexts/ToastContext'

const grades = [
  { q: 1 as const, label: 'Again', hint: 'Forgot', cls: 'grade--again' },
  { q: 3 as const, label: 'Hard', hint: 'Struggled', cls: 'grade--hard' },
  { q: 4 as const, label: 'Good', hint: 'Recalled', cls: 'grade--good' },
  { q: 5 as const, label: 'Easy', hint: 'Instant', cls: 'grade--easy' },
]

export function FlashcardsPage() {
  const { data, addFlashcards, updateFlashcard } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('review')
  const [deck, setDeck] = useState('All')
  const [revealed, setRevealed] = useState(false)
  const [index, setIndex] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [newDeck, setNewDeck] = useState('General')
  const [genTopic, setGenTopic] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [query, setQuery] = useState('')

  const cards = data?.flashcards ?? []
  const decks = useMemo(() => ['All', ...Array.from(new Set(cards.map(c => c.deck)))], [cards])
  const pool = useMemo(() => dueCards(cards).filter(c => deck === 'All' || c.deck === deck), [cards, deck])
  const current = pool[index] ?? null
  const learned = cards.filter(c => c.reviews >= 2).length
  const mature = cards.filter(c => c.interval >= 21).length

  const filtered = cards.filter(c => (deck === 'All' || c.deck === deck) && (!query || `${c.front} ${c.back}`.toLowerCase().includes(query.toLowerCase())))

  const grade = (quality: 1 | 3 | 4 | 5) => {
    if (!current) return
    updateFlashcard(reviewCard(current, quality))
    setRevealed(false)
    setIndex(i => Math.min(i, Math.max(0, pool.length - 2)))
    toast(quality < 3 ? 'Card scheduled for tomorrow' : 'Review recorded', 'info')
  }

  const addCard = () => {
    if (!front.trim() || !back.trim() || !user) return
    const card: Flashcard = {
      id: uid('fc'), userId: user.id, front: front.trim(), back: back.trim(), deck: newDeck.trim() || 'General',
      ease: 2.5, interval: 0, due: todayISO(), reviews: 0, lapses: 0, createdAt: new Date().toISOString(),
    }
    addFlashcards([card]); setFront(''); setBack(''); setAddOpen(false)
  }

  const generateDeck = () => {
    if (!user) return
    const selectedTopics = genTopic ? [topics.find(t => t.id === genTopic)!] : topics.filter(t => t.weight === 'high').slice(0, 2)
    const created: Flashcard[] = []
    for (const topic of selectedTopics) {
      const generated = flashcardsFromText(buildLesson(topic), topic.name)
      for (const item of generated.slice(0, 6)) {
        created.push({ ...item, id: uid('fc'), userId: user.id, ease: 2.5, interval: 0, due: todayISO(), reviews: 0, lapses: 0, createdAt: new Date().toISOString(), topicId: topic.id })
      }
    }
    addFlashcards(created)
    setDeck('All')
    setGenOpen(false)
    toast(created.length ? `${created.length} starter cards added` : 'No cards generated', created.length ? 'success' : 'info')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (tab !== 'review' || !current || target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (e.code === 'Space') {
        e.preventDefault()
        setRevealed(v => !v)
        return
      }
      if (!revealed) return
      const match = grades.find(g => g.q === Number(e.key))
      if (match) {
        e.preventDefault()
        grade(match.q)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, current, revealed])

  if (!data) return null

  return (
    <div className="page flashcards-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Active recall</p>
          <h1>Remembering is a practice, not a reread.</h1>
          <p className="page-head__sub">A spaced-repetition deck for facts, definitions and distinctions. Grade honestly — the schedule depends on it.</p>
        </div>
        <div className="page-head__actions"><Button variant="secondary" onClick={() => setAddOpen(true)}><Plus size={15} /> Add card</Button></div>
      </header>

      <div className="flash-stats">
        <Card><strong>{cards.length}</strong><span>Cards</span></Card>
        <Card><strong>{dueCards(cards).length}</strong><span>Due today</span></Card>
        <Card><strong>{learned}</strong><span>Reviewed twice</span></Card>
        <Card><strong>{mature}</strong><span>Mature cards</span></Card>
        <Card><strong>{cards.length ? Math.round((mature / cards.length) * 100) : 0}%</strong><span>Deck maturity</span></Card>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'review', label: 'Review', count: pool.length }, { id: 'browse', label: 'Browse deck', count: cards.length }]} />

      {tab === 'review' && (
        <>
          <div className="flash-toolbar">
            <div className="deck-select"><Layers size={15} /><Select value={deck} onChange={e => { setDeck(e.target.value); setIndex(0); setRevealed(false) }}>{decks.map(d => <option key={d} value={d}>{d}</option>)}</Select></div>
            <div className="flash-progress"><span>{Math.min(index + 1, pool.length)} / {pool.length} due</span><ProgressBar value={pool.length ? ((index) / pool.length) * 100 : 0} hideValue tone="teal" /></div>
            <Button size="sm" variant="ghost" onClick={() => setGenOpen(true)}><Sparkles size={14} /> Generate starter deck</Button>
          </div>

          {current ? (
            <div className="flash-stage">
              <button className={cn('flashcard', revealed && 'revealed')} onClick={() => setRevealed(v => !v)} aria-label={revealed ? 'Hide answer' : 'Reveal answer'}>
                <div className="flashcard__side flashcard__front">
                  <span className="flashcard__label">{current.deck}</span>
                  <p>{current.front}</p>
                  <small>Tap or press Space to reveal</small>
                </div>
                <div className="flashcard__side flashcard__back">
                  <span className="flashcard__label">Answer</span>
                  <p>{current.back}</p>
                  {current.topicId && <small>Linked to {topicById(current.topicId)?.name}</small>}
                </div>
              </button>

              {revealed ? (
                <div className="grade-row">
                  {grades.map(g => <button key={g.q} className={cn('grade-btn', g.cls)} onClick={() => grade(g.q)}><strong>{g.label}</strong><span>{g.hint}</span></button>)}
                </div>
              ) : (
                <Button size="lg" onClick={() => setRevealed(true)}>Reveal answer</Button>
              )}

              <div className="flash-nav">
                <button className="icon-btn" onClick={() => { setIndex(i => Math.max(0, i - 1)); setRevealed(false) }} disabled={index === 0} aria-label="Previous card"><ChevronLeft size={17} /></button>
                <span>Card {index + 1} of {pool.length} · ease {current.ease.toFixed(2)} · {current.reviews} reviews</span>
                <button className="icon-btn" onClick={() => { setIndex(i => Math.min(pool.length - 1, i + 1)); setRevealed(false) }} disabled={index >= pool.length - 1} aria-label="Next card"><ChevronRight size={17} /></button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Check size={26} />}
              title={cards.length ? 'This deck is clear for today' : 'No flashcards yet'}
              description={cards.length ? 'Every due card has been reviewed. Come back tomorrow, or browse the deck and add more.' : 'Create a card manually or generate a starter deck from a high-weight topic.'}
              action={<div className="empty-actions"><Button onClick={() => setAddOpen(true)}><Plus size={15} /> Add card</Button><Button variant="secondary" onClick={() => setGenOpen(true)}><Sparkles size={15} /> Generate starter deck</Button></div>}
            />
          )}

          <div className="srs-explainer">
            <Timer size={17} />
            <div><strong>How the schedule works</strong><p>“Again” brings the card back tomorrow. “Good” and “Easy” push it further out. Honest grading is more useful than a tidy streak.</p></div>
          </div>
        </>
      )}

      {tab === 'browse' && (
        <Card className="panel">
          <div className="notes-toolbar">
            <div className="search-inline"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cards…" aria-label="Search flashcards" /></div>
            <div className="deck-select"><Layers size={15} /><Select value={deck} onChange={e => setDeck(e.target.value)}>{decks.map(d => <option key={d} value={d}>{d}</option>)}</Select></div>
            <Button size="sm" variant="ghost" onClick={() => setGenOpen(true)}><Sparkles size={14} /> Generate deck</Button>
          </div>
          <div className="flash-browse">
            {filtered.map(card => (
              <div key={card.id} className="flash-browse__item">
                <div><Badge tone="neutral">{card.deck}</Badge><strong>{card.front}</strong><p>{card.back}</p></div>
                <div className="flash-browse__meta"><span>Due {card.due <= todayISO() ? 'today' : formatDate(card.due)}</span><span>{card.reviews} reviews</span><span>ease {card.ease.toFixed(2)}</span>{card.lapses > 0 && <span className="text-danger">{card.lapses} lapses</span>}</div>
              </div>
            ))}
            {!filtered.length && <EmptyState icon={<Layers size={22} />} title="No cards found" description="Change the deck or search term, or add a new card." action={<Button onClick={() => setAddOpen(true)}>Add card</Button>} />}
          </div>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a flashcard" description="One idea per card. The front should be a question, not a topic name." footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addCard}>Add card</Button></>}>
        <div className="stack">
          <Field label="Front — the prompt"><Input value={front} onChange={e => setFront(e.target.value)} placeholder="What is the difference between a money bill and a financial bill?" autoFocus /></Field>
          <Field label="Back — the answer"><Textarea rows={5} value={back} onChange={e => setBack(e.target.value)} placeholder="A precise answer in 2–4 lines." /></Field>
          <Field label="Deck"><Input value={newDeck} onChange={e => setNewDeck(e.target.value)} placeholder="Polity" /></Field>
        </div>
      </Modal>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate starter deck" description="Pick a syllabus topic, or let the high-weight defaults do the work. Up to six cards are created from curated lesson notes." footer={<><Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button><Button onClick={generateDeck}><Sparkles size={15} /> Generate deck</Button></>}>
        <Field label="Topic"><Select value={genTopic} onChange={e => setGenTopic(e.target.value)}><option value="">High-weight starter topics</option>{topics.slice(0, 30).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      </Modal>
    </div>
  )
}
