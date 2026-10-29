import { Link } from 'react-router-dom'
import {
  BookOpenCheck, CheckCircle2, Database, Download, FileCheck2, FileQuestion, Layers3,
  LockKeyhole, Newspaper, ShieldAlert, ShieldCheck, Users,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { questions, pyqQuestions } from '../data/questions'
import { currentAffairs } from '../data/currentAffairs'
import { papers, subjects, topics } from '../data/syllabus'
import { formatDate } from '../lib/date'
import { Badge, Button, Card, EmptyState, SectionHeader, Stat } from '../components/ui'
import { useToast } from '../contexts/ToastContext'

export function AdminPage() {
  const { user, users, isAdmin } = useAuth()
  const { lang } = useApp()
  const { toast } = useToast()

  if (!isAdmin) {
    return (
      <div className="page">
        <EmptyState icon={<LockKeyhole size={26} />} title="Admin access required" description="This area is restricted to accounts with the admin role. Use the seeded admin account or return to your dashboard." action={<Link to="/dashboard"><Button>Back to dashboard</Button></Link>} />
      </div>
    )
  }

  const manifest = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      counts: { papers: papers.length, subjects: subjects.length, topics: topics.length, questions: questions.length, pyqs: pyqQuestions.length, currentAffairs: currentAffairs.length },
      papers: papers.map(p => ({ id: p.id, name: p.name, optional: p.optional ?? false })),
      questionSources: questions.reduce<Record<string, number>>((acc, q) => { acc[q.source.type] = (acc[q.source.type] ?? 0) + 1; return acc }, {}),
      currentAffairs: currentAffairs.map(c => ({ id: c.id, title: c.title, category: c.category, source: c.sourceName, sourceUrl: c.sourceUrl })),
      integrity: {
        aiQuestionsLabeled: questions.filter(q => q.source.type === 'ai-practice').every(q => q.source.sourceName?.includes('AI')),
        pyqsCurated: pyqQuestions.every(q => q.source.confidence === 'curated-demo'),
        officialVerificationRequired: true,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'upsc-mentor-content-manifest.json'; a.click(); URL.revokeObjectURL(url)
    toast('Content manifest exported')
  }

  return (
    <div className="page admin-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Content integrity, at a glance.</h1>
          <p className="page-head__sub">A local admin console for content provenance, account inventory and data boundaries. No password hashes or private workspace data are exposed.</p>
        </div>
        <div className="page-head__actions"><Badge tone="purple"><ShieldCheck size={12} /> Admin</Badge><Button variant="secondary" onClick={manifest}><Download size={15} /> Export manifest</Button></div>
      </header>

      <div className="admin-stats">
        <Stat label="Accounts" value={users.length} sub="Local browser accounts" icon={<Users size={18} />} tone="indigo" />
        <Stat label="Syllabus topics" value={topics.length} sub={`${subjects.length} subjects · ${papers.length} papers`} icon={<BookOpenCheck size={18} />} tone="teal" />
        <Stat label="Questions" value={questions.length} sub={`${pyqQuestions.length} curated PYQs`} icon={<FileQuestion size={18} />} tone="accent" />
        <Stat label="Current affairs" value={currentAffairs.length} sub="Issue briefs with citations" icon={<Newspaper size={18} />} tone="amber" />
      </div>

      <div className="admin-grid">
        <Card className="panel">
          <SectionHeader eyebrow="Accounts" title="Local user directory" description="Only non-sensitive profile fields are shown. Password hashes are never rendered." />
          <div className="admin-users">
            <div className="admin-users__head"><span>User</span><span>Role</span><span>Stage</span><span>Created</span></div>
            {users.map(u => (
              <div key={u.id} className="admin-user-row">
                <div className="admin-user-id"><span className="avatar avatar--sm">{u.profile.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()}</span><div><strong>{u.profile.name}</strong><small>{u.email}</small></div>{u.id === user?.id && <Badge tone="info">You</Badge>}</div>
                <Badge tone={u.role === 'admin' ? 'purple' : 'neutral'}>{u.role}</Badge>
                <span className="small">{u.profile.stagePriority}</span>
                <span className="small muted">{formatDate(u.createdAt, lang)}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="admin-side">
          <Card className="panel">
            <h3><ShieldAlert size={16} /> Integrity rules</h3>
            <div className="integrity-list">
              <div><CheckCircle2 size={15} className="text-success" /><span>Every AI-generated MCQ is labelled “AI Generated Practice Question”.</span></div>
              <div><CheckCircle2 size={15} className="text-success" /><span>Curated PYQ records are marked <code>curated-demo</code> and require official-paper verification.</span></div>
              <div><CheckCircle2 size={15} className="text-success" /><span>No current-affairs item is presented without a named source and URL.</span></div>
              <div><CheckCircle2 size={15} className="text-success" /><span>Mains and interview feedback carry explicit “practice signal” disclaimers.</span></div>
              <div><CheckCircle2 size={15} className="text-success" /><span>Optional-subject content is a placeholder until real paper material is supplied.</span></div>
            </div>
          </Card>
          <Card className="panel">
            <h3><Database size={16} /> Data boundary</h3>
            <p className="small muted">Workspaces are stored per account in this browser’s <code>localStorage</code>. Admins cannot read another user’s plan, notes, attempts or conversations from this console.</p>
            <div className="data-facts"><div><span>Content questions</span><strong>{questions.length}</strong></div><div><span>Labelled AI questions</span><strong>{questions.filter(q => q.source.type === 'ai-practice').length}</strong></div><div><span>Curated PYQs</span><strong>{pyqQuestions.length}</strong></div><div><span>Verified PYQs</span><strong>0</strong></div></div>
            <p className="small"><FileCheck2 size={13} /> Verified PYQ count is intentionally zero until official papers are manually checked and imported.</p>
          </Card>
          <Card className="panel">
            <h3><Layers3 size={16} /> Content inventory</h3>
            <div className="inventory-list">
              {papers.map(p => {
                const count = topics.filter(t => t.paperId === p.id).length
                return <div key={p.id}><span>{p.shortName}</span><div className="inventory-bar"><span style={{ width: `${Math.max(4, (count / Math.max(1, ...papers.map(x => topics.filter(t => t.paperId === x.id).length))) * 100)}%` }} /></div><strong>{count}</strong></div>
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="admin-note">
        <ShieldCheck size={18} />
        <div><strong>Demo-grade administration</strong><p>This console is read-only by design. In production, content writes, role management and audit logs must be enforced server-side with authenticated admin access, not in the client.</p></div>
      </Card>
    </div>
  )
}
