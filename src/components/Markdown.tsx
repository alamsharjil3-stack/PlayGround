import { Fragment, type ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i += 1; continue }

    if (line.startsWith('<details>')) {
      const inner: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('</details>')) { inner.push(lines[i]); i += 1 }
      i += 1
      const summaryLine = inner.find(l => l.includes('<summary>')) ?? ''
      const summary = summaryLine.replace(/<summary>|<\/summary>/g, '').replace(/\*\*/g, '')
      const rest = inner.filter(l => !l.includes('<summary>')).join('\n')
      blocks.push(<details key={key++} className="md-details"><summary>{summary || 'Show more'}</summary><Markdown content={rest} /></details>)
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const text = heading[2]
      if (level === 1) blocks.push(<h1 key={key++}>{inline(text)}</h1>)
      else if (level === 2) blocks.push(<h2 key={key++}>{inline(text)}</h2>)
      else if (level === 3) blocks.push(<h3 key={key++}>{inline(text)}</h3>)
      else blocks.push(<h4 key={key++}>{inline(text)}</h4>)
      i += 1
      continue
    }

    if (/^---+$/.test(line.trim())) { blocks.push(<hr key={key++} />); i += 1; continue }

    if (line.trimStart().startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) { quote.push(lines[i].trimStart().replace(/^>\s?/, '')); i += 1 }
      blocks.push(<blockquote key={key++}>{quote.map((q, qi) => <p key={qi}>{inline(q)}</p>)}</blockquote>)
      continue
    }

    if (/^\s*([-*·])\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*([-*·])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*·])\s+/, '')); i += 1 }
      blocks.push(<ul key={key++}>{items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}</ul>)
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i += 1 }
      blocks.push(<ol key={key++}>{items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}</ol>)
      continue
    }

    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|/.test(lines[i + 1])) {
      const rows: string[][] = []
      const header = line.split('|').map(c => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''))
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const cells = lines[i].split('|').map(c => c.trim())
        if (cells[0] === '') cells.shift()
        if (cells[cells.length - 1] === '') cells.pop()
        rows.push(cells)
        i += 1
      }
      blocks.push(
        <div className="md-table-wrap" key={key++}>
          <table><thead><tr>{header.map((h, hi) => <th key={hi}>{inline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{inline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      continue
    }

    const para: string[] = [line]
    i += 1
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*·]\s|\s*\d+\.\s|>|\||---|<details>)/.test(lines[i])) {
      para.push(lines[i])
      i += 1
    }
    blocks.push(<p key={key++}>{inline(para.join(' '))}</p>)
  }

  return <div className="markdown">{blocks}</div>
}
