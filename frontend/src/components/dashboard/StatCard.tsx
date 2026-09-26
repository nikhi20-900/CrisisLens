import { Link } from 'react-router-dom'

export function StatCard({
  label,
  value,
  to,
  tone = 'default',
}: {
  label: string
  value: number
  to: string
  tone?: 'default' | 'critical' | 'high' | 'medium' | 'review'
}) {
  const accentStyles = {
    default: {
      dot: 'bg-[#0071E3]',
      badge: 'text-[#0071E3] bg-[#0071E3]/10',
    },
    critical: {
      dot: 'bg-[#FF3B30]',
      badge: 'text-[#D70015] bg-red-500/10',
    },
    high: {
      dot: 'bg-[#FF9500]',
      badge: 'text-[#C97000] bg-orange-500/10',
    },
    medium: {
      dot: 'bg-[#D97706]',
      badge: 'text-[#B26400] bg-amber-500/10',
    },
    review: {
      dot: 'bg-[#AF52DE]',
      badge: 'text-[#8E24AA] bg-purple-500/10',
    },
  }

  const { dot } = accentStyles[tone]

  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dot} opacity-80 transition-transform group-hover:scale-125`} />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[#1D1D1F]">{value}</p>
    </Link>
  )
}
