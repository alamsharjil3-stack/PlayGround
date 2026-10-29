import { useMemo, useState } from 'react'
import {
  Check, Download, KeyRound, Languages, Lock, Moon, Palette, ShieldCheck, Sparkles,
  Sun, Trash2, TriangleAlert, UserRound,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { subjects } from '../data/syllabus'
import type { Stage } from '../types'
import { Badge, Button, Card, Field, Input, Modal, Segmented, Select } from '../components/ui'
import { cn } from '../lib/cn'
import { useToast } from '../contexts/ToastContext'

const optionalSubjects = ['Anthropology', 'Sociology', 'Political Science & IR', 'Public Administration', 'Geography', 'History', 'Economics', 'Philosophy', 'Law', 'Literature', 'Mathematics', 'Psychology']

export function SettingsPage() {
  const { data, theme, setTheme, lang, setLanguage, resetWorkspace, t } = useApp()
  const { user, updateProfile, changePassword, isAdmin } = useAuth()
  const { toast } = useToast()
  const profile = user?.profile
  const [name, setName] = useState(profile?.name ?? '')
  const [attempt, setAttempt] = useState(profile?.attempt ?? '')
  const [targetYear, setTargetYear] = useState(profile?.targetYear ?? '2027')
  const [stage, setStage] = useState<Stage>(profile?.stagePriority ?? 'prelims')
  const [level, setLevel] = useState(profile?.level ?? 'beginner')
  const [dailyHours, setDailyHours] = useState(profile?.dailyHours ?? 6)
  const [optionalSubject, setOptionalSubject] = useState(profile?.optionalSubject ?? '')
  const [examDate, setExamDate] = useState(profile?.examDate ?? '')
  const [strong, setStrong] = useState<string[]>(profile?.strongSubjects ?? [])
  const [weak, setWeak] = useState<string[]>(profile?.weakSubjects ?? [])
  const [resetOpen, setResetOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  const proxyConfigured = Boolean(import.meta.env.VITE_AI_PROXY_URL)

  const mainsSubjects = useMemo(() => subjects.filter(s => s.paperId.startsWith('mains') && !s.id.includes('optional')), [])

  const toggleSubject = (id: string, kind: 'strong' | 'weak') => {
    if (kind === 'strong') {
      setStrong(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
      setWeak(prev => prev.filter(x => x !== id))
    } else {
      setWeak(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
      setStrong(prev => prev.filter(x => x !== id))
    }
  }

  const saveProfile = () => {
    if (!name.trim()) { toast('Name cannot be empty', 'error'); return }
    updateProfile({
      name: name.trim(), attempt, targetYear, stagePriority: stage, level, dailyHours: Math.min(16, Math.max(1, dailyHours)),
      optionalSubject, examDate, strongSubjects: strong, weakSubjects: weak,
    })
    toast('Profile updated')
  }

  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), user: { email: user?.email, role: user?.role, profile }, data }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `upsc-mentor-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Workspace exported')
  }

  const submitPassword = async () => {
    setPasswordError('')
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return }
    setPasswordBusy(true)
    const result = await changePassword(currentPassword, newPassword)
    setPasswordBusy(false)
    if (!result.ok) { setPasswordError(result.error ?? 'Could not change password.'); return }
    setPasswordOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    toast('Password changed')
  }

  if (!profile) return null

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Shape the workspace around your attempt.</h1>
          <p className="page-head__sub">Profile, study preferences, appearance, security and data controls.</p>
        </div>
        <Badge tone="info"><ShieldCheck size={12} /> Local-first workspace</Badge>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <a href="#profile">Profile</a>
          <a href="#preferences">Study preferences</a>
          <a href="#appearance">Appearance</a>
          <a href="#security">Security</a>
          <a href="#data">Data & export</a>
          <a href="#ai">AI configuration</a>
          <a href="#about">About</a>
        </nav>

        <div className="settings-main">
          <Card id="profile" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-accent"><UserRound size={17} /></span><div><h2>Profile</h2><p>This shapes greetings, study plans and mentor context.</p></div></div>
            <div className="form-grid-2">
              <Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
              <Field label="Email"><Input value={user?.email ?? ''} disabled /><span className="field__hint">Email is your sign-in identity.</span></Field>
              <Field label="Attempt"><Input value={attempt} onChange={e => setAttempt(e.target.value)} placeholder="e.g. First attempt" /></Field>
              <Field label="Target year"><Input value={targetYear} onChange={e => setTargetYear(e.target.value)} placeholder="2027" /></Field>
            </div>
            <div className="role-line"><Badge tone={isAdmin ? 'purple' : 'neutral'}>{user?.role}</Badge><span>Account created {user ? new Date(user.createdAt).toLocaleDateString('en-IN') : ''}</span></div>
          </Card>

          <Card id="preferences" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-teal"><Sparkles size={17} /></span><div><h2>Study preferences</h2><p>Used by the planner and analytics. You can change these as the attempt evolves.</p></div></div>
            <div className="form-grid-2">
              <Field label="Priority stage"><Segmented options={[{ id: 'prelims', label: 'Prelims' }, { id: 'mains', label: 'Mains' }, { id: 'interview', label: 'Interview' }]} value={stage} onChange={id => setStage(id as Stage)} label="Priority stage" /></Field>
              <Field label="Current level"><Select value={level} onChange={e => setLevel(e.target.value as typeof level)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="repeat">Repeat / working professional</option></Select></Field>
              <Field label="Daily study hours"><Input type="number" min={1} max={16} step={0.5} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} /></Field>
              <Field label="Exam date"><Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} /></Field>
            </div>
            <Field label="Optional subject" hint="Leave blank if undecided. The syllabus shows a placeholder, not fabricated paper content."><Select value={optionalSubject} onChange={e => setOptionalSubject(e.target.value)}><option value="">Not decided yet</option>{optionalSubjects.map(s => <option key={s} value={s}>{s}</option>)}</Select></Field>
            <div className="strength-grid">
              <div><strong>Stronger areas</strong><p className="small muted">Select subjects you handle well. They get less planner weight.</p><div className="chip-select">{mainsSubjects.map(s => <button key={s.id} className={cn('select-chip', strong.includes(s.id) && 'active-success')} onClick={() => toggleSubject(s.id, 'strong')}>{strong.includes(s.id) && <Check size={11} />} {s.name}</button>)}</div></div>
              <div><strong>Weaker areas</strong><p className="small muted">These are prioritised in the 30-day plan.</p><div className="chip-select">{mainsSubjects.map(s => <button key={s.id} className={cn('select-chip', weak.includes(s.id) && 'active-danger')} onClick={() => toggleSubject(s.id, 'weak')}>{weak.includes(s.id) && <Check size={11} />} {s.name}</button>)}</div></div>
            </div>
            <div className="settings-save"><Button onClick={saveProfile}>Save profile <Check size={15} /></Button></div>
          </Card>

          <Card id="appearance" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-indigo"><Palette size={17} /></span><div><h2>Appearance & language</h2><p>Interface language is separate from the language of official sources.</p></div></div>
            <div className="theme-options">
              <button className={cn('theme-option', theme === 'light' && 'active')} onClick={() => setTheme('light')}><Sun size={18} /><div><strong>Light</strong><span>Paper, ink and saffron</span></div>{theme === 'light' && <Check size={15} />}</button>
              <button className={cn('theme-option', theme === 'dark' && 'active')} onClick={() => setTheme('dark')}><Moon size={18} /><div><strong>Dark</strong><span>Low-light reading</span></div>{theme === 'dark' && <Check size={15} />}</button>
            </div>
            <div className="language-options">
              <span><Languages size={15} /> Interface language</span>
              <Segmented options={[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }]} value={lang} onChange={id => setLanguage(id as 'en' | 'hi')} label="Interface language" />
            </div>
          </Card>

          <Card id="security" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-danger"><Lock size={17} /></span><div><h2>Security</h2><p>Passwords are hashed in this browser. This is a demo-grade local auth model, not a production identity service.</p></div></div>
            <div className="security-row"><div><strong>Password</strong><p>Change the password used to sign in on this device.</p></div><Button variant="secondary" onClick={() => setPasswordOpen(true)}><KeyRound size={15} /> Change password</Button></div>
            <div className="security-row"><div><strong>Session</strong><p>Signing out clears the local session. Your workspace remains stored for the next sign-in.</p></div><Badge tone="success">Active</Badge></div>
          </Card>

          <Card id="data" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-amber"><Download size={17} /></span><div><h2>Data & export</h2><p>Your notes, tests and plans live in this browser’s local storage.</p></div></div>
            <div className="security-row"><div><strong>Export workspace</strong><p>Download a JSON copy of your profile, plan, attempts, notes, cards and evaluations.</p></div><Button variant="secondary" onClick={exportData}><Download size={15} /> Export JSON</Button></div>
            <div className="security-row security-row--danger"><div><strong>Reset workspace</strong><p>{t('resetWarn')}</p></div><Button variant="danger" onClick={() => setResetOpen(true)}><Trash2 size={15} /> Reset</Button></div>
          </Card>

          <Card id="ai" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-purple"><Sparkles size={17} /></span><div><h2>AI configuration</h2><p>The app never asks for a provider key in the browser.</p></div></div>
            <div className={cn('ai-status', proxyConfigured ? 'configured' : 'local')}>
              <span className="ai-status__dot" />
              <div><strong>{proxyConfigured ? 'Secure proxy connected' : 'Local mentor mode'}</strong><p>{proxyConfigured ? 'Requests are routed through VITE_AI_PROXY_URL. The proxy is responsible for provider authentication and rate limits.' : 'No VITE_AI_PROXY_URL is configured, so the deterministic local mentor, evaluator and question generator are active. All features remain usable.'}</p></div>
              <Badge tone={proxyConfigured ? 'success' : 'info'}>{proxyConfigured ? 'Proxy' : 'Local'}</Badge>
            </div>
            <div className="ai-note"><ShieldCheck size={15} /><span>To connect a provider, deploy a server endpoint that accepts <code>{'{ task, payload, messages }'}</code> and returns <code>{'{ content }'}</code>. Keep credentials on the server.</span></div>
          </Card>

          <Card id="about" className="settings-section">
            <div className="settings-section__head"><span className="settings-icon tone-bg-neutral"><ShieldCheck size={17} /></span><div><h2>About this build</h2><p>UPSC Mentor AI · local-first study workspace</p></div></div>
            <div className="about-grid">
              <div><span>Version</span><strong>1.0.0</strong></div>
              <div><span>Content</span><strong>Curated syllabus + demo questions</strong></div>
              <div><span>PYQ integrity</span><strong>Labelled; verify official papers</strong></div>
              <div><span>Data mode</span><strong>Browser localStorage</strong></div>
            </div>
            <p className="muted small">This is an independent study tool. It is not affiliated with UPSC. Current-affairs briefs are educational summaries; verify time-sensitive facts against the cited primary source.</p>
          </Card>
        </div>
      </div>

      <Modal open={passwordOpen} onClose={() => { setPasswordOpen(false); setPasswordError('') }} title="Change password" description="At least 8 characters." footer={<><Button variant="ghost" onClick={() => setPasswordOpen(false)}>Cancel</Button><Button loading={passwordBusy} onClick={submitPassword}>Update password</Button></>}>
        <div className="stack">
          {passwordError && <div className="form-error"><TriangleAlert size={14} /> {passwordError}</div>}
          <Field label="Current password"><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" /></Field>
          <Field label="New password"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" /></Field>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset workspace?" description="Plan, attempts, notes, flashcards, conversations, evaluations and progress will be cleared." footer={<><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { resetWorkspace(); setResetOpen(false) }}>Reset everything</Button></>}>
        <div className="danger-note"><TriangleAlert size={16} /><span>This cannot be undone. Export your data first if you want a copy.</span></div>
      </Modal>
    </div>
  )
}
