import { Link } from 'react-router-dom'
import { caseId, confidencePercent, formatDisaster, normalizeLabel, scoreValue, timeAgo } from '../../lib/format'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function IncidentCard({ incident, compact = false }: { incident: Incident; compact?: boolean }) {
  const severity = normalizeLabel(incident.severityLabel)
  const priority = normalizeLabel(incident.priorityLabel)

  return (
    <article className="group rounded-2xl border border-black/[0.06] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge kind="severity">{severity}</Badge>
          {incident.isDemo ? <Badge>DEMO</Badge> : null}
          {incident.reviewStatus === 'pending' ? <Badge>PENDING</Badge> : null}
          {incident.reviewStatus === 'approved' ? <Badge>APPROVED</Badge> : null}
        </div>
        <span className="font-mono text-[11px] font-medium text-[#86868B]">{caseId(incident.id)}</span>
      </div>

      <p className="mt-2.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
        {formatDisaster(incident.disasterType)}
      </p>

      <h3 className="mt-1 text-sm font-semibold leading-snug text-[#1D1D1F]">
        {incident.aiAssessment?.summary?.slice(0, 95) || incident.reportText?.slice(0, 95) || 'Incident assessment pending'}
      </h3>

      <p className="mt-1 text-[12px] text-[#6E6E73]">{incident.locationName ?? 'Location unspecified'}</p>

      {!compact ? (
        <p className="mt-1 text-[12px] font-medium text-[#1D1D1F]">
          {incident.affectedPeopleEstimate ?? 0} <span className="text-[#86868B] font-normal">potentially impacted</span>
        </p>
      ) : null}

      <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl border border-black/[0.04] bg-black/[0.02] p-2 text-[11px]">
        <Metric label="Priority" value={`${scoreValue(incident.priorityScore)} / 100`} emphasize={priority} />
        <Metric label="Severity" value={`${scoreValue(incident.severityScore)} / 100`} />
        <Metric label="Confidence" value={`${confidencePercent(incident.confidenceScore)}%`} />
      </div>

      <div className="mt-4 flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#86868B]">{timeAgo(incident.createdAt)}</span>
        <Link to={`/incidents/${incident.id}`}>
          <Button variant="secondary" className="px-3 py-1 text-[11px]">
            Investigate
          </Button>
        </Link>
      </div>
    </article>
  )
}

function Metric({ label, value, emphasize }: { label: string; value: string; emphasize?: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</p>
      <p className={`font-mono text-[12px] font-semibold ${emphasize === 'CRITICAL' ? 'text-[#D70015]' : 'text-[#1D1D1F]'}`}>
        {value}
      </p>
    </div>
  )
}
