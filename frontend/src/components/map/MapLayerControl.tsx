import { Layers } from 'lucide-react'
import type { MapLayerState } from '../../types/disaster'

export function MapLayerControl({
  layers,
  onToggle,
}: {
  layers: MapLayerState[]
  onToggle: (id: MapLayerState['id']) => void
}) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/90 p-3.5 shadow-lg backdrop-blur-md">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">
        <Layers size={13} className="text-[#0071E3]" />
        <span>Telemetry Layers</span>
      </div>
      <div className="space-y-1.5">
        {layers.map((layer) => (
          <label
            key={layer.id}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1 text-[12px] transition-colors ${
              layer.available ? 'hover:bg-black/[0.04] text-[#1D1D1F]' : 'opacity-40 text-[#86868B] cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-black/20 text-[#0071E3] focus:ring-[#0071E3]"
                checked={layer.enabled && layer.available}
                disabled={!layer.available}
                onChange={() => onToggle(layer.id)}
              />
              <span className="font-medium">{layer.label}</span>
            </div>
            {!layer.available ? (
              <span className="text-[9px] font-semibold tracking-wide uppercase text-[#86868B]">Offline</span>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  )
}
