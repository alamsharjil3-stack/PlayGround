import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark, BookmarkCheck, Check, Eye, FileText, NotebookPen, Pencil, Plus, Search,
  Tag, Trash2, X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatDate } from '../lib/date'
import { topicById } from '../data/syllabus'
import { questionById } from '../data/questions'
import { currentAffairById } from '../data/currentAffairs'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Textarea } from '../components/ui'
import { Markdown } from '../components/Markdown'
import { cn } from '../lib/cn'
import type { Note } from '../types'

export function NotesPage() {
  const { data, t, lang, addNote, updateNote, deleteNote } = useApp()
  const notes = data?.notes ?? []
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('All')
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [editing, setEditing] = useState(false)
  const [preview, setPreview] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')

  const selected = notes.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) return
    setDraftTitle(selected.title)
    setDraftContent(selected.content)
    setDraftTags(selected.tags.join(', '))
    setEditing(false)
    setPreview(false)
  }, [selected?.id])

  const tags = useMemo(() => ['All', ...Array.from(new Set(notes.flatMap(n => n.tags))).slice(0, 14)], [notes])

  const filtered = useMemo(() => notes.filter(n => {
    if (bookmarkedOnly && !n.bookmarked) return false
    if (tagFilter !== 'All' && !n.tags.includes(tagFilter)) return false
    if (query.trim()) {
      const hay = `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  }), [notes, query, tagFilter, bookmarkedOnly])

  const save = () => {
    if (!selected) return
    updateNote(selected.id, { title: draftTitle.trim() || 'Untitled note', content: draftContent, tags: draftTags.split(',').map(t => t.trim()).filter(Boolean) })
    setEditing(false)
    setPreview(true)
  }

  const create = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    const note = addNote({ title: newTitle.trim(), content: newContent.trim(), tags: newTags.split(',').map(t => t.trim()).filter(Boolean) })
    setSelectedId(note.id); setNewOpen(false); setNewTitle(''); setNewContent(''); setNewTags('')
  }

  const sourceLink = (note: Note) => {
    if (note.sourceType === 'current-affairs' && note.sourceId) return { to: `/current-affairs/${note.sourceId}`, label: currentAffairById(note.sourceId)?.title ?? 'Current affairs briefing' }
    if (note.sourceType === 'pyq' && note.sourceId) return { to: `/pyq/${note.sourceId}`, label: questionById(note.sourceId)?.stem.split('\n')[0] ?? 'Question' }
    if (note.topicId) return { to: `/learn/topic/${note.topicId}`, label: topicById(note.topicId)?.name ?? 'Syllabus topic' }
    return null
  }

  return (
    <div className="page notes-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Notes & recall</p>
          <h1>Your second brain, with a syllabus spine.</h1>
          <p className="page-head__sub">Notes are most useful when they are linked to a topic, a question or an issue — and when you can find them in ten seconds.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus size={16} /> New note</Button>
      </header>

      <div className="notes-toolbar">
        <div className="search-inline"><Search size={16} /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…" aria-label="Search notes" /></div>
        <button className={cn('filter-toggle', bookmarkedOnly && 'active')} onClick={() => setBookmarkedOnly(v => !v)}><Bookmark size={14} /> Bookmarked</button>
      </div>
      <div className="tag-row">
        {tags.map(tag => <button key={tag} className={cn('tag-chip', tagFilter === tag && 'active')} onClick={() => setTagFilter(tag)}><Tag size={11} /> {tag}</button>)}
      </div>

      <div className="notes-layout">
        <aside className="notes-list">
          <div className="notes-list__head"><span>{filtered.length} notes</span><span className="muted">{notes.length} total</span></div>
          {filtered.map(note => (
            <button key={note.id} className={cn('note-item', selectedId === note.id && 'active')} onClick={() => setSelectedId(note.id)}>
              <div className="note-item__top"><span className="note-item__icon"><FileText size={14} /></span><strong>{note.title}</strong>{note.bookmarked && <BookmarkCheck size={13} className="text-accent" />}</div>
              <p>{note.content.replace(/[#*_>`]/g, '').slice(0, 90)}…</p>
              <div className="note-item__meta"><span>{formatDate(note.updatedAt, lang)}</span>{note.tags[0] && <span className="tag-mini">{note.tags[0]}</span>}</div>
            </button>
          ))}
          {!filtered.length && <div className="notes-list__empty"><p>No notes match.</p><Button size="sm" variant="secondary" onClick={() => { setQuery(''); setTagFilter('All'); setBookmarkedOnly(false) }}>Clear filters</Button></div>}
        </aside>

        <main className="note-detail">
          {!selected ? (
            <EmptyState icon={<NotebookPen size={26} />} title="Select or create a note" description="Your notes, revision sheets and answer feedback will live here." action={<Button onClick={() => setNewOpen(true)}><Plus size={15} /> New note</Button>} />
          ) : (
            <>
              <Card className="note-editor">
                <div className="note-editor__head">
                  <div className="note-editor__meta">
                    <Badge tone="neutral">{selected.sourceType.replace('-', ' ')}</Badge>
                    <span>Updated {formatDate(selected.updatedAt, lang)}</span>
                    {sourceLink(selected) && <Link to={sourceLink(selected)!.to} className="text-link">{sourceLink(selected)!.label.slice(0, 50)}</Link>}
                  </div>
                  <div className="note-editor__actions">
                    <Button size="sm" variant="ghost" onClick={() => updateNote(selected.id, { bookmarked: !selected.bookmarked })}>{selected.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {selected.bookmarked ? 'Bookmarked' : 'Bookmark'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}><Trash2 size={15} /> Delete</Button>
                  </div>
                </div>
                {editing ? (
                  <>
                    <Input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} className="note-title-input" aria-label="Note title" />
                    <div className="note-edit-tabs">
                      <button className={cn(!preview && 'active')} onClick={() => setPreview(false)}><Pencil size={13} /> Markdown</button>
                      <button className={cn(preview && 'active')} onClick={() => setPreview(true)}><Eye size={13} /> Preview</button>
                    </div>
                    {preview ? <div className="note-preview"><Markdown content={draftContent} /></div> : <Textarea rows={18} value={draftContent} onChange={e => setDraftContent(e.target.value)} className="note-content-input" aria-label="Note content" />}
                    <Field label="Tags (comma separated)"><Input value={draftTags} onChange={e => setDraftTags(e.target.value)} placeholder="polity, revision, answer-structure" /></Field>
                    <div className="note-editor__footer">
                      <Button variant="ghost" onClick={() => { setEditing(false); setDraftTitle(selected.title); setDraftContent(selected.content); setDraftTags(selected.tags.join(', ')) }}><X size={15} /> Cancel</Button>
                      <Button onClick={save}><Check size={15} /> Save note</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="note-title-row"><h1>{selected.title}</h1><Button size="sm" variant="secondary" onClick={() => { setEditing(true); setPreview(false) }}><Pencil size={14} /> Edit</Button></div>
                    <div className="note-tag-list">{selected.tags.map(tag => <span key={tag} className="tag-mini">{tag}</span>)}</div>
                    <div className="note-body"><Markdown content={selected.content} /></div>
                  </>
                )}
              </Card>
              <Card className="note-recall">
                <div><strong>Turn this note into recall</strong><p>Read it, close it, then write the five most important points from memory. Compare. That gap is your revision.</p></div>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(true); setDraftContent(prev => `${prev}\n\n## Recall test\n- \n- \n- `) }}>Add recall section</Button>
              </Card>
            </>
          )}
        </main>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New note" description="Start with a question, not a heading." footer={<><Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button><Button onClick={create}>Create note</Button></>}>
        <div className="stack">
          <Field label="Title"><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Why the MPC is independent" autoFocus /></Field>
          <Field label="Content" hint="Markdown is supported."><Textarea rows={8} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Key idea, evidence, example, counter-point…" /></Field>
          <Field label="Tags"><Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="economy, mains, revision" /></Field>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this note?" description="This cannot be undone." footer={<><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { if (selected) deleteNote(selected.id); setSelectedId(notes.find(n => n.id !== selectedId)?.id ?? null); setDeleteOpen(false) }}>Delete note</Button></>}>
        <p>“{selected?.title}” will be removed from your workspace.</p>
      </Modal>
    </div>
  )
}
