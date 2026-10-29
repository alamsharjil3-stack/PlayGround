import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export function Button({ variant = 'primary', size = 'md', className, loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={cn('btn', `btn--${variant}`, `btn--${size}`, className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={cn('icon-btn', className)} aria-label={label} title={label} {...props}>{children}</button>
  )
}

export function Card({ className, children, as: As = 'div', ...rest }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' } & React.HTMLAttributes<HTMLDivElement>) {
  return <As className={cn('card', className)} {...rest}>{children}</As>
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info' | 'purple'; className?: string }) {
  return <span className={cn('badge', `badge--${tone}`, className)}>{children}</span>
}

export function ProgressBar({ value, tone = 'accent', label, hideValue }: { value: number; tone?: string; label?: string; hideValue?: boolean }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="progress-wrap">
      {(label || !hideValue) && (
        <div className="progress-meta">
          {label ? <span>{label}</span> : <span />}
          {!hideValue && <span className="mono">{safe}%</span>}
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progress'}>
        <span className={cn('progress__fill', `tone-${tone}`)} style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

export function ProgressRing({ value, size = 92, stroke = 8, tone = 'accent', children, label }: { value: number; size?: number; stroke?: number; tone?: string; children?: ReactNode; label?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safe / 100) * circumference
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label ?? `${safe} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle className={cn('ring__value', `stroke-${tone}`)} cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring__label">{children ?? <span>{safe}%</span>}</div>
    </div>
  )
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const nodes = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => ref.current?.querySelector<HTMLElement>('button, input, textarea, select')?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cn('modal', `modal--${size}`)} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <IconButton label="Close dialog" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('tabs', className)} role="tablist">
      {tabs.map(tab => (
        <button key={tab.id} role="tab" aria-selected={value === tab.id} className={cn('tab', value === tab.id && 'tab--active')} onClick={() => onChange(tab.id)}>
          {tab.label}
          {typeof tab.count === 'number' && <span className="tab__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="spinner" role="status"><Loader2 className="spin" size={20} /><span>{label}</span></div>
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return <div className="skeleton" aria-hidden="true">{Array.from({ length: lines }, (_, i) => <span key={i} style={{ width: `${100 - (i % 3) * 12}%` }} />)}</div>
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="field__error" role="alert">{error}</p> : hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('textarea', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('select', className)} {...props}>{children}</select>
}

export function SectionHeader({ eyebrow, title, description, action, className }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('section-head', className)}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-head__action">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, icon, tone = 'accent' }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; tone?: string }) {
  return (
    <Card className="stat">
      <div className={cn('stat__icon', `tone-bg-${tone}`)}>{icon}</div>
      <div>
        <p className="stat__label">{label}</p>
        <p className="stat__value">{value}</p>
        {sub && <p className="stat__sub">{sub}</p>}
      </div>
    </Card>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">{initials}</span>
}

export function Segmented({ options, value, onChange, label }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(opt => (
        <button key={opt.id} type="button" className={cn('segmented__item', value === opt.id && 'segmented__item--active')} aria-pressed={value === opt.id} onClick={() => onChange(opt.id)}>{opt.label}</button>
      ))}
    </div>
  )
}
