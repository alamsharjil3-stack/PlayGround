import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp, BookOpen, BrainCircuit, Check, Copy, FileQuestion, Lightbulb, MessageSquarePlus,
  MoreHorizontal, Pencil, Plus, RotateCcw, Sparkles, SquarePen, Trash2, X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { mentorReply, notesForTopic } from '../services/ai'
import { topicById, topics } from '../data/syllabus'
import type { ChatConversation, ChatMessage } from '../types'
import { uid } from '../lib/id'
import { Markdown } from '../components/Markdown'
import { Badge, Button, EmptyState, IconButton, Input, Modal, Spinner, Textarea } from '../components/ui'
import { cn } from '../lib/cn'
import { formatDate } from '../lib/date'
import { useToast } from '../contexts/ToastContext'

const quickActions = [
  { id: 'explain', label: 'Explain', icon: <Lightbulb size={14} />, prompt: 'Explain this topic clearly' },
  { id: 'teach', label: 'Teach me', icon: <BookOpen size={14} />, prompt: 'Teach me this topic step by step' },
  { id: 'examples', label: 'Give examples', icon: <Sparkles size={14} />, prompt: 'Give examples for this topic' },
  { id: 'questions', label: 'Ask me questions', icon: <FileQuestion size={14} />, prompt: 'Ask me questions to test my understanding' },
  { id: 'quiz', label: 'Quiz me', icon: <BrainCircuit size={14} />, prompt: 'Quiz me' },
  { id: 'pyq', label: 'Give PYQs', icon: <FileQuestion size={14} />, prompt: 'Give PYQs on this topic' },
  { id: 'notes', label: 'Make notes', icon: <SquarePen size={14} />, prompt: 'Make revision notes for this topic' },
  { id: 'revise', label: 'Revise', icon: <RotateCcw size={14} />, prompt: 'Give me a revision plan' },
  { id: 'evaluate', label: 'Evaluate my answer', icon: <Check size={14} />, prompt: 'Evaluate my answer' },
]

const starterPrompts = [
  { title: 'Fundamental Rights', text: 'Teach me Fundamental Rights from the beginning, with PYQ connections.', topic: 't-rights' },
  { title: 'Fiscal deficit', text: 'Explain fiscal deficit, revenue deficit and primary deficit with examples.', topic: 't-fiscal' },
  { title: 'Monetary policy', text: 'Teach me how RBI monetary policy works and how it controls inflation.', topic: 't-monetary' },
  { title: 'Climate change', text: 'Give me a complete UPSC session on climate change and climate finance.', topic: 't-climate' },
]

