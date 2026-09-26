import { MapPin, Image as ImageIcon } from 'lucide-react'
import { resolveAssetUrl } from '../../services/api'
import type { Incident } from '../../types/incident'

export function EvidencePanel({ incident }: { incident: Incident }) {
  const image = resolveAssetUrl(incident.imageUrl)

  return (
    <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Visual & Field Evidence</p>
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#86868B]">
          <ImageIcon size={12} /> {image ? 'Photo Attached' : 'No Media'}
        </span>
      </div>

      {image ? (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.02]">
          <img
            src={image}
            alt="Incident evidence"
            className="max-h-72 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/[0.12] bg-black/[0.015] px-4 py-8 text-center text-sm text-[#86868B]">
          No photographic evidence submitted with this report.
        </div>
      )}

      <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5">
        <p className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Citizen / Field Report</p>
        <p className="mt-1 text-sm text-[#1D1D1F] leading-relaxed">
          {incident.reportText || 'No textual description provided.'}
        </p>
      </div>

      <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">
          <MapPin size={12} className="text-[#0071E3]" />
          <span>Report Coordinates</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-[#1D1D1F]">{incident.locationName ?? 'Location Unspecified'}</p>
        <p className="mt-0.5 font-mono text-[11px] text-[#86868B]">
          {incident.latitude?.toFixed(4) ?? '—'}, {incident.longitude?.toFixed(4) ?? '—'}
        </p>
      </div>
    </section>
  )
}
