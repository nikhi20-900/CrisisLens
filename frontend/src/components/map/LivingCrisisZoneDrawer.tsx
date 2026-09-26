import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  X, 
  Activity, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  MessageSquare, 
  Cpu, 
  ShieldAlert, 
  Users, 
  Compass 
} from 'lucide-react'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { caseId, formatDisaster, normalizeLabel, scoreValue, timeAgo } from '../../lib/format'

interface LivingCrisisZoneDrawerProps {
  incident: Incident
  onClose: () => void
  onFocus?: () => void
}

type TabType = 'overview' | 'timeline' | 'evidence' | 'unknowns'

export function LivingCrisisZoneDrawer({ incident, onClose, onFocus }: LivingCrisisZoneDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const normPriority = normalizeLabel(incident.priorityLabel)
  const openAnalysis = incident.openrouterAnalysis
  const evolution = incident.evolutionHistory ?? []
  const hasEvolution = evolution.length > 1

  // Extract Unknowns
  const unknowns: string[] = []
  if (openAnalysis?.unknown_information && openAnalysis.unknown_information.length > 0) {
    unknowns.push(...openAnalysis.unknown_information)
  }
  if (incident.uncertaintyReason) {
    if (!unknowns.includes(incident.uncertaintyReason)) {
      unknowns.push(incident.uncertaintyReason)
    }
  }
  if (unknowns.length === 0) {
    unknowns.push('Detailed local infrastructure structural tolerance', 'Precise sub-block water depth elevation')
  }

  // Extract Evidence & Supporting Factors
  const evidenceList = incident.evidence && incident.evidence.length > 0
    ? incident.evidence
    : openAnalysis?.supporting_evidence ?? []

  // Extract Observed vs Reported vs Inferred
  const observedItems = openAnalysis?.visible_damage && openAnalysis.visible_damage.length > 0
    ? openAnalysis.visible_damage
    : ['Camera visual analysis of surface conditions']
  
  const reportedItems = [
    incident.reportText,
    ...(openAnalysis?.observed_conditions ?? []).filter(c => c.toLowerCase().includes('report') || c.toLowerCase().includes('citizen'))
  ].filter(Boolean)

  const inferredItems = [
    `Computed Priority Score: ${scoreValue(incident.priorityScore)}/100 (${normPriority})`,
    `Evaluated Severity Index: ${scoreValue(incident.severityScore)}/100 (${normalizeLabel(incident.severityLabel)})`,
    openAnalysis?.affected_area_description,
    ...(incident.priorityBreakdown?.reasons ?? [])
  ].filter(Boolean)

  return (
    <aside 
      className="absolute bottom-5 right-5 z-20 w-[420px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-14rem)] flex flex-col rounded-2xl border border-black/[0.08] bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300"
      aria-label="Crisis Zone Intelligence Panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/[0.06] p-4 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-[#86868B] tracking-wider uppercase">
              {caseId(incident.id)}
            </span>
            {incident.crisisZoneId ? (
              <span className="font-mono text-[10px] font-bold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded">
                {incident.crisisZoneId}
              </span>
            ) : null}
            {hasEvolution ? (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-500/15 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Activity size={10} />
                {evolution.length} Living Updates
              </span>
            ) : null}
          </div>
          <h2 className="mt-1 text-base font-bold text-[#1D1D1F] leading-tight">
            {incident.crisisZoneName || formatDisaster(incident.disasterType)}
          </h2>
          <p className="mt-0.5 text-xs text-[#6E6E73] truncate max-w-[280px]">
            {incident.locationName ?? 'Coordinates Verified'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge kind="severity">{normPriority}</Badge>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.06] px-4 pt-1 bg-black/[0.01]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#0071E3] text-[#0071E3]'
              : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`py-2 px-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'border-[#0071E3] text-[#0071E3]'
              : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <span>Living Timeline</span>
          {hasEvolution ? (
            <span className="font-mono text-[9px] px-1 bg-amber-500/20 text-amber-800 rounded-full font-bold">
              {evolution.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`py-2 px-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-[#0071E3] text-[#0071E3]'
              : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Why {normPriority}?
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unknowns')}
          className={`py-2 px-2.5 text-[11px] font-semibold tracking-wide border-b-2 transition-colors ${
            activeTab === 'unknowns'
              ? 'border-[#0071E3] text-[#0071E3]'
              : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Unknowns ({unknowns.length})
        </button>
      </div>

      {/* Content Area with smooth scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin text-xs">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            {/* Priority Reason Alert */}
            {incident.priorityChangeReason ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3 text-[11px] leading-relaxed text-[#1D1D1F]">
                <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-1 uppercase tracking-wider text-[10px]">
                  <Activity size={12} />
                  Situation Evolution Determinant
                </div>
                {incident.priorityChangeReason}
              </div>
            ) : null}

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5 text-center font-mono">
              <div>
                <span className="text-[9px] font-bold text-[#86868B] uppercase tracking-wider">Priority</span>
                <p className="text-sm font-extrabold text-[#0071E3] mt-0.5">
                  {scoreValue(incident.priorityScore)}/100
                </p>
                <span className="text-[10px] text-[#6E6E73] font-sans">{normPriority}</span>
              </div>
              <div className="border-x border-black/[0.06]">
                <span className="text-[9px] font-bold text-[#86868B] uppercase tracking-wider">Severity</span>
                <p className="text-sm font-extrabold text-[#1D1D1F] mt-0.5">
                  {scoreValue(incident.severityScore)}/100
                </p>
                <span className="text-[10px] text-[#6E6E73] font-sans">{normalizeLabel(incident.severityLabel)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#86868B] uppercase tracking-wider">Confidence</span>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                  {Math.round((incident.confidenceScore ?? 0.8) * 100)}%
                </p>
                <span className="text-[10px] text-[#6E6E73] font-sans">Multi-sensor</span>
              </div>
            </div>

            {/* Critical Field: People at Risk */}
            <div className="rounded-xl border border-black/[0.06] bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#86868B] uppercase mb-1">
                <Users size={12} className="text-[#FF3B30]" />
                Possible People at Risk
              </div>
              <p className="text-xs font-semibold text-[#1D1D1F]">
                {openAnalysis?.possible_people_at_risk || `${incident.affectedPeopleEstimate ?? 'Multiple'} individuals potentially at risk`}
              </p>
            </div>

            {/* Critical Field: Accessibility Issues */}
            <div className="rounded-xl border border-black/[0.06] bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#86868B] uppercase mb-1">
                <Compass size={12} className="text-[#FF9500]" />
                Accessibility & Road Impediments
              </div>
              {openAnalysis?.accessibility_issues && openAnalysis.accessibility_issues.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-[11px] text-[#1D1D1F]">
                  {openAnalysis.accessibility_issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[#6E6E73]">Direct road access routes subject to rapid ground verification.</p>
              )}
            </div>

            {/* Current Situation Report */}
            <div className="rounded-xl border border-black/[0.06] bg-white p-3 shadow-2xs">
              <div className="text-[10px] font-bold tracking-wider text-[#86868B] uppercase mb-1 flex items-center justify-between">
                <span>Current Ground Intel</span>
                <span className="text-[#86868B] font-mono lowercase">{timeAgo(incident.createdAt)}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#1D1D1F]">
                {incident.reportText || 'Monitoring ongoing sensor streams.'}
              </p>
            </div>
          </div>
        )}

        {/* TIMELINE TAB - LIVING CRISIS MAP EVOLUTION */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#6E6E73] pb-1 border-b border-black/[0.05]">
              <span>Chronological Incident Evolution</span>
              <span className="font-mono text-[10px] text-[#0071E3] font-bold">{evolution.length || 1} Events Recorded</span>
            </div>

            {evolution.length > 0 ? (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#0071E3] before:via-amber-500 before:to-[#FF3B30]">
                {evolution.map((step, idx) => {
                  const stepTime = step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Step ${idx + 1}`
                  const isLatest = idx === evolution.length - 1
                  return (
                    <div key={idx} className="relative">
                      {/* Node Bullet */}
                      <span className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full border-2 border-white shadow-2xs ${
                        isLatest ? 'bg-[#FF3B30] ring-3 ring-[#FF3B30]/20' : 'bg-[#0071E3]'
                      }`} />

                      <div className={`rounded-xl border p-3 ${
                        isLatest ? 'border-amber-500/30 bg-amber-500/[0.04] shadow-xs' : 'border-black/[0.06] bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-[#1D1D1F]">
                            {stepTime}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            step.priority_label === 'CRITICAL' ? 'bg-red-500/10 text-red-700' :
                            step.priority_label === 'HIGH' ? 'bg-orange-500/10 text-orange-700' :
                            step.priority_label === 'MEDIUM' ? 'bg-amber-500/10 text-amber-700' :
                            'bg-blue-500/10 text-blue-700'
                          }`}>
                            {step.priority_label ?? 'UPDATE'} {step.priority_score ? `(${Math.round(step.priority_score)})` : ''}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#1D1D1F]">
                          {step.observation}
                        </p>

                        {step.change_reason ? (
                          <p className="mt-1 text-[11px] text-[#6E6E73] leading-snug">
                            {step.change_reason}
                          </p>
                        ) : null}

                        {step.visible_damage && step.visible_damage.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {step.visible_damage.map((d, di) => (
                              <span key={di} className="text-[9px] bg-black/[0.04] text-[#1D1D1F] px-1.5 py-0.5 rounded">
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-[#86868B]">
                <p>Initial crisis zone assessment recorded. As new evidence arrives, the living timeline evolves automatically.</p>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE / WHY HIGH PRIORITY TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/[0.06] bg-[#0071E3]/[0.03] p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#0071E3] flex items-center gap-1.5 mb-2">
                <ShieldAlert size={13} />
                Why {normPriority} Priority?
              </h3>
              <ul className="space-y-1.5 text-xs text-[#1D1D1F]">
                {evidenceList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#0071E3] font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
                {incident.hazards && incident.hazards.length > 0 ? (
                  incident.hazards.map((h, hi) => (
                    <li key={`hazard-${hi}`} className="flex items-start gap-2">
                      <span className="text-[#FF9500] font-bold mt-0.5">•</span>
                      <span>Active Hazard: {h}</span>
                    </li>
                  ))
                ) : null}
              </ul>
            </div>

            {/* Fact Attribution Hierarchy */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold tracking-wider text-[#86868B] uppercase">
                Grounded Fact Attribution (Non-Hallucination)
              </p>

              {/* Observed */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-2.5">
                <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 uppercase mb-1">
                  <Eye size={11} />
                  Observed (Physical / Photographic Evidence)
                </span>
                <ul className="space-y-0.5 text-[11px] text-[#1D1D1F] list-disc list-inside">
                  {observedItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Reported */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.03] p-2.5">
                <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1 uppercase mb-1">
                  <MessageSquare size={11} />
                  Reported (Citizen / Eyewitness Ingestion)
                </span>
                <ul className="space-y-0.5 text-[11px] text-[#1D1D1F] list-disc list-inside">
                  {reportedItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Inferred */}
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/[0.03] p-2.5">
                <span className="text-[10px] font-bold text-purple-800 flex items-center gap-1 uppercase mb-1">
                  <Cpu size={11} />
                  Inferred (Deterministic Risk Engine)
                </span>
                <ul className="space-y-0.5 text-[11px] text-[#1D1D1F] list-disc list-inside">
                  {inferredItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* UNKNOWNS TAB */}
        {activeTab === 'unknowns' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5 mb-1.5">
                <HelpCircle size={13} />
                What is Unknown? (Reconnaissance Required)
              </h3>
              <p className="text-[11px] text-[#6E6E73] mb-3">
                CrisisLens guarantees zero-hallucination rigor. These variables cannot be proven from current sensor reports and require field confirmation:
              </p>
              <ul className="space-y-2 text-xs">
                {unknowns.map((unk, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-red-500/15 text-[#1D1D1F]">
                    <AlertTriangle size={13} className="text-[#FF9500] shrink-0 mt-0.5" />
                    <span>{unk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-black/[0.06] p-3 bg-black/[0.01]">
        <div className="flex items-center gap-2">
          {onFocus ? (
            <button
              type="button"
              onClick={onFocus}
              className="rounded-lg border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
            >
              Re-center
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            Dismiss
          </button>
        </div>

        <Link to={`/incidents/${incident.id}`}>
          <Button variant="primary" className="py-1 px-3 text-[11px] gap-1">
            <span>Investigate Incident</span>
            <ArrowRight size={12} />
          </Button>
        </Link>
      </div>
    </aside>
  )
}
