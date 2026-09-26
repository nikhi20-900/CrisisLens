import { CheckCircle2, AlertOctagon } from 'lucide-react'
import { Badge } from '../ui/Badge'

export function IncidentStatus({
  reviewStatus,
  humanOverride,
}: {
  reviewStatus?: string | null
  humanOverride?: boolean | null
}) {
  if (reviewStatus === 'approved' || reviewStatus === 'modified') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[13px] text-emerald-900">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">Human Verified</p>
          <p className="mt-0.5 font-medium">
            {humanOverride ? 'Emergency responder overrode AI inference.' : 'Emergency responder certified this assessment.'}
          </p>
        </div>
      </div>
    )
  }

  if (reviewStatus === 'escalated') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-900">
        <AlertOctagon size={16} className="mt-0.5 shrink-0 text-[#D70015]" />
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-[#D70015] uppercase">Escalated</p>
          <p className="mt-0.5 font-medium">Flagged for immediate senior command action & resource mobilization.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-[12px]">
      <Badge>AI</Badge>
      <span className="text-[#6E6E73]">AI inference awaiting human certification</span>
    </div>
  )
}
