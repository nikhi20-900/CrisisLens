import { formatClock } from '../../lib/format'
import type { Incident } from '../../types/incident'

interface TimelineEvent {
  at: string
  label: string
}

export function IncidentTimeline({ incident }: { incident: Incident }) {
  const events = buildTimeline(incident)

  return (
    <ol className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <p className="mb-4 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Activity Timeline</p>
      {events.map((event, index) => (
        <li key={`${event.label}-${index}`} className="flex gap-3.5 pb-4 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-[#0071E3] ring-4 ring-[#0071E3]/15" />
            {index < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-black/[0.08]" /> : null}
          </div>
          <div className="pt-0.5">
            <p className="font-mono text-[11px] font-medium text-[#86868B]">{formatClock(event.at)}</p>
            <p className="text-[13px] font-medium text-[#1D1D1F]">{event.label}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function buildTimeline(incident: Incident): TimelineEvent[] {
  const start = incident.createdAt ?? new Date().toISOString()
  const events: TimelineEvent[] = [{ at: start, label: 'Citizen telemetry received' }]
  if (incident.imageUrl) events.push({ at: start, label: 'Multimodal evidence ingested' })
  events.push({ at: start, label: 'Gemini reasoning pass initiated' })
  if (incident.weather?.available) events.push({ at: start, label: 'Hyper-local weather context synced' })
  events.push({ at: start, label: 'Deterministic severity index calculated' })
  events.push({ at: start, label: 'Triage priority score computed' })
  if (incident.reviewStatus === 'pending' || incident.uncertaintyFlag) {
    events.push({ at: start, label: 'Human operator validation requested' })
  }
  if (incident.reviewedAt) {
    const label =
      incident.reviewStatus === 'approved'
        ? 'Verified by Duty Officer'
        : incident.reviewStatus === 'escalated'
          ? 'Escalated to Emergency Command'
          : 'Assessment adjusted by Duty Officer'
    events.push({ at: incident.reviewedAt, label })
  }
  return events
}
