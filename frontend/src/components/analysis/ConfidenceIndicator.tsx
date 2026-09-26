import { AlertCircle, CheckCircle } from 'lucide-react'
import { confidenceLevel, confidencePercent } from '../../lib/format'

export function ConfidenceIndicator({ score, flag }: { score?: number | null; flag?: boolean | null }) {
  const pct = confidencePercent(score)
  const level = confidenceLevel(score)
  const review = Boolean(flag) || level === 'LOW'

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs transition-all ${
        review
          ? 'border-amber-500/25 bg-amber-500/[0.04]'
          : 'border-black/[0.06] bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Evidence Confidence</p>
        {review ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <AlertCircle size={13} /> Review Flag
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle size={13} /> Grounded
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-[#1D1D1F]">{pct}%</p>
        <span className="text-[12px] font-semibold text-[#86868B] uppercase tracking-wider">{level} Rating</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 75 ? 'bg-[#34C759]' : pct >= 50 ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'
          }`}
          style={{ width: `${Math.min(Math.max(pct, 5), 100)}%` }}
        />
      </div>

      {review ? (
        <p className="mt-3 text-[12px] font-medium text-amber-800">
          Uncertainty detected in source telemetry. Operator review required before deployment.
        </p>
      ) : null}
    </div>
  )
}
