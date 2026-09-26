import { MapPin, TrendingUp, ArrowUpRight, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatClock, normalizeLabel } from '../../lib/format'
import type { CrisisZoneInfo, Incident } from '../../types/incident'

interface CrisisZoneEvolutionPanelProps {
  crisisZone?: CrisisZoneInfo | null
  incident?: Incident | null
}

export function CrisisZoneEvolutionPanel({ crisisZone, incident }: CrisisZoneEvolutionPanelProps) {
  const zoneId = crisisZone?.zone_id || incident?.crisisZoneId
  const zoneName = crisisZone?.zone_name || incident?.crisisZoneName || 'Crisis Zone'
  const isUpdate = crisisZone?.is_update ?? false
  const history = crisisZone?.evolution_history || incident?.evolutionHistory || []
  const changeReason = crisisZone?.priority_change_reason || incident?.priorityChangeReason

  return (
    <section className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs transition-all">
      {/* Zone Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1 rounded-md bg-[#0071E3]/10 px-2 font-mono text-[10px] font-semibold text-[#0071E3]">
              <MapPin size={11} /> {zoneId || 'ZONE-ACTIVE'}
            </span>
            {isUpdate ? (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                CORRELATED & UPDATED (NO DUPLICATE)
              </span>
            ) : (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                NEW CRISIS ZONE ESTABLISHED
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base font-bold text-[#1D1D1F]">{zoneName}</h3>
          <p className="mt-0.5 text-[12px] text-[#6E6E73]">
            Living Crisis Map Zone · Correlates incoming citizen evidence across time without duplicate incident clutter.
          </p>
        </div>

        {incident?.id ? (
          <Link to={`/map`}>
            <Button variant="secondary" className="flex items-center gap-1.5 py-1 px-3 text-[11px] font-semibold">
              <span>View On Living Crisis Map</span>
              <ArrowUpRight size={13} />
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Priority Change Reason / Why it changed */}
      {changeReason ? (
        <div className="mt-4 rounded-xl border border-blue-500/20 bg-[#0071E3]/[0.04] p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#0071E3] uppercase">
            <TrendingUp size={13} />
            <span>Crisis Priority Determinant</span>
          </div>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#1D1D1F]">{changeReason}</p>
        </div>
      ) : null}

      {/* Evolution History Timeline */}
      <div className="mt-5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
          <History size={13} />
          <span>Timeline of Crisis Evolution ({history.length} {history.length === 1 ? 'Report' : 'Sequential Reports'})</span>
        </div>

        {history.length > 0 ? (
          <ol className="mt-3.5 space-y-3.5">
            {history.map((step, idx) => {
              const stepPriority = normalizeLabel(step.priority_label)
              return (
                <li
                  key={idx}
                  className="relative flex gap-3.5 rounded-xl border border-black/[0.05] bg-black/[0.015] p-3.5 transition-all hover:bg-black/[0.025]"
                >
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0071E3] ring-4 ring-[#0071E3]/20" />
                    {idx < history.length - 1 ? (
                      <span className="mt-1.5 w-px flex-1 bg-black/[0.1]" />
                    ) : null}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#86868B]">
                        {formatClock(step.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge kind="severity">{stepPriority}</Badge>
                        <span className="font-mono text-[11px] font-bold text-[#1D1D1F]">
                          {Math.round(step.priority_score)}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-[13px] font-bold text-[#1D1D1F]">{step.observation}</p>

                    {step.change_reason ? (
                      <p className="text-[12px] text-[#6E6E73]">{step.change_reason}</p>
                    ) : null}

                    {step.accessibility_issues && step.accessibility_issues.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {step.accessibility_issues.map((issue, iIdx) => (
                          <span
                            key={iIdx}
                            className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-amber-800"
                          >
                            Transit: {issue}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="mt-2 text-[12px] text-[#86868B]">Initial baseline assessment recorded.</p>
        )}
      </div>
    </section>
  )
}
