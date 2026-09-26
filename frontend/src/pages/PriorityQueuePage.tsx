import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { caseId, confidencePercent, formatDisaster, normalizeLabel, scoreValue, timeAgo } from '../lib/format'

export function PriorityQueuePage() {
  const { incidents } = useApp()

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
  }, [incidents])

  return (
    <PageContainer
      title="Dynamic Triage Priority Queue"
      kicker="Automated Urgency Ranking"
      actions={
        <div className="rounded-full bg-black/[0.04] px-3.5 py-1 font-mono text-[11px] font-medium text-[#6E6E73]">
          Urgency Index = 0.35(S) + 0.25(E) + 0.25(U) + 0.15(A)
        </div>
      }
    >
      {sortedIncidents.length === 0 ? (
        <EmptyState
          title="Priority Queue Empty"
          body="There are currently no active incidents requiring critical dispatch triage."
          action={{ label: 'Analyze New Incident', onClick: () => (window.location.href = '/analyze') }}
        />
      ) : (
        <div className="space-y-4">
          {sortedIncidents.map((incident, index) => {
            const priority = normalizeLabel(incident.priorityLabel)
            const severity = normalizeLabel(incident.severityLabel)
            const reasons = incident.priorityBreakdown?.reasons ?? []

            return (
              <article
                key={incident.id}
                className="group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0071E3]/10 font-mono text-xs font-bold text-[#0071E3]">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#86868B]">{caseId(incident.id)}</span>
                        <h2 className="text-base font-bold text-[#1D1D1F]">{formatDisaster(incident.disasterType)}</h2>
                        <span className="text-[#86868B]">·</span>
                        <span className="text-sm text-[#6E6E73]">{incident.locationName ?? 'Location Unspecified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge kind="severity">{priority}</Badge>
                    {incident.isDemo ? <Badge>DEMO</Badge> : null}
                    {incident.reviewStatus === 'approved' ? (
                      <Badge>VERIFIED</Badge>
                    ) : (
                      <Badge>PENDING REVIEW</Badge>
                    )}
                    <Link to={`/incidents/${incident.id}`}>
                      <Button variant="primary" className="py-1 px-3 text-[11px]">
                        Investigate
                        <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Score and stats strip */}
                <div className="mt-4 grid grid-cols-2 gap-3.5 rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5 sm:grid-cols-3 lg:grid-cols-6 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">Priority Score</span>
                    <span className="font-mono text-base font-bold text-[#0071E3]">{scoreValue(incident.priorityScore)} / 100</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">Severity Score</span>
                    <span className="font-mono text-base font-bold text-[#1D1D1F]">{scoreValue(incident.severityScore)} / 100 ({severity})</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">Impacted Persons</span>
                    <span className="font-mono text-base font-bold text-[#1D1D1F]">{incident.affectedPeopleEstimate ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">AI Confidence</span>
                    <span className="font-mono text-base font-bold text-[#1D1D1F]">{confidencePercent(incident.confidenceScore)}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">Telemetry Age</span>
                    <span className="text-[12px] font-medium text-[#6E6E73]">{timeAgo(incident.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#86868B] block">Duty Officer Action</span>
                    <span className="text-[12px] font-bold uppercase text-[#1D1D1F]">{incident.reviewStatus ?? 'pending'}</span>
                  </div>
                </div>

                {/* Explainable reasons */}
                {reasons.length > 0 ? (
                  <div className="mt-3.5 rounded-xl bg-black/[0.015] p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">
                      Primary Ranking Drivers
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2 text-[12px] text-[#1D1D1F]">
                      {reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check size={12} className="shrink-0 text-[#0071E3]" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
