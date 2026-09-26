import { Link } from 'react-router-dom'
import { caseId, formatDisaster, timeAgo } from '../../lib/format'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  const recent = [...incidents]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 6)

  if (recent.length === 0) {
    return (
      <EmptyState
        title="No Incidents Found"
        body="Try resetting filters or initiating a new disaster analysis."
      />
    )
  }

  return (
    <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      {recent.map((incident) => (
        <li key={incident.id}>
          <Link
            to={`/incidents/${incident.id}`}
            className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-black/[0.02]"
          >
            <Badge kind="severity">{incident.priorityLabel ?? 'LOW'}</Badge>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#1D1D1F]">
                {formatDisaster(incident.disasterType)} · {incident.locationName ?? 'Location Unspecified'}
              </p>
              <p className="font-mono text-[11px] text-[#86868B]">
                {caseId(incident.id)} · {timeAgo(incident.createdAt)}
              </p>
            </div>
            {incident.isDemo ? <Badge>DEMO</Badge> : null}
            <span className="text-[12px] text-[#86868B] transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
