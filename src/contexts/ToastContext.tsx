import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; kind: ToastKind }

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    counter += 1
    const id = counter
    setToasts(prev => [...prev.slice(-2), { id, message, kind }])
    window.setTimeout(() => dismiss(id), 3800)
  }, [dismiss])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            {t.kind === 'success' ? <CheckCircle2 size={17} /> : t.kind === 'error' ? <AlertCircle size={17} /> : <Info size={17} />}
            <span>{t.message}</span>
            <button className="icon-btn icon-btn--xs" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
