import { Check } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Incident } from '../../types/incident'

export function ExplainabilityPanel({ incident }: { incident: Incident }) {
  const factors = incident.severityBreakdown?.factors ?? []
  const evidence = incident.evidence
  const reasons = incident.priorityBreakdown?.reasons ?? []
  const data = factors.map((factor) => ({
    name: factor.factor,
    score: factor.score,
  }))

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Decision Explainability</p>
      <h3 className="mt-1.5 text-base font-bold tracking-tight text-[#1D1D1F]">
        Why was this incident rated {incident.severityLabel ?? 'MEDIUM'}?
      </h3>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Observed Evidence Rules</p>
        <ul className="space-y-1.5">
          {evidence.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#34C759]/15 text-[#248A3D] mt-0.5">
                <Check size={11} strokeWidth={3} />
              </span>
              <span>{item}</span>
            </li>
          ))}
          {evidence.length === 0 ? (
            <li className="text-sm text-[#86868B]">No visual evidence statements were returned.</li>
          ) : null}
        </ul>
      </div>

      {reasons.length > 0 ? (
        <div className="mt-4 rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5">
          <p className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Triage Determinants</p>
          <ul className="mt-1.5 space-y-1 text-sm text-[#1D1D1F]">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Contributing Factor Weights</p>
          <div className="h-48 w-full rounded-xl bg-black/[0.015] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#6E6E73', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 10,
                    color: '#1D1D1F',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="score" fill="#0071E3" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3 font-mono">
        <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Aggregate Calculated Score</span>
        <span className="text-base font-bold text-[#1D1D1F]">
          {Math.round(incident.severityBreakdown?.normalized_score ?? incident.severityScore ?? 0)} / 100
        </span>
      </div>
    </section>
  )
}
