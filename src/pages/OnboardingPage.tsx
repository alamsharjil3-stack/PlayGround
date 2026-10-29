import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Compass, GraduationCap, Languages, Sparkles, Target, Timer } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import type { Language, StudyProfile, Stage } from '../types'
import { subjects } from '../data/syllabus'
import { generateStudyPlan } from '../lib/planner'
import { Button, ProgressBar } from '../components/ui'
import { cn } from '../lib/cn'

const coreSubjects = subjects.filter(s => s.paperId === 'prelims-gs1' && s.id !== 'current-affairs')
const optionalChoices = ['Political Science & International Relations', 'Public Administration', 'Sociology', 'History', 'Geography', 'Philosophy', 'Economics', 'Anthropology', 'Literature', 'Law', 'Psychology', 'Other']

const steps = [
  { title: 'Identity', subtitle: 'How should your mentor address you?' },
  { title: 'Attempt & target', subtitle: 'So the countdown and plan are grounded in reality.' },
  { title: 'Preparation level', subtitle: 'Honest calibration beats optimism.' },
  { title: 'Time available', subtitle: 'A plan you can actually follow.' },
  { title: 'Optional subject', subtitle: 'We will reserve time for it.' },
  { title: 'Strengths', subtitle: 'Protect these with periodic revision.' },
  { title: 'Weak areas', subtitle: 'These get priority and more practice.' },
  { title: 'Stage priority', subtitle: 'What deserves the next six months?' },
  { title: 'Review', subtitle: 'Generate your workspace.' },
]

