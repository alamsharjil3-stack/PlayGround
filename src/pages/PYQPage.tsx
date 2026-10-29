import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, ChevronLeft, ChevronRight, FileSearch, Filter, Info, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { questions, pyqQuestions } from '../data/questions'
import { papers, subjects } from '../data/syllabus'
import { Badge, Button, Card, EmptyState, Input, Select } from '../components/ui'
import { QuestionListCard } from '../components/cards'
import { cn } from '../lib/cn'

const PAGE_SIZE = 8

export function PYQPage() {
  const { data, t } = useApp()
  const [query, setQuery] = useState('')
  const [paper, setPaper] = useState('all')
  const [subject, setSubject] = useState('all')
  const [year, setYear] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [type, setType] = useState('all')
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [page, setPage] = useState(1)

  const years = useMemo(() => [...new Set(questions.filter(q => q.source.year).map(q => q.source.year))].sort((a, b) => (b ?? 0) - (a ?? 0)), [])
  const bookmarks = data?.bookmarks ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return questions.filter(item => {
      if (q && !`${item.stem} ${item.tags.join(' ')} ${item.explanation}`.toLowerCase().includes(q)) return false
      if (paper !== 'all' && item.paperId !== paper) return false
      if (subject !== 'all' && item.subjectId !== subject) return false
      if (year !== 'all' && String(item.source.year) !== year) return false
      if (difficulty !== 'all' && item.difficulty !== difficulty) return false
      if (type === 'pyq' && item.source.type !== 'pyq') return false
      if (type === 'ai' && item.source.type !== 'ai-practice') return false
      if (onlyBookmarked && !bookmarks.includes(item.id)) return false
      return true
    })
  }, [query, paper, subject, year, difficulty, type, onlyBookmarked, bookmarks])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const reset = () => {
    setQuery(''); setPaper('all'); setSubject('all'); setYear('all'); setDifficulty('all'); setType('all'); setOnlyBookmarked(false); setPage(1)
  }

  return (
    <div className="page pyq-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">PYQ engine</p>
          <h1>Previous year questions, deconstructed.</h1>
          <p className="page-head__sub">Filter by paper, subject, year and difficulty. Every question leads to the concept, the trap and the syllabus link.</p>
        </div>
        <div className="pyq-head-actions">
          <Button variant={onlyBookmarked ? 'secondary' : 'outline'} onClick={() => { setOnlyBookmarked(v => !v); setPage(1) }}>
            <Bookmark size={16} /> {t('bookmarked')} <span className="mono">{bookmarks.length}</span>
          </Button>
        </div>
      </header>

      <div className="pyq-stats">
        <Card className="pyq-stat"><FileSearch size={17} /><div><strong>{questions.length}</strong><span>Total questions</span></div></Card>
        <Card className="pyq-stat"><ShieldCheck size={17} /><div><strong>{pyqQuestions.length}</strong><span>Curated PYQ records</span></div></Card>
        <Card className="pyq-stat"><Sparkles size={17} /><div><strong>{questions.length - pyqQuestions.length}</strong><span>AI practice questions</span></div></Card>
      </div>

      <Card className="disclaimer-banner">
        <Info size={17} />
        <p><strong>{t('pyqDisclaimer')}</strong> Curated records carry source metadata; official question papers should always be checked on upsc.gov.in.</p>
      </Card>

      <Card className="filter-bar">
        <div className="search-inline filter-bar__search">
          <Search size={16} />
          <Input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder={t('searchFilters')} aria-label="Search questions" />
        </div>
        <div className="filter-grid">
          <label className="filter-field"><span>{t('subject')}</span>
            <Select value={subject} onChange={e => { setSubject(e.target.value); setPage(1) }}>
              <option value="all">{t('allSubjects')}</option>
              {subjects.filter(s => s.paperId.startsWith('prelims') || s.paperId.startsWith('mains')).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </label>
          <label className="filter-field"><span>Paper</span>
            <Select value={paper} onChange={e => { setPaper(e.target.value); setPage(1) }}>
              <option value="all">All papers</option>
              {papers.map(p => <option key={p.id} value={p.id}>{p.shortName}</option>)}
            </Select>
          </label>
          <label className="filter-field"><span>{t('year')}</span>
            <Select value={year} onChange={e => { setYear(e.target.value); setPage(1) }}>
              <option value="all">{t('allYears')}</option>
              {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </Select>
          </label>
          <label className="filter-field"><span>{t('difficulty')}</span>
            <Select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1) }}>
              <option value="all">{t('allLevels')}</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </label>
          <label className="filter-field"><span>Type</span>
            <Select value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
              <option value="all">All types</option>
              <option value="pyq">Curated PYQ</option>
              <option value="ai">AI practice</option>
            </Select>
          </label>
          <Button variant="ghost" size="sm" onClick={reset} className="filter-reset"><Filter size={14} /> {t('reset')}</Button>
        </div>
      </Card>

      <div className="list-head">
        <span><strong>{filtered.length}</strong> questions</span>
        <span className="muted">Page {safePage} of {pages}</span>
      </div>

      <div className="question-list">
        {visible.map(q => <QuestionListCard key={q.id} question={q} />)}
        {!visible.length && <EmptyState icon={<FileSearch size={24} />} title="No questions match these filters" description="Try clearing a filter or searching with a broader term." action={<Button variant="secondary" onClick={reset}>Reset filters</Button>} />}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={15} /> Previous</Button>
          <div className="pagination__pages">
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button key={n} className={cn('page-btn', n === safePage && 'page-btn--active')} onClick={() => setPage(n)}>{n}</button>
            ))}
          </div>
          <Button variant="ghost" size="sm" disabled={safePage >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next <ChevronRight size={15} /></Button>
        </div>
      )}
    </div>
  )
}
