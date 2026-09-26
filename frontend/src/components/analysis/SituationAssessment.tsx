import { confidencePercent, formatDisaster, normalizeLabel, scoreValue } from '../../lib/format'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'

export function SituationAssessment({ incident }: { incident: Incident }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Multimodal Situation Assessment</p>
        <Badge>AI INFERENCE</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Block label="Disaster Type" value={formatDisaster(incident.disasterType)} />
        <Block
          label="Calculated Severity"
          value={`${scoreValue(incident.severityScore)} / 100`}
          badge={normalizeLabel(incident.severityLabel)}
        />
        <Block
          label="Triage Priority"
          value={`${scoreValue(incident.priorityScore)} / 100`}
          badge={normalizeLabel(incident.priorityLabel)}
        />
        <Block label="Model Confidence" value={`${confidencePercent(incident.confidenceScore)}%`} />
      </div>

      {incident.aiAssessment?.summary ? (
        <div className="mt-4 rounded-xl border border-black/[0.05] bg-black/[0.02] p-4">
          <p className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Executive Intelligence Synthesis</p>
          <p className="mt-1 text-sm leading-relaxed text-[#1D1D1F]">{incident.aiAssessment.summary}</p>
        </div>
      ) : null}
    </section>
  )
}

function Block({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5">
      <p className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</p>
      <p className="mt-1.5 font-bold text-lg text-[#1D1D1F]">{value}</p>
      {badge ? (
        <div className="mt-2">
          <Badge kind="severity">{badge}</Badge>
        </div>
      ) : null}
    </div>
  )
}
