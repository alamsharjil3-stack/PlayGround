import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, MessageSquare, Mic,
  Send, Sparkles, Square, Target, TriangleAlert, UserRound, Users,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { interviewFeedback, interviewOpening, interviewReply } from '../services/ai'
import { uid } from '../lib/id'
import { formatDate } from '../lib/date'
import type { InterviewSession, InterviewTurn } from '../types'
import { Badge, Button, Card, EmptyState, Field, Input, ProgressBar, ProgressRing, Textarea } from '../components/ui'
import { cn } from '../lib/cn'

const blankDaf = { name: '', homeState: '', optional: '', hobbies: '', background: '' }

export function InterviewPage() {
  const { data, addInterview, updateInterview, lang } = useApp()
  const { user } = useAuth()
  const [mode, setMode] = useState<'lobby' | 'room' | 'feedback'>('lobby')
  const [daf, setDaf] = useState({ ...blankDaf, name: user?.profile.name ?? '', optional: user?.profile.optionalSubject ?? '' })
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const sessions = data?.interviews ?? []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [session?.turns.length, thinking])

  const start = () => {
    if (!user || !daf.name.trim()) return
    const fresh: InterviewSession = {
      id: uid('interview'), userId: user.id, daf: { ...daf }, turns: [
        { id: uid('turn'), role: 'board', content: interviewOpening({ daf }), createdAt: new Date().toISOString() },
      ], createdAt: new Date().toISOString(), completed: false,
    }
    addInterview(fresh)
    setSession(fresh)
    setMode('room')
  }

  const send = async () => {
    if (!session || !input.trim() || thinking) return
    const candidate: InterviewTurn = { id: uid('turn'), role: 'candidate', content: input.trim(), createdAt: new Date().toISOString() }
    const withCandidate = { ...session, turns: [...session.turns, candidate] }
    setSession(withCandidate); updateInterview(session.id, { turns: withCandidate.turns }); setInput(''); setThinking(true)
    await new Promise(r => setTimeout(r, 800))
    const board: InterviewTurn = { id: uid('turn'), role: 'board', content: interviewReply(session, withCandidate.turns), createdAt: new Date().toISOString() }
    const complete = { ...withCandidate, turns: [...withCandidate.turns, board] }
    setSession(complete); updateInterview(session.id, { turns: complete.turns }); setThinking(false)
  }

  const end = () => {
    if (!session) return
    const feedback = interviewFeedback(session)
    const complete: InterviewSession = { ...session, feedback, completed: true }
    setSession(complete); updateInterview(session.id, { feedback, completed: true }); setMode('feedback')
  }

  const openSession = (s: InterviewSession) => {
    setSession(s); setMode(s.feedback ? 'feedback' : 'room')
  }

  const restart = () => { setSession(null); setMode('lobby'); setInput('') }

  return (
    <div className="page interview-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Personality test practice</p>
          <h1>The board is not looking for perfection. It is looking for a person.</h1>
          <p className="page-head__sub">A DAF-aware mock board for structure, composure and self-awareness. Practice feedback only — never a prediction.</p>
        </div>
        {mode !== 'lobby' && <Button variant="secondary" onClick={restart}><ArrowLeft size={15} /> Lobby</Button>}
      </header>

      {mode === 'lobby' && (
        <div className="interview-lobby">
          <Card className="daf-card">
            <div className="panel-head"><div><span className="eyebrow">Step 1</span><h2>Your DAF snapshot</h2></div><Badge tone="accent">Practice profile</Badge></div>
            <p className="muted small">The board’s questions will be shaped by these details. Use only information you are comfortable practising with; it stays in this browser.</p>
            <div className="daf-grid">
              <Field label="Name"><Input value={daf.name} onChange={e => setDaf(d => ({ ...d, name: e.target.value }))} placeholder="Your name" /></Field>
              <Field label="Home State"><Input value={daf.homeState} onChange={e => setDaf(d => ({ ...d, homeState: e.target.value }))} placeholder="e.g. Kerala" /></Field>
              <Field label="Optional subject"><Input value={daf.optional} onChange={e => setDaf(d => ({ ...d, optional: e.target.value }))} placeholder="e.g. Sociology" /></Field>
              <Field label="Hobbies"><Input value={daf.hobbies} onChange={e => setDaf(d => ({ ...d, hobbies: e.target.value }))} placeholder="e.g. long-distance running, chess" /></Field>
            </div>
            <Field label="Background / current work"><Textarea rows={3} value={daf.background} onChange={e => setDaf(d => ({ ...d, background: e.target.value }))} placeholder="Education, work experience, home district, anything the board might ask about." /></Field>
            <div className="daf-actions"><Button onClick={start} disabled={!daf.name.trim()}>Enter the board room <ArrowRight size={15} /></Button><span className="small muted"><Clock3 size={13} /> About 10–15 minutes</span></div>
          </Card>

          <div className="interview-side">
            <Card>
              <h3><Users size={16} /> What this simulates</h3>
              <ul className="protocol-list"><li>DAF-based opening and follow-ups</li><li>Ethics, governance and situation questions</li><li>One or two stress-style probes</li><li>Structured feedback on seven dimensions</li></ul>
              <div className="warning-note"><TriangleAlert size={14} /><span>Not a replica of the UPSC board. No AI can assess the human qualities the real interview measures.</span></div>
            </Card>
            <Card>
              <h3><Target size={16} /> Answer frame</h3>
              <ol className="protocol-list"><li><strong>Position:</strong> answer the question in one line.</li><li><strong>Reason:</strong> explain the principle.</li><li><strong>Example:</strong> make it concrete.</li><li><strong>Caveat:</strong> acknowledge the trade-off.</li></ol>
            </Card>
            <Card>
              <h3><MessageSquare size={16} /> Past sessions</h3>
              {sessions.length ? <div className="session-list">{sessions.map(s => <button key={s.id} onClick={() => openSession(s)}><div><strong>{formatDate(s.createdAt, lang)}</strong><span>{s.turns.filter(t => t.role === 'candidate').length} answers</span></div><Badge tone={s.completed ? 'success' : 'warn'}>{s.completed ? 'Reviewed' : 'Incomplete'}</Badge><ChevronRight size={14} /></button>)}</div> : <p className="muted small">No sessions yet. Your first board is waiting.</p>}
            </Card>
          </div>
        </div>
      )}

      {mode === 'room' && session && (
        <div className="board-room">
          <Card className="board-room__header">
            <div className="board-avatar"><Users size={22} /></div>
            <div><span className="eyebrow">Mock board</span><h2>UPSC Personality Test practice</h2><p>{session.daf.name} · {session.daf.homeState || 'Home State'} · {session.daf.optional || 'Optional subject'}</p></div>
            <div className="board-room__actions"><Badge tone="warn">Practice only</Badge><Button size="sm" variant="danger" onClick={end}><Square size={13} /> End interview</Button></div>
          </Card>

          <div className="board-transcript">
            {session.turns.map(turn => (
              <div key={turn.id} className={cn('interview-turn', turn.role === 'candidate' ? 'interview-turn--candidate' : 'interview-turn--board')}>
                <div className="interview-turn__avatar">{turn.role === 'board' ? <Users size={16} /> : <UserRound size={16} />}</div>
                <div className="interview-turn__bubble">
                  <span>{turn.role === 'board' ? 'Board' : 'You'}</span>
                  <p>{turn.content}</p>
                </div>
              </div>
            ))}
            {thinking && <div className="interview-turn interview-turn--board"><div className="interview-turn__avatar"><Users size={16} /></div><div className="interview-turn__bubble"><span>Board</span><p className="thinking-dots"><i /><i /><i /></p></div></div>}
            <div ref={endRef} />
          </div>

          <Card className="board-input">
            <Textarea rows={3} value={input} onChange={e => setInput(e.target.value)} placeholder="Answer aloud first, then type the answer you actually gave. This keeps the practice honest." onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} />
            <div className="board-input__foot"><span className="small muted"><Mic size={13} /> Tip: speak the answer before typing.</span><Button onClick={send} disabled={!input.trim() || thinking}>{thinking ? 'Board is thinking…' : 'Send answer'} <Send size={14} /></Button></div>
          </Card>
        </div>
      )}

      {mode === 'feedback' && session?.feedback && (
        <div className="interview-feedback">
          <Card className="feedback-hero">
            <ProgressRing value={Math.round(session.feedback.dimensions.reduce((s, d) => s + d.score, 0) / (session.feedback.dimensions.length * 10) * 100)} size={124} stroke={9} tone="teal" label="Interview practice score"><strong>{Math.round(session.feedback.dimensions.reduce((s, d) => s + d.score, 0) / session.feedback.dimensions.length * 10)}</strong><small>/ 100</small></ProgressRing>
            <div><Badge tone="warn"><TriangleAlert size={12} /> {session.feedback.verdict}</Badge><h2>Board feedback</h2><p>{session.turns.filter(t => t.role === 'candidate').length} answers · {session.daf.name}</p><div className="feedback-hero__actions"><Button size="sm" variant="secondary" onClick={restart}>New session</Button><Button size="sm" variant="ghost" onClick={() => { setSession(session); setMode('room') }}>Review transcript</Button></div></div>
          </Card>

          <div className="feedback-dimensions">
            {session.feedback.dimensions.map(d => (
              <Card key={d.label} className="panel feedback-dim"><div><strong>{d.label}</strong><span className="mono">{d.score}/10</span></div><ProgressBar value={d.score * 10} hideValue tone={d.score < 5 ? 'danger' : d.score >= 7 ? 'success' : 'accent'} /><p>{d.note}</p></Card>
            ))}
          </div>

          <div className="chart-grid-2">
            <Card className="panel feedback-list"><h3 className="text-success"><CheckCircle2 size={16} /> Strengths</h3><ul>{session.feedback.strengths.map(s => <li key={s}>{s}</li>)}</ul></Card>
            <Card className="panel feedback-list"><h3 className="text-danger"><TriangleAlert size={16} /> Improvements</h3><ul>{session.feedback.improvements.map(s => <li key={s}>{s}</li>)}</ul></Card>
          </div>

          <Card className="interview-disclaimer"><TriangleAlert size={16} /><div><strong>Read this before you take the score seriously</strong><p>{session.feedback.disclaimer}</p></div></Card>

          <Card className="panel">
            <h3>Full transcript</h3>
            <div className="transcript-review">{session.turns.map(turn => <div key={turn.id} className={cn('transcript-line', turn.role === 'candidate' && 'candidate')}><span>{turn.role === 'board' ? 'Board' : 'You'}</span><p>{turn.content}</p></div>)}</div>
          </Card>
        </div>
      )}

      {mode === 'feedback' && session && !session.feedback && <EmptyState icon={<Sparkles size={24} />} title="Session not evaluated" description="Return to the board room and end the interview to generate feedback." action={<Button onClick={() => setMode('room')}>Return to session</Button>} />}
    </div>
  )
}
