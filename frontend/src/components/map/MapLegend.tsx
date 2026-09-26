import { AlertTriangle, Flame, AlertCircle, Info } from 'lucide-react'

export function MapLegend() {
  const items = [
    { label: 'Critical', tag: 'CRIT', color: 'bg-[#FF3B30] text-white', icon: AlertTriangle, desc: 'Immediate life-safety' },
    { label: 'High', tag: 'HIGH', color: 'bg-[#FF9500] text-white', icon: Flame, desc: 'Severe disruption' },
    { label: 'Medium', tag: 'MED', color: 'bg-[#D97706] text-white', icon: AlertCircle, desc: 'Moderate hazard' },
    { label: 'Low', tag: 'LOW', color: 'bg-[#0071E3] text-white', icon: Info, desc: 'Monitoring only' },
  ]

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/95 p-3.5 shadow-lg backdrop-blur-md max-w-[210px]">
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5 mb-2">
        <span className="text-[10px] font-bold tracking-wider text-[#86868B] uppercase">Triage Hierarchy</span>
        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">OSM TILES</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.label} className="flex items-center gap-2 text-[11px] font-medium text-[#1D1D1F]">
              <span className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shadow-2xs ${item.color}`}>
                <Icon size={10} strokeWidth={2.5} />
                <span>{item.tag}</span>
              </span>
              <span className="font-semibold">{item.label}</span>
            </li>
          )
        })}
      </ul>
      <div className="mt-2.5 pt-2 border-t border-black/[0.05] text-[10px] text-[#86868B] leading-tight">
        Circle radius reflects evaluated hazard zone impact area.
      </div>
    </div>
  )
}
