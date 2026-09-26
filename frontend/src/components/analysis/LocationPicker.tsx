import { useEffect, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { searchPlaces } from '../../services/map'
import type { GeocodeResult } from '../../types/disaster'

export function LocationPicker({
  latitude,
  longitude,
  locationName,
  onChange,
}: {
  latitude?: number
  longitude?: number
  locationName?: string
  onChange: (next: { latitude: number; longitude: number; locationName: string }) => void
}) {
  const [query, setQuery] = useState(locationName ?? '')
  const [results, setResults] = useState<GeocodeResult[]>([])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void searchPlaces(query).then(setResults)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query])

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Incident Location Search</span>
        <div className="relative mt-1">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-[#86868B]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search address, landmark, or coordinates..."
            className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] py-2.5 pl-9 pr-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
          />
        </div>
      </label>

      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg">
          {results.map((result) => (
            <li key={`${result.latitude}-${result.longitude}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-[#1D1D1F] hover:bg-black/[0.03] transition-colors"
                onClick={() => {
                  onChange({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    locationName: result.place_name,
                  })
                  setQuery(result.place_name)
                  setResults([])
                }}
              >
                <MapPin size={14} className="shrink-0 text-[#0071E3]" />
                <span className="truncate">{result.place_name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Field label="Latitude" value={latitude?.toFixed(4) ?? '—'} />
        <Field label="Longitude" value={longitude?.toFixed(4) ?? '—'} />
        <Field label="Location Tag" value={locationName || '—'} />
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5">
      <p className="text-[9px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-[#1D1D1F]">{value}</p>
    </div>
  )
}
