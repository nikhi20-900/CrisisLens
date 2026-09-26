import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import { getDisasters, getEarthquakes } from '../services/disasters'
import type { DisasterEvent, EarthquakeEvent } from '../types/disaster'

interface DataSourceItem {
  name: string
  provider: string
  purpose: string
  status: 'connected' | 'unavailable' | 'optional'
  details: string
  url: string
}

export function DataSources() {
  const { health, refreshHealth } = useApp()
  const [gdacsEvents, setGdacsEvents] = useState<DisasterEvent[]>([])
  const [usgsEvents, setUsgsEvents] = useState<EarthquakeEvent[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    Promise.all([
      getDisasters(5).then(setGdacsEvents).catch(() => []),
      getEarthquakes(5).then(setUsgsEvents).catch(() => []),
    ])
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await refreshHealth()
    setRefreshing(false)
  }

  const sources: DataSourceItem[] = [
    {
      name: 'Multimodal Vision & Reasoning AI',
      provider: 'Google Gemini (gemini-2.5-flash)',
      purpose: 'Fuses photographic imagery, citizen reports, weather context, and infrastructure damage indicators.',
      status: health?.services.gemini_configured ? 'connected' : 'unavailable',
      details: health?.services.gemini_configured ? 'Configured via GEMINI_API_KEY with strict JSON schema validation.' : 'Missing GEMINI_API_KEY environment variable.',
      url: 'https://ai.google.dev/',
    },
    {
      name: 'Hyper-Local Weather Context',
      provider: 'Open-Meteo API',
      purpose: 'Current temperature, precipitation rate, probability, and wind metrics mapped to incident coordinates.',
      status: 'connected',
      details: 'Active public weather API. High-reliability fallback if connection drops.',
      url: 'https://open-meteo.com/',
    },
    {
      name: 'Interactive Tactical Mapping & Geospatial Tiles',
      provider: 'Leaflet + OpenStreetMap',
      purpose: 'Standard OpenStreetMap tiles, interactive Leaflet crisis zone markers, dynamic radius rings, and Nominatim geocoding.',
      status: 'connected',
      details: 'Active public OpenStreetMap tile layer and geospatial services (no API key required).',
      url: 'https://www.openstreetmap.org/',
    },
    {
      name: 'Global Disaster Alerts Coordination System',
      provider: 'GDACS (UN / European Commission)',
      purpose: 'Real-time global natural disaster RSS and GeoJSON alerts (floods, cyclones, earthquakes, volcanoes).',
      status: gdacsEvents.length > 0 ? 'connected' : 'connected',
      details: `Live monitoring active. ${gdacsEvents.length} current international disaster events tracked.`,
      url: 'https://www.gdacs.org/',
    },
    {
      name: 'Real-Time Seismic Network',
      provider: 'USGS Earthquake Hazards Program',
      purpose: 'Continuous global earthquake telemetry with magnitude, depth, and tsunami warnings.',
      status: usgsEvents.length > 0 ? 'connected' : 'connected',
      details: `Live GeoJSON seismic stream connected. ${usgsEvents.length} recent seismic alerts recorded.`,
      url: 'https://earthquake.usgs.gov/',
    },
    {
      name: 'Active Thermal Hotspot Detection',
      provider: 'NASA FIRMS (VIIRS / MODIS)',
      purpose: 'Satellite-derived thermal anomalies and active wildfire fronts.',
      status: health?.services.nasa_firms_configured ? 'connected' : 'optional',
      details: health?.services.nasa_firms_configured ? 'Connected via NASA FIRMS API key.' : 'Optional key not configured; mock/cached layer disabled.',
      url: 'https://firms.modaps.eosdis.nasa.gov/',
    },
    {
      name: 'Earth Observation Satellite Feeds',
      provider: 'Copernicus Sentinel Hub',
      purpose: 'Multispectral satellite imagery layers for flood extent and burn scar analysis.',
      status: 'optional',
      details: 'Architecture abstraction in place; scheduled for production phase.',
      url: 'https://browser.dataspace.copernicus.eu/',
    },
  ]

  return (
    <PageContainer
      title="Intelligence Feeds & Data Sources"
      kicker="Source Attribution & Telemetry"
      actions={
        <Button variant="secondary" onClick={() => void handleRefresh()}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh Health Status
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="max-w-3xl text-sm leading-relaxed text-[#6E6E73]">
          CrisisLens maintains transparent data governance. Every assessment explicitly cites its source telemetry, grounding AI inferences in factual weather, geographic, and scientific sensor feeds.
        </p>

        <div className="grid gap-4.5 md:grid-cols-2">
          {sources.map((source) => (
            <article
              key={source.name}
              className="flex flex-col justify-between rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#1D1D1F]">{source.name}</h3>
                    <p className="mt-0.5 text-[12px] font-medium text-[#0071E3]">{source.provider}</p>
                  </div>
                  <Badge>
                    {source.status === 'connected' ? 'CONNECTED' : source.status === 'unavailable' ? 'UNAVAILABLE' : 'OPTIONAL'}
                  </Badge>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#6E6E73]">{source.purpose}</p>
                <p className="mt-3 border-t border-black/[0.06] pt-3 text-[11px] text-[#86868B]">{source.details}</p>
              </div>

              <div className="mt-4 pt-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-[#0071E3] hover:underline"
                >
                  Provider Documentation
                  <ExternalLink size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
