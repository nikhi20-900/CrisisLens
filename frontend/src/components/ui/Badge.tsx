import { normalizeLabel } from '../../lib/format'

const tone: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-[#D70015] border-red-500/20',
  HIGH: 'bg-orange-500/10 text-[#C97000] border-orange-500/20',
  MEDIUM: 'bg-amber-500/10 text-[#B26400] border-amber-500/20',
  LOW: 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20',
  DEMO: 'bg-purple-500/10 text-[#8E24AA] border-purple-500/20',
  PENDING: 'bg-amber-500/10 text-[#B26400] border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  MODIFIED: 'bg-black/[0.05] text-[#48484A] border-black/[0.08]',
  ESCALATED: 'bg-red-500/10 text-[#D70015] border-red-500/20',
  LIVE: 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  AI: 'bg-indigo-500/10 text-[#5856D6] border-indigo-500/20',
  HUMAN: 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  CONNECTED: 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  UNAVAILABLE: 'bg-red-500/10 text-[#D70015] border-red-500/20',
  OPTIONAL: 'bg-black/[0.04] text-[#6E6E73] border-black/[0.06]',
  VERIFIED: 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  'HUMAN VERIFIED': 'bg-emerald-500/10 text-[#248A3D] border-emerald-500/20',
  'PENDING REVIEW': 'bg-amber-500/10 text-[#B26400] border-amber-500/20',
  'REVIEW PENDING': 'bg-amber-500/10 text-[#B26400] border-amber-500/20',
}

interface BadgeProps {
  children: string
  kind?: 'severity' | 'status' | 'plain' | 'default'
  className?: string
}

export function Badge({ children, kind = 'plain', className = '' }: BadgeProps) {
  const key = kind === 'severity' ? normalizeLabel(children) : children.toUpperCase()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
        tone[key] ?? 'bg-black/[0.04] text-[#6E6E73] border-black/[0.06]'
      } ${className}`}
    >
      {kind === 'severity' ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  )
}
