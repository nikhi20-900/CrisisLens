import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Map as LeafletMap, LatLngBoundsExpression } from 'leaflet'
import { caseId, confidencePercent, formatDisaster, normalizeLabel, scoreValue, timeAgo } from '../../lib/format'
import type { EarthquakeEvent, FireHotspot, MapLayerState, NearbyPlace } from '../../types/disaster'
import type { Incident } from '../../types/incident'
import { MapControls } from './MapControls'
import { MapLayerControl } from './MapLayerControl'
import { MapLegend } from './MapLegend'
import {
  createCrisisZoneIcon,
  createEarthquakeIcon,
  createFireIcon,
  createNearbyPoiIcon,
} from './leafletIcons'

interface IncidentMapProps {
  incidents: Incident[]
  earthquakes?: EarthquakeEvent[]
  fires?: FireHotspot[]
  nearby?: NearbyPlace[]
  selectedId?: number | null
  onSelect?: (id: number) => void
  onMapClick?: (lngLat: { lat: number; lng: number }) => void
  layers: MapLayerState[]
  onToggleLayer: (id: MapLayerState['id']) => void
  pickMode?: boolean
  className?: string
}

function getZoneRadius(priority: string): number {
  const norm = (priority ?? 'LOW').toUpperCase()
  switch (norm) {
    case 'CRITICAL':
      return 1200
    case 'HIGH':
      return 850
    case 'MEDIUM':
      return 550
    default:
      return 350
  }
}

function getZoneColor(priority: string) {
  const norm = (priority ?? 'LOW').toUpperCase()
  switch (norm) {
    case 'CRITICAL':
      return { stroke: '#dc2626', fill: '#ef4444' }
    case 'HIGH':
      return { stroke: '#ea580c', fill: '#f97316' }
    case 'MEDIUM':
      return { stroke: '#ca8a04', fill: '#eab308' }
    default:
      return { stroke: '#2563eb', fill: '#3b82f6' }
  }
}

// Map Controller for programmatically controlling the Leaflet Map instance
function MapController({
  selectedIncident,
  pickMode,
  onMapClick,
  onMapReady,
  allIncidents,
}: {
  selectedIncident?: Incident
  pickMode?: boolean
  onMapClick?: (coord: { lat: number; lng: number }) => void
  onMapReady: (map: LeafletMap) => void
  allIncidents: Incident[]
}) {
  const map = useMap()
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    onMapReady(map)
  }, [map, onMapReady])

  // Click handler for pickMode
  useMapEvents({
    click(e) {
      if (pickMode && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    },
  })

  // Fit bounds initially if valid coordinates exist
  useEffect(() => {
    if (hasInitializedRef.current) return
    const valid = allIncidents.filter((i) => i.latitude != null && i.longitude != null)
    if (valid.length > 0) {
      const bounds: LatLngBoundsExpression = valid.map((i) => [i.latitude as number, i.longitude as number])
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 })
      hasInitializedRef.current = true
    }
  }, [allIncidents, map])

  // Center on selected incident
  useEffect(() => {
    if (!selectedIncident?.latitude || !selectedIncident.longitude) return
    map.flyTo([selectedIncident.latitude, selectedIncident.longitude], Math.max(map.getZoom(), 12), {
      duration: 1.2,
      easeLinearity: 0.25,
    })
  }, [map, selectedIncident])

  return null
}