export function OnboardingPage() {
  const { user, updateProfile } = useAuth()
  const { data, setWorkspacePlan } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<Language>(user?.profile.language ?? 'en')
  const [profile, setProfile] = useState<StudyProfile>({
    ...(user?.profile ?? {
      name: '', language: 'en', attempt: 'first', targetYear: '2027', stagePriority: 'prelims',
      level: 'beginner', dailyHours: 4, optionalSubject: '', strongSubjects: [], weakSubjects: [],
      examDate: '2027-05-23', onboarded: false,
    }),
    name: user?.profile.name ?? '',
  })

  const patch = (p: Partial<StudyProfile>) => setProfile(prev => ({ ...prev, ...p }))
  const toggleSubject = (key: 'strongSubjects' | 'weakSubjects', id: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(s => s !== id) : [...prev[key], id],
    }))
  }

  const finish = () => {
    const complete = { ...profile, language, onboarded: true }
    updateProfile(complete)
    setWorkspacePlan(generateStudyPlan(complete, 30))
    navigate('/dashboard')
  }

  const canContinue = (() => {
    if (step === 0) return profile.name.trim().length > 1
    if (step === 3) return profile.dailyHours >= 1
    if (step === 4) return Boolean(profile.optionalSubject)
    return true
  })()

  const content = () => {
    switch (step) {
      case 0:
        return (
          <div className="onboard__fields">
            <label className="field">
              <span>Your name</span>
              <input className="input input--lg" value={profile.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Ananya Sharma" autoFocus />
            </label>
            <div className="field">
              <span>Preferred language</span>
              <div className="choice-grid choice-grid--2">
                <button className={cn('choice', language === 'en' && 'choice--active')} onClick={() => { setLanguage('en'); patch({ language: 'en' }) }}>
                  <Languages size={19} /><strong>English</strong><small>Full interface and mentor replies</small>
                </button>
                <button className={cn('choice', language === 'hi' && 'choice--active')} onClick={() => { setLanguage('hi'); patch({ language: 'hi' }) }}>
                  <Languages size={19} /><strong>हिंदी</strong><small>इंटरफ़ेस और मेंटर उत्तर</small>
                </button>
              </div>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="onboard__fields">
            <div className="field">
              <span>How many attempts have you made?</span>
              <div className="choice-grid choice-grid--3">
                {[['first', 'First attempt', 'Fresh start'], ['second', 'Second attempt', 'Building on experience'], ['repeat', 'Third or later', 'Repeat candidate']].map(([id, label, sub]) => (
                  <button key={id} className={cn('choice', profile.attempt === id && 'choice--active')} onClick={() => patch({ attempt: id })}>
                    <GraduationCap size={19} /><strong>{label}</strong><small>{sub}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="onboard__row">
              <label className="field"><span>Target year</span>
                <select className="select" value={profile.targetYear} onChange={e => patch({ targetYear: e.target.value })}>
                  {['2027', '2028', '2029', '2030'].map(y => <option key={y}>{y}</option>)}
                </select>
              </label>
              <label className="field"><span>Expected exam date</span>
                <input className="input" type="date" value={profile.examDate} onChange={e => patch({ examDate: e.target.value })} />
              </label>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="onboard__fields">
            <div className="choice-grid choice-grid--3">
              {[['beginner', 'Beginner', 'Starting from the NCERTs'], ['intermediate', 'Intermediate', 'Covered the basics; need depth and practice'], ['advanced', 'Advanced', 'Revision, tests and answer writing'], ['repeat', 'Repeat candidate', 'Restructuring a previous preparation']].map(([id, label, sub]) => (
                <button key={id} className={cn('choice', id === 'repeat' ? 'choice--wide' : '', profile.level === id && 'choice--active')} onClick={() => patch({ level: id as StudyProfile['level'] })}>
                  <Compass size={19} /><strong>{label}</strong><small>{sub}</small>
                </button>
              ))}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="onboard__fields">
            <div className="hours-card">
              <Timer size={24} />
              <div>
                <p>Daily study hours</p>
                <div className="hours-value"><strong>{profile.dailyHours}</strong><span>hours / day</span></div>
              </div>
            </div>
            <input className="range" type="range" min={1} max={14} step={0.5} value={profile.dailyHours} onChange={e => patch({ dailyHours: Number(e.target.value) })} aria-label="Daily study hours" />
            <div className="range-labels"><span>1h</span><span>6h</span><span>10h</span><span>14h</span></div>
            <p className="muted small">Working professionals often choose 3–5 hours on weekdays. The planner can be edited later.</p>
          </div>
        )
      case 4:
        return (
          <div className="onboard__fields">
            <div className="choice-grid choice-grid--2 choice-grid--compact">
              {optionalChoices.map(o => (
                <button key={o} className={cn('choice choice--pill', profile.optionalSubject === o && 'choice--active')} onClick={() => patch({ optionalSubject: o })}>
                  {profile.optionalSubject === o ? <Check size={15} /> : null}<span>{o}</span>
                </button>
              ))}
            </div>
          </div>
        )
      case 5:
      case 6: {
        const key = step === 5 ? 'strongSubjects' : 'weakSubjects'
        return (
          <div className="onboard__fields">
            <div className="choice-grid choice-grid--3">
              {coreSubjects.map(s => (
                <button key={s.id} className={cn('choice choice--subject', profile[key].includes(s.id) && 'choice--active')} onClick={() => toggleSubject(key, s.id)} style={{ '--subject-color': s.color } as React.CSSProperties}>
                  <span className="choice__dot" />
                  <strong>{language === 'hi' ? s.nameHi : s.name}</strong>
                  {profile[key].includes(s.id) && <Check size={15} />}
                </button>
              ))}
            </div>
            <p className="muted small">Select as many as apply. {step === 5 ? 'We will schedule lighter maintenance reviews.' : 'These will receive more study time and practice questions.'}</p>
          </div>
        )
      }
      case 7:
        return (
          <div className="onboard__fields">
            <div className="choice-grid choice-grid--3">
              {([['prelims', 'Prelims first', 'Objective practice and factual depth'], ['mains', 'Mains first', 'Answer writing and analytical depth'], ['interview', 'Balanced / Interview', 'Personality and current affairs focus']] as [Stage, string, string][]).map(([id, label, sub]) => (
                <button key={id} className={cn('choice', profile.stagePriority === id && 'choice--active')} onClick={() => patch({ stagePriority: id })}>
                  <Target size={19} /><strong>{label}</strong><small>{sub}</small>
                </button>
              ))}
            </div>
          </div>
        )
      default:
        return (
          <div className="onboard__review">
            <div className="onboard__review-grid">
              <div><span>Name</span><strong>{profile.name}</strong></div>
              <div><span>Language</span><strong>{language === 'hi' ? 'हिंदी' : 'English'}</strong></div>
              <div><span>Target</span><strong>CSE {profile.targetYear}</strong></div>
              <div><span>Attempt</span><strong>{profile.attempt}</strong></div>
              <div><span>Level</span><strong>{profile.level}</strong></div>
              <div><span>Daily hours</span><strong>{profile.dailyHours}h</strong></div>
              <div><span>Optional</span><strong>{profile.optionalSubject}</strong></div>
              <div><span>Priority</span><strong>{profile.stagePriority}</strong></div>
              <div className="wide"><span>Weak areas</span><strong>{profile.weakSubjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Not specified'}</strong></div>
              <div className="wide"><span>Strengths</span><strong>{profile.strongSubjects.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Not specified'}</strong></div>
            </div>
            <div className="onboard__promise">
              <Sparkles size={18} />
              <p>Your dashboard, study plan, mentor context, revision queue and difficulty calibration will adapt to these choices. You can change any of them later.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="onboard">
      <aside className="onboard__aside">
        <div className="brand">
          <span className="brand__mark"><BookOpenCheck size={21} /></span>
          <span className="brand__text"><strong>UPSC Mentor AI</strong><small>Workspace setup</small></span>
        </div>
        <p className="onboard__aside-title">{profile.name ? `Hello, ${profile.name.split(' ')[0]}.` : 'Let us begin.'}</p>
        <p className="onboard__aside-sub">Nine quick questions to calibrate your preparation workspace.</p>
        <ol className="onboard__steps">
          {steps.map((s, i) => (
            <li key={s.title} className={cn(i === step && 'active', i < step && 'done')}>
              <span className="onboard__step-num">{i < step ? <Check size={13} /> : String(i + 1).padStart(2, '0')}</span>
              <div><strong>{s.title}</strong><small>{s.subtitle}</small></div>
            </li>
          ))}
        </ol>
        <p className="onboard__aside-note">Your data stays on this device in this demo. A production deployment would use a server-side database and secure authentication.</p>
      </aside>

      <main className="onboard__main">
        <div className="onboard__top">
          <span className="eyebrow">Step {step + 1} of {steps.length}</span>
          <span className="muted mono">{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <ProgressBar value={((step + 1) / steps.length) * 100} hideValue />
        <h1>{steps[step].title}</h1>
        <p className="onboard__sub">{steps[step].subtitle}</p>
        <div className="onboard__content">{content()}</div>
        <div className="onboard__actions">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft size={16} /> Back</Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canContinue}>Continue <ArrowRight size={16} /></Button>
          ) : (
            <Button onClick={finish}>Generate my workspace <Sparkles size={16} /></Button>
          )}
        </div>
        {data ? null : null}
      </main>
    </div>
  )
}
