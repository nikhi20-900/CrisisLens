import { CheckCircle2, HelpCircle, Users, Activity, Eye, Sparkles, Navigation, AlertCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatDisaster, normalizeLabel } from '../../lib/format'
import type { GeminiDisasterAnalysis } from '../../types/incident'

interface MultimodalIntelligencePanelProps {
  analysis: GeminiDisasterAnalysis
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
              <Sparkles size={12} /> Google Gemini Multimodal AI
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

      {/* EXPLAINABILITY SECTION 1: WHY IS THIS PRIORITY? */}
      <div className="rounded-xl border border-[#0071E3]/20 bg-[#0071E3]/[0.02] p-4.5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#0071E3]/15 pb-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-[#0071E3]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
              Why is this priority?
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#1D1D1F]">
            Attention Level: {attentionLevel}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Supporting Evidence */}
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#248A3D] flex items-center gap-1">
              <CheckCircle2 size={12} /> Supporting Evidence
            </p>
            {analysis.supporting_evidence && analysis.supporting_evidence.length > 0 ? (
              <ul className="space-y-1">
                {analysis.supporting_evidence.map((ev, idx) => (
                  <li key={idx} className="text-[12px] text-[#1D1D1F] flex items-start gap-1.5">
                    <span className="text-[#248A3D] font-bold">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-[#86868B]">No specific evidence points listed.</p>
            )}
          </div>

          {/* Severity Indicators */}
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#D70015] flex items-center gap-1">
              <Activity size={12} /> Severity Indicators
            </p>
            {analysis.severity_indicators && analysis.severity_indicators.length > 0 ? (
              <ul className="space-y-1">
                {analysis.severity_indicators.map((ind, idx) => (
                  <li key={idx} className="text-[12px] text-[#1D1D1F] flex items-start gap-1.5">
                    <span className="text-[#D70015] font-bold">•</span>
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-[#86868B]">No severity indicators specified.</p>
            )}
          </div>

          {/* People Potentially at Risk */}
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF9500] flex items-center gap-1">
              <Users size={12} /> People Potentially at Risk
            </p>
            <p className="text-[12px] text-[#1D1D1F]">
              {analysis.possible_people_at_risk || 'No direct human risk detected in evidence.'}
            </p>
          </div>

          {/* Accessibility Issues */}
          <div className="rounded-lg border border-black/[0.06] bg-white p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A5800] flex items-center gap-1">
              <Navigation size={12} /> Accessibility Issues
            </p>
            {analysis.accessibility_issues && analysis.accessibility_issues.length > 0 ? (
              <ul className="space-y-1">
                {analysis.accessibility_issues.map((iss, idx) => (
                  <li key={idx} className="text-[12px] text-[#1D1D1F] flex items-start gap-1.5">
                    <span className="text-[#8A5800] font-bold">•</span>
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-[#86868B]">No accessibility or transit blockages reported.</p>
            )}
          </div>
        </div>
      </div>

      {/* EXPLAINABILITY SECTION 2: WHAT IS UNKNOWN? */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-4.5 space-y-2.5">
        <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
          <HelpCircle size={15} className="text-amber-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            What is unknown?
          </h3>
        </div>
        <p className="text-[11px] text-amber-800/80">
          The following factors cannot be established from the supplied evidence and require human confirmation or field inspection:
        </p>

        {analysis.unknown_information && analysis.unknown_information.length > 0 ? (
          <ul className="space-y-1.5">
            {analysis.unknown_information.map((unk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[12px] text-amber-950 font-medium">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-bold mt-0.5">
                  ?
                </span>
                <span>{unk}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-[#86868B]">No explicit unknown factors flagged.</p>
        )}
      </div>

      {/* Observable Features: Visible Damage & Observed Conditions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Visible Damage */}
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
            <Eye size={13} className="text-[#0071E3]" />
            <span>Visible Damage Assessment (Observed in Image)</span>
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

        {/* Observed Conditions */}
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
            <Activity size={13} className="text-[#34C759]" />
            <span>Directly Observed Physical Phenomena</span>
          </div>
          {analysis.observed_conditions && analysis.observed_conditions.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {analysis.observed_conditions.map((cond, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-[#1D1D1F]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#34C759] shrink-0" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[#86868B]">No specific conditions reported.</p>
          )}
        </div>
      </div>

      {/* Decision Support Disclaimer & Confidence (Do NOT present as proof of correctness) */}
      <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-[11px] text-[#6E6E73] space-y-1.5">
        <div className="flex items-center justify-between font-mono font-semibold text-[#1D1D1F]">
          <span>AI Evidence Model Certainty</span>
          <span className="text-[#0071E3]">{confidencePct}%</span>
        </div>
        <p className="leading-relaxed">
          <strong>Important Decision-Support Notice:</strong> The confidence score is an internal model certainty metric over provided inputs and must <em>never</em> be interpreted as proof of ground truth or final emergency authority. Human incident commander review is always required before asset deployment.
        </p>
      </div>
    </section>
  )
}
