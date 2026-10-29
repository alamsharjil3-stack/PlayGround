import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="page not-found">
      <div className="not-found__code">404</div>
      <span className="eyebrow"><Compass size={14} /> Off the syllabus</span>
      <h1>This page is not part of the plan.</h1>
      <p>The link may be old, or the route may have moved. Return to your workspace and continue from where you left off.</p>
      <div className="not-found__actions">
        <Link to="/dashboard"><Button><ArrowLeft size={15} /> Back to dashboard</Button></Link>
        <Link to="/mentor"><Button variant="secondary">Ask the mentor</Button></Link>
      </div>
    </div>
  )
}
