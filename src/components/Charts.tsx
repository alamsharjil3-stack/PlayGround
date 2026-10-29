import { useId } from 'react'

export interface Point { label: string; value: number; name?: string }

export function LineChart({ data, height = 190, tone = 'var(--accent)', max = 100, suffix = '%' }: { data: Point[]; height?: number; tone?: string; max?: number; suffix?: string }) {
  const id = useId().replace(/:/g, '')
  const width = 560
  const pad = { top: 18, right: 16, bottom: 30, left: 34 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  if (!data.length) return <div className="chart-empty">No data yet</div>
  const points = data.map((d, i) => ({
    x: pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: pad.top + innerH - (Math.min(max, Math.max(0, d.value)) / max) * innerH,
    ...d,
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Line chart: ${data.map(d => `${d.label} ${d.value}${suffix}`).join(', ')}`}>
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.2" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(v => {
          const y = pad.top + innerH - (v / 100) * innerH
          return <g key={v}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid" /><text x={pad.left - 8} y={y + 3} textAnchor="end" className="chart-label">{v}{suffix}</text></g>
        })}
        <path d={area} fill={`url(#g-${id})`} />
        <path d={path} fill="none" stroke={tone} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke={tone} strokeWidth="2" />
            <title>{`${p.name ?? p.label}: ${p.value}${suffix}`}</title>
          </g>
        ))}
        {points.filter((_, i) => data.length <= 7 || i % Math.ceil(data.length / 6) === 0).map((p, i) => (
          <text key={i} x={p.x} y={height - 9} textAnchor="middle" className="chart-label">{p.label}</text>
        ))}
      </svg>
    </div>
  )
}

export function BarChart({ data, height = 190, tone = 'var(--accent)', max = 100, suffix = '%', horizontal = false }: { data: Point[]; height?: number; tone?: string; max?: number; suffix?: string; horizontal?: boolean }) {
  const width = 560
  if (!data.length) return <div className="chart-empty">No data yet</div>
  if (horizontal) {
    const rowH = 32
    const h = Math.max(height, data.length * rowH + 10)
    return (
      <div className="chart">
        <svg viewBox={`0 0 ${width} ${h}`} role="img" aria-label={`Bar chart: ${data.map(d => `${d.label} ${d.value}${suffix}`).join(', ')}`}>
          {data.map((d, i) => {
            const y = i * rowH + 6
            const barW = Math.min(1, Math.max(0, d.value / max)) * (width - 220)
            return (
              <g key={i}>
                <text x="0" y={y + 15} className="chart-label chart-label--left">{d.label.length > 24 ? `${d.label.slice(0, 23)}…` : d.label}</text>
                <rect x="160" y={y + 4} width={width - 200} height="13" rx="6" className="chart-track" />
                <rect x="160" y={y + 4} width={barW} height="13" rx="6" fill={tone} />
                <text x={width - 30} y={y + 15} textAnchor="end" className="chart-label">{d.value}{suffix}</text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }
  const pad = { top: 16, right: 12, bottom: 30, left: 32 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const barW = Math.max(8, (innerW / data.length) * 0.55)
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Bar chart: ${data.map(d => `${d.label} ${d.value}${suffix}`).join(', ')}`}>
        {[0, 50, 100].map(v => {
          const y = pad.top + innerH - (v / 100) * innerH
          return <g key={v}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid" /><text x={pad.left - 8} y={y + 3} textAnchor="end" className="chart-label">{v}</text></g>
        })}
        {data.map((d, i) => {
          const x = pad.left + (i + 0.5) * (innerW / data.length) - barW / 2
          const bh = (Math.min(max, Math.max(0, d.value)) / max) * innerH
          return (
            <g key={i}>
              <rect x={x} y={pad.top + innerH - bh} width={barW} height={bh} rx="5" fill={tone} opacity="0.9">
                <title>{`${d.name ?? d.label}: ${d.value}${suffix}`}</title>
              </rect>
              <text x={x + barW / 2} y={height - 9} textAnchor="middle" className="chart-label">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function MiniBars({ values, tone = 'var(--accent)' }: { values: number[]; tone?: string }) {
  const max = Math.max(1, ...values)
  return (
    <div className="mini-bars" aria-hidden="true">
      {values.map((v, i) => <span key={i} style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: tone }} />)}
    </div>
  )
}
