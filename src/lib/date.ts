export const todayISO = () => new Date().toISOString().slice(0, 10)
export const addDays = (date: Date | string, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
export const iso = (d: Date) => d.toISOString().slice(0, 10)
export const daysBetween = (a: string, b: string) => {
  const diff = new Date(b).getTime() - new Date(a).getTime()
  return Math.round(diff / 86_400_000)
}
export const formatDate = (value: string, lang: 'en' | 'hi' = 'en') =>
  new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const formatShort = (value: string, lang: 'en' | 'hi' = 'en') =>
  new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })
export const relativeDay = (value: string) => {
  const diff = daysBetween(todayISO(), value)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days overdue`
}
export const secondsToClock = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
export const daysUntil = (date: string) => Math.max(0, daysBetween(todayISO(), date))
