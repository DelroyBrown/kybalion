import { Link } from 'react-router-dom'

import { Button } from '../components/common/Button'
import { PerennialMark } from '../components/common/PerennialMark'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center px-6">
      <PerennialMark size={80} className="text-ink-500" />
      <h1 className="mt-8 font-display text-3xl text-parchment-100">This door does not open</h1>
      <p className="editorial-body mt-3 max-w-sm text-parchment-400">
        The page you sought is not part of the archive. The text itself, however, remains where it
        always was.
      </p>
      <Link to="/home" className="mt-8">
        <Button variant="outline">Return to the archive</Button>
      </Link>
    </div>
  )
}