export function IncidentMap({
  incidents,
  earthquakes = [],
  fires = [],
  nearby = [],
  selectedId,
  onSelect,
  onMapClick,
  layers,
  onToggleLayer,
  pickMode = false,
  className = '',
}: IncidentMapProps) {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const navigate = useNavigate()

  const isLayerEnabled = (id: MapLayerState['id']) => {
    const l = layers.find((layer) => layer.id === id)
    return Boolean(l?.enabled && l.available)
  }

  const validIncidents = useMemo(
    () => incidents.filter((i) => i.latitude != null && i.longitude != null),
    [incidents]
  )

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedId),
    [incidents, selectedId]
  )

  const defaultCenter: [number, number] = useMemo(() => {
    if (selectedIncident?.latitude && selectedIncident.longitude) {
      return [selectedIncident.latitude, selectedIncident.longitude]
    }
    if (validIncidents.length > 0) {
      return [validIncidents[0].latitude as number, validIncidents[0].longitude as number]
    }
    return [12.9716, 77.5946] // Bangalore default
  }, [selectedIncident, validIncidents])

  function handleResetView() {
    if (!mapInstance || validIncidents.length === 0) return
    const bounds: LatLngBoundsExpression = validIncidents.map((i) => [i.latitude as number, i.longitude as number])
    mapInstance.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 })
  }

  return (
    <div className={`relative min-h-[360px] w-full overflow-hidden rounded-2xl border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* OpenStreetMap Standard Tiles (No API key required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          selectedIncident={selectedIncident}
          pickMode={pickMode}
          onMapClick={onMapClick}
          onMapReady={setMapInstance}
          allIncidents={validIncidents}
        />

        {/* 1. Crisis Zones & Incidents Layer */}
        {isLayerEnabled('incidents') &&
          validIncidents.map((incident) => {
            const lat = incident.latitude as number
            const lng = incident.longitude as number
            const normPriority = normalizeLabel(incident.priorityLabel)
            const zoneColors = getZoneColor(normPriority)
            const radiusMeters = getZoneRadius(normPriority)
            const isSelected = incident.id === selectedId
            const updateCount = incident.evolutionHistory?.length ?? 1
            const icon = createCrisisZoneIcon({
              priority: normPriority,
              disasterType: incident.disasterType,
              updateCount,
              isSelected,
            })

            const openAnalysis = incident.openrouterAnalysis
            const unknowns = openAnalysis?.unknown_information ?? []

            return (
              <div key={`incident-group-${incident.id}`}>
                {/* Dynamic Affected Hazard Area Circle */}
                <Circle
                  center={[lat, lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: zoneColors.stroke,
                    fillColor: zoneColors.fill,
                    fillOpacity: isSelected ? 0.28 : 0.16,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: normPriority === 'CRITICAL' ? undefined : '4, 4',
                  }}
                  eventHandlers={{
                    click: () => onSelect?.(incident.id),
                  }}
                />

                {/* Priority Marker with Rich Visual Indicator & Badge */}
                <Marker
                  position={[lat, lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelect?.(incident.id),
                  }}
                >
                  {/* Crisis Zone Interactive Popup */}
                  <Popup className="crisis-zone-popup">
                    <div className="w-[280px] max-w-[85vw] font-sans">
                      {/* Header with Zone ID & Priority */}
                      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                        <div>
                          <div className="font-mono text-[9px] font-bold text-[#86868B] uppercase tracking-wider">
                            {caseId(incident.id)}
                            {incident.crisisZoneId ? ` · ${incident.crisisZoneId}` : ''}
                          </div>
                          <div className="text-[13px] font-bold text-[#1D1D1F] leading-snug">
                            {incident.crisisZoneName || formatDisaster(incident.disasterType)}
                          </div>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold font-mono text-white ${
                            normPriority === 'CRITICAL'
                              ? 'bg-[#FF3B30]'
                              : normPriority === 'HIGH'
                              ? 'bg-[#FF9500]'
                              : normPriority === 'MEDIUM'
                              ? 'bg-[#D97706]'
                              : 'bg-[#0071E3]'
                          }`}
                        >
                          {normPriority}
                        </span>
                      </div>

                      {/* Location & Evolution Count */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6E6E73]">
                        <span className="truncate max-w-[190px]">{incident.locationName ?? 'Verified Coordinates'}</span>
                        {updateCount > 1 ? (
                          <span className="font-mono text-[9px] font-bold bg-amber-500/15 text-amber-800 px-1 rounded">
                            {updateCount} Updates
                          </span>
                        ) : null}
                      </div>

                      {/* Current Situation */}
                      <div className="mt-2 text-[11px] leading-relaxed text-[#1D1D1F] bg-black/[0.02] p-2 rounded-lg border border-black/[0.04]">
                        <span className="font-semibold text-[#86868B] block text-[9px] uppercase tracking-wider mb-0.5">
                          Current Situation
                        </span>
                        {openAnalysis?.affected_area_description || incident.reportText}
                      </div>

                      {/* Priority Determinant Reason */}
                      {incident.priorityChangeReason ? (
                        <div className="mt-1.5 text-[10px] text-amber-800 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 leading-tight">
                          <strong className="block text-[8px] uppercase tracking-wider">Evolution Trigger</strong>
                          {incident.priorityChangeReason}
                        </div>
                      ) : null}

                      {/* People at Risk & Accessibility */}
                      <div className="mt-2 space-y-1 text-[11px]">
                        {openAnalysis?.possible_people_at_risk ? (
                          <div className="text-[#1D1D1F]">
                            <strong className="text-red-700">People at risk: </strong>
                            <span>{openAnalysis.possible_people_at_risk}</span>
                          </div>
                        ) : null}

                        {openAnalysis?.accessibility_issues && openAnalysis.accessibility_issues.length > 0 ? (
                          <div className="text-[#1D1D1F]">
                            <strong className="text-amber-700">Access/Roads: </strong>
                            <span>{openAnalysis.accessibility_issues[0]}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Known vs Unknown Brief */}
                      {unknowns.length > 0 ? (
                        <div className="mt-2 text-[10px] bg-red-500/[0.06] border border-red-500/15 rounded p-1.5 text-[#1D1D1F]">
                          <strong className="text-red-800 block uppercase tracking-wider text-[8px]">
                            Unknown Information ({unknowns.length})
                          </strong>
                          <span className="truncate block">• {unknowns[0]}</span>
                        </div>
                      ) : null}

                      {/* Metrics bar */}
                      <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2 text-[10px] font-mono text-[#6E6E73]">
                        <span>Priority: <strong className="text-[#0071E3]">{scoreValue(incident.priorityScore)}</strong></span>
                        <span>Confidence: <strong className="text-emerald-700">{confidencePercent(incident.confidenceScore)}%</strong></span>
                        <span>{timeAgo(incident.createdAt)}</span>
                      </div>

                      {/* Action Button */}
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                          className="w-full rounded-xl bg-[#0071E3] text-white py-1.5 px-3 text-[11px] font-bold shadow-xs hover:bg-[#0071E3]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-1"
                        >
                          <span>Investigate Full Crisis Zone</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            )
          })}

        {/* 2. Earthquakes Layer (USGS) */}
        {isLayerEnabled('earthquakes') &&
          earthquakes.map((eq) => (
            <div key={`eq-${eq.event_id}`}>
              <Circle
                center={[eq.latitude, eq.longitude]}
                radius={Math.max(5000, eq.magnitude * 15000)}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 1,
                }}
              />
              <Marker
                position={[eq.latitude, eq.longitude]}
                icon={createEarthquakeIcon(eq.magnitude)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <span className="font-mono text-[9px] font-bold text-blue-700 uppercase">USGS Seismic Event</span>
                    <h4 className="font-bold text-sm text-[#1D1D1F] mt-0.5">Magnitude {eq.magnitude.toFixed(1)}</h4>
                    <p className="text-[11px] text-[#6E6E73] mt-1">{eq.location}</p>
                    <p className="text-[10px] text-[#86868B] mt-1 font-mono">Depth: {eq.depth_km ?? 'N/A'} km</p>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}

        {/* 3. Fires Layer (NASA FIRMS) */}
        {isLayerEnabled('fires') &&
          fires.map((fire, idx) => (
            <Marker
              key={`fire-${idx}-${fire.latitude}-${fire.longitude}`}
              position={[fire.latitude, fire.longitude]}
              icon={createFireIcon()}
            >
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <span className="font-mono text-[9px] font-bold text-orange-700 uppercase">NASA FIRMS Thermal Spot</span>
                  <p className="text-[11px] text-[#1D1D1F] mt-0.5">Satellite detected thermal anomaly</p>
                  <p className="text-[10px] text-[#6E6E73] mt-1">Confidence: {fire.confidence ?? 'Nominal'}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Nearby Emergency Amenities (OpenStreetMap POIs) */}
        {(isLayerEnabled('hospitals') || isLayerEnabled('shelters')) &&
          nearby.map((place, idx) => {
            if (place.latitude == null || place.longitude == null) return null
            return (
              <Marker
                key={`poi-${idx}-${place.name}`}
                position={[place.latitude, place.longitude]}
                icon={createNearbyPoiIcon(place.type)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <span className="font-mono text-[9px] font-bold text-emerald-700 uppercase">Emergency Amenity</span>
                    <h4 className="font-bold text-[12px] text-[#1D1D1F] mt-0.5">{place.name}</h4>
                    <p className="text-[10px] text-[#6E6E73] mt-0.5 capitalize">{place.type}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>

      {/* Glassmorphic Layer Control (Top Left) */}
      <div className="pointer-events-auto absolute left-3 top-3 z-[1000] max-w-xs">
        <MapLayerControl layers={layers} onToggle={onToggleLayer} />
      </div>

      {/* Glassmorphic Map Controls (Top Right) */}
      <div className="pointer-events-auto absolute right-3 top-3 z-[1000]">
        <MapControls map={mapInstance} onResetView={handleResetView} />
      </div>

      {/* Living Map Triage Legend (Bottom Left) */}
      <div className="pointer-events-auto absolute bottom-6 left-3 z-[1000]">
        <MapLegend />
      </div>
    </div>
  )
}
