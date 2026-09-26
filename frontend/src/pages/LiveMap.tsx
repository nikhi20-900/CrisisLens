import { useEffect, useState } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { IncidentMap } from '../components/map/IncidentMap'
import { LivingCrisisZoneDrawer } from '../components/map/LivingCrisisZoneDrawer'
import { useApp } from '../context/AppContext'
import { getEarthquakes, getFires } from '../services/disasters'
import type { EarthquakeEvent, FireHotspot, MapLayerState } from '../types/disaster'

const LIVE_LAYERS: MapLayerState[] = [
  { id: 'incidents', label: 'Crisis Zones & Incidents', enabled: true, available: true },
  { id: 'earthquakes', label: 'USGS Earthquakes', enabled: true, available: true },
  { id: 'fires', label: 'NASA Thermal Hotspots', enabled: true, available: true },
  { id: 'hospitals', label: 'OpenStreetMap POIs', enabled: true, available: true },
  { id: 'roads', label: 'Road Networks', enabled: true, available: true },
]

export function LiveMap() {
  const { incidents } = useApp()
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([])
  const [fires, setFires] = useState<FireHotspot[]>([])
  const [layers, setLayers] = useState<MapLayerState[]>(LIVE_LAYERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    void getEarthquakes(100).then(setEarthquakes).catch(() => setEarthquakes([]))
    void getFires().then(setFires).catch(() => setFires([]))
  }, [])

  function toggleLayer(id: MapLayerState['id']) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    )
  }

  const selectedIncident = incidents.find((i) => i.id === selectedId)

  return (
    <PageContainer
      title="Living Crisis Tactical Map"
      kicker="OpenStreetMap + Leaflet Real-Time Intelligence"
      actions={
        <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.03] px-3.5 py-1 font-mono text-[11px] font-medium text-[#6E6E73]">
          <span><strong className="text-[#1D1D1F]">{incidents.length}</strong> Crisis Zones</span>
          <span>·</span>
          <span><strong className="text-[#1D1D1F]">{earthquakes.length}</strong> Earthquakes</span>
          <span>·</span>
          <span><strong className="text-[#1D1D1F]">{fires.length}</strong> Thermal Spots</span>
        </div>
      }
    >
      <div className="relative h-[calc(100vh-13rem)] min-h-[540px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xs">
        <IncidentMap
          incidents={incidents}
          earthquakes={earthquakes}
          fires={fires}
          selectedId={selectedId}
          onSelect={setSelectedId}
          layers={layers}
          onToggleLayer={toggleLayer}
          className="h-full w-full rounded-none border-none"
        />

        {/* Selected Crisis Zone Living Intelligence Drawer */}
        {selectedIncident ? (
          <LivingCrisisZoneDrawer
            incident={selectedIncident}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </PageContainer>
  )
}
