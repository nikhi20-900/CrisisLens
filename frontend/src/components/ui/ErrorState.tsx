import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title: string
  body: string
  onRetry?: () => void
  action?: { label: string; onClick: () => void }
}

export function ErrorState({ title, body, onRetry, action }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-[#D70015]" />
        <p className="text-[12px] font-semibold text-[#D70015]">{title}</p>
      </div>
      <p className="mt-1 text-sm text-[#48484A]">{body}</p>
      <div className="mt-3 flex gap-2">
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {action ? (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
