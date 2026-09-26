import { Button } from './Button'

interface EmptyStateProps {
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white px-6 py-10 text-center shadow-xs">
      <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">{title}</p>
      <p className="mt-2 text-sm text-[#6E6E73] max-w-sm mx-auto">{body}</p>
      {action ? (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
