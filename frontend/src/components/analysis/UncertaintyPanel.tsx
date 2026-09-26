import { AlertTriangle, CheckCircle } from 'lucide-react'

export function UncertaintyPanel({
  flag,
  reason,
  factors,
}: {
  flag?: boolean | null
  reason?: string | null
  factors?: string[]
}) {
  if (!flag && (!factors || factors.length === 0)) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
        <CheckCircle size={16} className="text-[#34C759]" />
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Uncertainty State</p>
          <p className="mt-0.5 text-sm text-[#1D1D1F]">
            Telemetry confidence exceeds threshold. No critical uncertainty flags active.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-5 shadow-xs" role="status">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-amber-800 uppercase">
        <AlertTriangle size={15} className="text-amber-600" />
        <span>Human Verification Recommended</span>
      </div>
      <p className="mt-2 text-sm text-amber-950 font-medium">
        {reason || 'The available evidence has incomplete sensory coverage. Decision support requires officer review.'}
      </p>
      {factors && factors.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
          {factors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
