import { CheckCircle2, HelpCircle, Users, Activity, Eye, Sparkles, Navigation } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatDisaster, normalizeLabel } from '../../lib/format'
import type { OpenRouterDisasterAnalysis } from '../../types/incident'

interface MultimodalIntelligencePanelProps {
  analysis: OpenRouterDisasterAnalysis
  summaryText?: string | null
}

export function MultimodalIntelligencePanel({ analysis, summaryText }: MultimodalIntelligencePanelProps) {
  const attentionLevel = normalizeLabel(analysis.recommended_attention_level)
  const confidencePct = Math.round(analysis.confidence * 100)

  return (
    <section className="space-y-6 rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs">
      {/* Header with Disaster Type & Attention Level */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#0071E3] uppercase tracking-wider">
              <Sparkles size={12} /> OpenRouter Multimodal AI
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#1D1D1F]">
            {formatDisaster(analysis.disaster_type)} Intelligence Assessment
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6E6E73]">{analysis.affected_area_description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#86868B]">Attention Level:</span>
          <Badge kind="severity">{attentionLevel}</Badge>
        </div>
      </div>

      {/* Summary Narrative */}
      {summaryText || analysis.observed_conditions.length > 0 ? (
        <div className="rounded-xl border border-black/[0.05] bg-black/[0.015] p-3.5">
          <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Situation Summary</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-[#1D1D1F]">
            {summaryText || analysis.observed_conditions.join('. ')}
          </p>
        </div>
      ) : null}

      {/* 2-Column Grid: Visible Damage & People at Risk */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Visible Damage */}
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
            <Eye size={13} className="text-[#0071E3]" />
            <span>Visible Damage Assessment</span>
          </div>
          {analysis.visible_damage && analysis.visible_damage.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {analysis.visible_damage.map((dmg, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-[#1D1D1F]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D70015] shrink-0" />
                  <span>{dmg}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[#86868B]">No visible structural destruction recorded.</p>
          )}
        </div>

        {/* People at Risk */}
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
            <Users size={13} className="text-[#FF9500]" />
            <span>Population & Life Safety</span>
          </div>
          <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-[#1D1D1F]">
            {analysis.possible_people_at_risk || 'No direct human exposure visible in evidence.'}
          </p>
        </div>
      </div>

      {/* Accessibility & Road Issues */}
      {analysis.accessibility_issues && analysis.accessibility_issues.length > 0 ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-800 uppercase">
            <Navigation size={13} />
            <span>Accessibility & Transit Blockages</span>
          </div>
          <ul className="mt-2 space-y-1">
            {analysis.accessibility_issues.map((issue, idx) => (
              <li key={idx} className="flex items-center gap-2 text-[13px] font-medium text-amber-950">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Severity Indicators */}
      {analysis.severity_indicators && analysis.severity_indicators.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Severity Indicators</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.severity_indicators.map((ind, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-2.5 py-1 text-[11px] font-semibold text-[#D70015]"
              >
                <Activity size={11} /> {ind}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Supporting Evidence (What is Known) vs Unknown Information (What is Unknown) */}
      <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-black/[0.06]">
        {/* Supporting Evidence */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#248A3D] uppercase">
            <CheckCircle2 size={13} />
            <span>Supporting Evidence (What Is Known)</span>
          </div>
          {analysis.supporting_evidence && analysis.supporting_evidence.length > 0 ? (
            <ul className="space-y-1.5">
              {analysis.supporting_evidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px] text-[#1D1D1F]">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#34C759]/15 text-[#248A3D] mt-0.5 text-[9px] font-bold">
                    ✓
                  </span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#86868B]">No visual evidence points extracted.</p>
          )}
        </div>

        {/* Unknown Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF9500] uppercase">
            <HelpCircle size={13} />
            <span>Unconfirmed Variables (What Is Unknown)</span>
          </div>
          {analysis.unknown_information && analysis.unknown_information.length > 0 ? (
            <ul className="space-y-1.5">
              {analysis.unknown_information.map((unk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px] text-[#8A5800]">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 mt-0.5 text-[9px] font-bold">
                    ?
                  </span>
                  <span>{unk}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#86868B]">No unconfirmed variables flagged.</p>
          )}
        </div>
      </div>

      {/* Confidence Footer with Explicit Non-Proof Disclaimer */}
      <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-[11px] text-[#6E6E73]">
        <div className="flex items-center justify-between font-mono font-semibold text-[#1D1D1F]">
          <span>AI Observation Certainty</span>
          <span className="text-[#0071E3]">{confidencePct}%</span>
        </div>
        <p className="mt-1 leading-relaxed">
          <strong>Important Decision-Support Notice:</strong> Confidence score indicates model certainty over provided inputs, NOT proof of ground truth. Human incident commander review is always required before asset deployment.
        </p>
      </div>
    </section>
  )
}
