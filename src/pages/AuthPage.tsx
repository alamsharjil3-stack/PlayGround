import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, Eye, EyeOff, LineChart, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Field, Input } from '../components/ui'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, demoLogin } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = mode === 'login' ? await login(email, password) : await register(name, email, password)
      if (!res.ok) setError(res.error ?? 'Unable to continue.')
      else navigate(mode === 'login' ? '/dashboard' : '/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const demo = async () => {
    setError('')
    setBusy(true)
    try {
      await demoLogin()
      navigate('/dashboard')
    } catch {
      setError('Could not open the demo workspace.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth__brand">
        <div className="auth__brand-inner">
          <Link to="/" className="brand">
            <span className="brand__mark"><BookOpenCheck size={21} /></span>
            <span className="brand__text"><strong>UPSC Mentor AI</strong><small>Civil Services Workspace</small></span>
          </Link>

          <div className="auth__hero">
            <span className="auth__eyebrow"><Sparkles size={14} /> An AI mentor that teaches, not just answers</span>
            <h1>Serious preparation deserves a serious workspace.</h1>
            <p>Learn the syllabus, practise PYQs, write Mains answers, revise weak areas and track readiness — in one disciplined loop.</p>
            <div className="auth__loop">
              {['Learn', 'Practise', 'Analyse', 'Revise', 'Improve'].map((step, i) => (
                <div key={step} className="auth__loop-step">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                  {i < 4 && <ArrowRight size={13} />}
                </div>
              ))}
            </div>
          </div>

          <div className="auth__features">
            <div><BrainCircuit size={18} /><span><strong>Structured AI mentorship</strong><small>Concept → relevance → facts → PYQ → revision → quiz</small></span></div>
            <div><LineChart size={18} /><span><strong>Performance intelligence</strong><small>Weak topics, readiness and a plan that adapts</small></span></div>
            <div><ShieldCheck size={18} /><span><strong>Exam integrity</strong><small>PYQs labelled honestly. No fabricated official questions.</small></span></div>
          </div>

          <div className="auth__preview" aria-hidden="true">
            <div className="auth__preview-top">
              <span>Today’s focus</span><span className="badge badge--accent">Day 42</span>
            </div>
            <strong>Fiscal policy & deficit financing</strong>
            <div className="auth__preview-row"><span className="dot dot--accent" /> 45 min deep study</div>
            <div className="auth__preview-row"><span className="dot dot--teal" /> 12 MCQs · remaining 8</div>
            <div className="auth__preview-row"><span className="dot dot--amber" /> Mains answer · 150 words</div>
            <div className="auth__preview-bars">
              {[38, 62, 51, 78, 70, 88, 64].map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="auth__form-wrap">
        <div className="auth__form">
          <div className="auth__mobile-brand">
            <span className="brand__mark"><BookOpenCheck size={20} /></span>
            <strong>UPSC Mentor AI</strong>
          </div>
          <div className="auth__tabs">
            <Link className={mode === 'login' ? 'active' : ''} to="/login">Sign in</Link>
            <Link className={mode === 'register' ? 'active' : ''} to="/register">Create account</Link>
          </div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Begin your preparation workspace'}</h2>
          <p className="auth__sub">{mode === 'login' ? 'Continue where you left off. Your plan and progress are waiting.' : 'Create an account to build a personalised plan around your attempt, hours and weak areas.'}</p>

          <form onSubmit={submit} className="auth__fields">
            {mode === 'register' && (
              <Field label="Full name" htmlFor="name">
                <Input id="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password" htmlFor="password" hint={mode === 'register' ? 'At least 8 characters. Stored as a hash on this device.' : undefined}>
              <div className="password-wrap">
                <Input id="password" type={show ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" className="password-toggle" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </Field>

            {error && <div className="form-error" role="alert">{error}</div>}

            <Button type="submit" size="lg" loading={busy} className="auth__submit">
              {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} />
            </Button>
          </form>

          <div className="auth__divider"><span>or</span></div>
          <Button variant="outline" size="lg" className="auth__demo" onClick={demo} disabled={busy}>
            <Sparkles size={16} /> Explore the demo workspace
          </Button>
          <p className="auth__demo-note">Demo account: <span className="mono">demo@upscmentor.app</span> · <span className="mono">demo1234</span></p>

          <div className="auth__security">
            <CheckCircle2 size={14} /> Progress is stored on this device. AI provider keys remain server-side.
          </div>

          <p className="auth__switch">
            {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
            <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
