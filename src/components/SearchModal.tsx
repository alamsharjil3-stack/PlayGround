import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, FileText, Landmark, Newspaper, Search, Sparkles, X } from 'lucide-react'
import { searchAll, type SearchResult } from '../lib/search'
import { useApp } from '../contexts/AppContext'
import { IconButton } from './ui'

const iconFor = (type: SearchResult['type']) => {
  switch (type) {
    case 'Topic': return <BookOpen size={16} />
    case 'PYQ': return <FileText size={16} />
    case 'Current affairs': return <Newspaper size={16} />
    case 'Note': return <Sparkles size={16} />
    default: return <Landmark size={16} />
  }
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, t } = useApp()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 40)
    else setQuery('')
  }, [open])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 130)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => searchAll(debounced, data?.notes ?? []), [debounced, data?.notes])
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    for (const r of results) {
      if (!map.has(r.type)) map.set(r.type, [])
      map.get(r.type)!.push(r)
    }
    return [...map.entries()]
  }, [results])

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  if (!open) return null
  return (
    <div className="search-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="search-panel" role="dialog" aria-modal="true" aria-label="Global search">
        <div className="search-panel__input">
          <Search size={19} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} />
          <span className="kbd">ESC</span>
          <IconButton label={t('close')} onClick={onClose}><X size={16} /></IconButton>
        </div>
        <div className="search-panel__body">
          {!query.trim() && (
            <div className="search-quick">
              <p className="eyebrow">{t('recentSearches')}</p>
              <div className="search-chips">
                {['Fundamental Rights', 'Fiscal deficit', 'Monsoon', 'Climate finance', 'AI governance', 'Ethics case study'].map(term => (
                  <button key={term} onClick={() => setQuery(term)}>{term}</button>
                ))}
              </div>
              <p className="search-hint"><span className="kbd">Ctrl</span> <span className="kbd">K</span> {t('keyboardHint').replace('Use Ctrl/⌘ + K to search', 'to search anywhere')}</p>
            </div>
          )}
          {query.trim() && results.length === 0 && <div className="search-empty">{t('noResults')}</div>}
          {grouped.map(([type, items]) => (
            <div key={type} className="search-group">
              <p className="search-group__label">{type}</p>
              {items.map(item => (
                <button key={`${type}-${item.id}`} className="search-result" onClick={() => go(item.path)}>
                  <span className="search-result__icon">{iconFor(item.type)}</span>
                  <span className="search-result__text">
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  <ArrowRight size={15} className="search-result__arrow" />
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="search-panel__footer">
          <span>Syllabus · PYQs · Current affairs · Notes · Questions</span>
          <span className="muted">↵ open</span>
        </div>
      </div>
    </div>
  )
}
