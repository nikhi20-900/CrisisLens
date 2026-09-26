import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import type { Recommendation } from '../../types/incident'

export function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
  const [open, setOpen] = useState<number | null>(0)

  if (recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 text-sm text-[#86868B] shadow-xs">
        No immediate action recommendations generated. Standard monitoring applies.
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2">
        <ShieldAlert size={14} className="text-[#0071E3]" />
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Recommended Decision Actions</p>
      </div>

      <ol className="mt-4 space-y-2.5">
        {recommendations.map((item, index) => {
          const isOpen = open === index
          return (
            <li
              key={`${item.action}-${index}`}
              className="rounded-xl border border-black/[0.05] bg-black/[0.015] p-3.5 transition-all hover:bg-black/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/10 text-[11px] font-bold text-[#0071E3]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{item.action}</p>
                    {isOpen && item.reason ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#6E6E73]">{item.reason}</p>
                    ) : null}
                  </div>
                </div>

                {item.reason ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#0071E3] hover:bg-[#0071E3]/10"
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span>{isOpen ? 'Less' : 'Why?'}</span>
                    {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
