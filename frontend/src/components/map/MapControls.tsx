import { Minus, Plus, Compass } from 'lucide-react'
import type { Map as LeafletMap } from 'leaflet'

interface MapControlsProps {
  map: LeafletMap | null
  onResetView?: () => void
}

export function MapControls({ map, onResetView }: MapControlsProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white/95 shadow-lg backdrop-blur-md">
      <button
        type="button"
        className="p-2 text-[#1D1D1F] transition-colors hover:bg-black/[0.05] active:bg-black/[0.1]"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={() => map?.zoomIn()}
      >
        <Plus size={15} strokeWidth={2.2} />
      </button>
      <div className="h-px w-full bg-black/[0.06]" />
      <button
        type="button"
        className="p-2 text-[#1D1D1F] transition-colors hover:bg-black/[0.05] active:bg-black/[0.1]"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={() => map?.zoomOut()}
      >
        <Minus size={15} strokeWidth={2.2} />
      </button>
      {onResetView ? (
        <>
          <div className="h-px w-full bg-black/[0.06]" />
          <button
            type="button"
            className="p-2 text-[#1D1D1F] transition-colors hover:bg-black/[0.05] active:bg-black/[0.1]"
            aria-label="Reset map view"
            title="Reset to all incidents"
            onClick={onResetView}
          >
            <Compass size={15} strokeWidth={2} />
          </button>
        </>
      ) : null}
    </div>
  )
}