export function MentorPage() {
  const { data, ready, updateConversation, addConversation, deleteConversation, lang, t } = useApp()
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [contextTopicId, setContextTopicId] = useState<string | undefined>()
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const streamTimer = useRef<number | null>(null)

  const conversations = data?.conversations ?? []
  const active = conversations.find(c => c.id === activeId) ?? null
  const contextTopic = contextTopicId ? topicById(contextTopicId) : undefined

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id)
  }, [conversations, activeId])

  useEffect(() => {
    if (!activeId) setContextTopicId(undefined)
  }, [activeId])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [active?.messages.length, streamText, thinking])

  useEffect(() => () => { if (streamTimer.current) window.clearInterval(streamTimer.current) }, [])

  const history = active?.messages ?? []

  const stream = (full: string) => new Promise<void>(resolve => {
    setStreamText('')
    let i = 0
    const step = Math.max(6, Math.ceil(full.length / 70))
    streamTimer.current = window.setInterval(() => {
      i = Math.min(full.length, i + step)
      setStreamText(full.slice(0, i))
      if (i >= full.length) {
        if (streamTimer.current) window.clearInterval(streamTimer.current)
        streamTimer.current = null
        resolve()
      }
    }, 18)
  })

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || thinking || !data || !user) return
    setInput('')
    setThinking(true)
    try {
      let conv: ChatConversation
      const userMsg: ChatMessage = { id: uid('msg'), role: 'user', content: text, createdAt: new Date().toISOString() }
      if (!active) {
        conv = {
          id: uid('conv'),
          userId: user.id,
          title: text.length > 52 ? `${text.slice(0, 52)}…` : text,
          messages: [userMsg],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contextTopicId,
        }
        addConversation(conv)
        setActiveId(conv.id)
      } else {
        conv = { ...active, messages: [...active.messages, userMsg] }
        updateConversation(active.id, { messages: conv.messages })
      }

      const reply = await mentorReply({
        message: text,
        language: lang,
        profile: user.profile,
        contextTopicId,
        history: conv.messages.slice(0, -1),
        weakTopicIds: Object.values(data.topicProgress).filter(p => p.status === 'learning').map(p => p.topicId),
      })
      await stream(reply)
      const assistantMsg: ChatMessage = {
        id: uid('msg'),
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
        actions: ['Quiz me', 'Give PYQs', 'Make notes', 'Revise'],
      }
      updateConversation(conv.id, { messages: [...conv.messages, assistantMsg], contextTopicId })
      setStreamText('')
    } catch {
      toast('The mentor could not respond. Please retry.', 'error')
      setStreamText('')
    } finally {
      setThinking(false)
    }
  }

  const newChat = () => {
    setActiveId(null)
    setContextTopicId(undefined)
    setInput('')
  }

  const applyQuick = (label: string, prompt: string) => {
    const topicPart = contextTopic ? ` ${contextTopic.name}` : ''
    send(`${prompt}${topicPart}.`)
  }

  const copy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopiedId(msg.id)
      window.setTimeout(() => setCopiedId(null), 1400)
    } catch {
      toast('Copy not available in this browser', 'error')
    }
  }

  if (!ready || !data) return <div className="page"><Spinner label="Opening your mentor" /></div>

  return (
    <div className="mentor page page--flush">
      <aside className="mentor__sidebar">
        <div className="mentor__sidebar-head">
          <div><span className="eyebrow">Mentor</span><h2>Conversations</h2></div>
          <Button size="sm" onClick={newChat}><Plus size={15} /> {t('newChat')}</Button>
        </div>
        <div className="mentor__conv-list">
          {conversations.length === 0 && <p className="muted small">No conversations yet.</p>}
          {conversations.map(conv => (
            <div key={conv.id} className={cn('conv-item', activeId === conv.id && 'conv-item--active')}>
              <button className="conv-item__main" onClick={() => { setActiveId(conv.id); setContextTopicId(conv.contextTopicId) }}>
                <MessageSquarePlus size={15} />
                <span><strong>{conv.title}</strong><small>{formatDate(conv.updatedAt, lang)}</small></span>
              </button>
              <div className="conv-item__menu">
                <IconButton label="Conversation options" onClick={() => setMenuId(menuId === conv.id ? null : conv.id)}><MoreHorizontal size={16} /></IconButton>
                {menuId === conv.id && (
                  <div className="popover conv-popover">
                    <button onClick={() => { setRenameValue(conv.title); setRenameOpen(true); setMenuId(null) }}><Pencil size={14} /> {t('rename')}</button>
                    <button className="danger-text" onClick={() => { setDeleteOpen(true); setMenuId(null) }}><Trash2 size={14} /> {t('deleteChat')}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mentor__sidebar-footer">
          <div className="mentor-context">
            <span className="mentor-context__label"><Sparkles size={13} /> {t('currentContext')}</span>
            {contextTopic ? (
              <div className="mentor-context__chip">
                <span>{lang === 'hi' ? contextTopic.nameHi : contextTopic.name}</span>
                <button onClick={() => setContextTopicId(undefined)} aria-label={t('clearContext')}><X size={12} /></button>
              </div>
            ) : <small>No topic locked. Ask anything from the syllabus.</small>}
          </div>
          <p className="mentor__disclaimer">AI guidance can be imperfect. Verify facts, judgments and schemes against official sources.</p>
        </div>
      </aside>

      <section className="mentor__main">
        <header className="mentor__header">
          <div className="mentor__identity">
            <span className="mentor__avatar"><Sparkles size={18} /></span>
            <div><strong>UPSC Mentor</strong><small>Structured, syllabus-first guidance</small></div>
          </div>
          <div className="mentor__header-actions">
            {contextTopic && <Badge tone="accent">{contextTopic.name}</Badge>}
            <Button size="sm" variant="ghost" onClick={newChat}><Plus size={15} /> New</Button>
          </div>
        </header>

        <div className="mentor__messages" ref={scrollRef} aria-live="polite">
          {!active && (
            <div className="mentor-welcome">
              <span className="mentor-welcome__mark"><Sparkles size={24} /></span>
              <h1>What would you like to understand?</h1>
              <p>I teach to the UPSC syllabus. Ask for a full learning session, a quiz, PYQ connections or a revision plan.</p>
              <div className="starter-grid">
                {starterPrompts.map(p => (
                  <button key={p.title} className="starter-card" onClick={() => { setContextTopicId(p.topic); send(p.text) }}>
                    <BookOpen size={16} />
                    <strong>{p.title}</strong>
                    <small>{p.text}</small>
                  </button>
                ))}
              </div>
              <div className="welcome-prompts">
                {['मूल अधिकार पढ़ाओ', 'Explain fiscal deficit', 'Quiz me on climate change', 'Make notes on the monsoon', 'Give me PYQs on the judiciary'].map(p => (
                  <button key={p} onClick={() => send(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {active?.messages.map(msg => (
            <div key={msg.id} className={cn('chat-msg', `chat-msg--${msg.role}`)}>
              {msg.role === 'assistant' && <span className="chat-msg__avatar"><Sparkles size={14} /></span>}
              <div className="chat-msg__body">
                {msg.role === 'user' ? <p>{msg.content}</p> : <Markdown content={msg.content} />}
                <div className="chat-msg__meta">
                  {msg.role === 'assistant' && (
                    <>
                      <button onClick={() => copy(msg)}>{copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />} {copiedId === msg.id ? 'Copied' : 'Copy'}</button>
                      <span>AI-generated — verify facts</span>
                    </>
                  )}
                </div>
                {msg.role === 'assistant' && msg.actions && (
                  <div className="chat-msg__actions">
                    {msg.actions.map(action => (
                      <button key={action} onClick={() => send(`${action}${contextTopic ? ` on ${contextTopic.name}` : ''}.`)}>{action}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="chat-msg chat-msg--assistant">
              <span className="chat-msg__avatar"><Sparkles size={14} /></span>
              <div className="chat-msg__body">
                {streamText ? <Markdown content={streamText} /> : (
                  <div className="thinking"><span /><span /><span /><small>{t('mentorThinking')}</small></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mentor__composer">
          <div className="quick-actions">
            {quickActions.map(qa => (
              <button key={qa.id} onClick={() => applyQuick(qa.label, qa.prompt)} disabled={thinking}>{qa.icon}{qa.label}</button>
            ))}
          </div>
          <div className="composer-box">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={t('askAnything')}
              rows={2}
              aria-label="Message your UPSC mentor"
            />
            <div className="composer-box__foot">
              <span className="composer-hint">{contextTopic ? `Context: ${contextTopic.name}` : 'Tip: name a topic for a full learning session'}</span>
              <Button size="sm" onClick={() => send()} disabled={!input.trim() || thinking} aria-label={t('send')}><ArrowUp size={16} /> Send</Button>
            </div>
          </div>
        </div>
      </section>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename conversation" footer={<><Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button><Button onClick={() => { if (active) updateConversation(active.id, { title: renameValue }); setRenameOpen(false) }}>Save</Button></>}>
        <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} aria-label="Conversation title" />
      </Modal>
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this conversation?" description="This cannot be undone." footer={<><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { if (active) { deleteConversation(active.id); setActiveId(null) } setDeleteOpen(false) }}>Delete</Button></>}>
        <p className="muted">The conversation and its messages will be removed from this device.</p>
      </Modal>
    </div>
  )
}
