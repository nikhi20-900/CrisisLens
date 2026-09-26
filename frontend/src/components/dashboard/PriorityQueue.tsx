import { Link } from 'react-router-dom'
import { caseId, confidencePercent, formatDisaster, normalizeLabel, scoreValue, timeAgo } from '../../lib/format'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'

export function PriorityQueue({ incidents, limit }: { incidents: Incident[]; limit?: number }) {
  const sorted = [...incidents]
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, limit ?? incidents.length)

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="Queue Clear"
        body="No incidents currently require critical triage."
        action={{ label: 'Analyze New Incident', onClick: () => (window.location.href = '/analyze') }}
      />
    )
  }

  return (
    <ol className="space-y-2.5">
      {sorted.map((incident, index) => {
        const priority = normalizeLabel(incident.priorityLabel)
        return (
          <li key={incident.id}>
            <Link
              to={`/incidents/${incident.id}`}
              className="group block rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold text-[#86868B]">
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge kind="severity">{priority}</Badge>
                  {incident.isDemo ? <Badge>DEMO</Badge> : null}
                </div>
              </div>

              <p className="mt-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">
                {formatDisaster(incident.disasterType)}
              </p>
              <p className="text-[13px] font-semibold text-[#1D1D1F] line-clamp-1">
                {incident.locationName ?? 'Location unspecified'}
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-black/[0.02] p-2 font-mono text-[11px] text-[#6E6E73]">
                <span>Severity: <strong className="text-[#1D1D1F]">{normalizeLabel(incident.severityLabel)}</strong></span>
                <span>Priority: <strong className="text-[#0071E3]">{scoreValue(incident.priorityScore)}</strong></span>
                <span>Impact: <strong className="text-[#1D1D1F]">{incident.affectedPeopleEstimate ?? 0}</strong></span>
                <span>Conf: <strong className="text-[#1D1D1F]">{confidencePercent(incident.confidenceScore)}%</strong></span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#86868B]">
                <span className="font-mono text-[10px]">{caseId(incident.id)}</span>
                <span>{timeAgo(incident.createdAt)}</span>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
