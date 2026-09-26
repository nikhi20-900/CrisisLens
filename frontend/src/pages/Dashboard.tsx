import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, RefreshCw } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { StatCard } from '../components/dashboard/StatCard'
import { PriorityQueue } from '../components/dashboard/PriorityQueue'
import { RecentIncidents } from '../components/dashboard/RecentIncidents'
import { IncidentMap } from '../components/map/IncidentMap'
import { WeatherCard } from '../components/weather/WeatherCard'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useApp } from '../context/AppContext'
import { getEarthquakes, getFires } from '../services/disasters'
import type { EarthquakeEvent, FireHotspot, MapLayerState } from '../types/disaster'

const INITIAL_LAYERS: MapLayerState[] = [
  { id: 'incidents', label: 'Incidents', enabled: true, available: true },
  { id: 'earthquakes', label: 'Earthquakes', enabled: true, available: true },
  { id: 'fires', label: 'Fire Hotspots', enabled: false, available: true },
  { id: 'weather', label: 'Weather Context', enabled: true, available: true },
  { id: 'roads', label: 'Roads', enabled: false, available: false, reason: 'Local GIS feed offline' },
  { id: 'hospitals', label: 'Hospitals', enabled: false, available: true },
  { id: 'shelters', label: 'Shelters', enabled: false, available: false, reason: 'Feed unconfigured' },
]

export function Dashboard() {
  const { incidents, loading, refreshIncidents } = useApp()
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([])
  const [fires, setFires] = useState<FireHotspot[]>([])
  const [layers, setLayers] = useState<MapLayerState[]>(INITIAL_LAYERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    void getEarthquakes(50).then(setEarthquakes).catch(() => setEarthquakes([]))
    void getFires().then(setFires).catch(() => setFires([]))
  }, [])

  const counts = useMemo(() => {
    let critical = 0
    let high = 0
    let medium = 0
    let review = 0

    for (const inc of incidents) {
      const p = (inc.priorityLabel ?? '').toUpperCase()
      const s = (inc.severityLabel ?? '').toUpperCase()
      if (p === 'CRITICAL' || s === 'CRITICAL') critical += 1
      else if (p === 'HIGH' || s === 'HIGH') high += 1
      else if (p === 'MEDIUM' || s === 'MEDIUM') medium += 1

      if (inc.reviewStatus === 'pending' || inc.uncertaintyFlag) {
        review += 1
      }
    }

    return {
      active: incidents.length,
      critical,
      high,
      medium,
      review,
    }
  }, [incidents])

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedId) ?? incidents[0] ?? null,
    [incidents, selectedId]
  )

  function toggleLayer(id: MapLayerState['id']) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    )
  }

  return (
    <PageContainer
      title="Emergency Operations Command"
      kicker="Real-Time Decision Intelligence"
      actions={
        <div className="flex items-center gap-2.5">
          <Link to="/analyze">
            <Button variant="primary">
              <Sparkles size={14} />
              Analyze Incident
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => void refreshIncidents()}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Feeds
          </Button>
        </div>
      }
    >
      {/* Top Health Metric Cards */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5" aria-label="Incident metrics">
        <StatCard label="Active Incidents" value={counts.active} to="/incidents" />
        <StatCard label="Critical Response" value={counts.critical} to="/incidents?priority=CRITICAL" tone="critical" />
        <StatCard label="High Priority" value={counts.high} to="/incidents?priority=HIGH" tone="high" />
        <StatCard label="Moderate Priority" value={counts.medium} to="/incidents?priority=MEDIUM" tone="medium" />
        <StatCard label="Review Required" value={counts.review} to="/incidents?review=pending" tone="review" />
      </section>

      {/* Main Command Center: Map + Priority Queue */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Map View */}
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
            <span>Spatial Telemetry Overview</span>
            <span className="font-mono text-[11px] font-medium text-[#0071E3]">{incidents.length} Active Incidents</span>
          </div>
          <div className="relative min-h-[480px] flex-1">
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
          </div>
        </section>

        {/* Right Priority Queue */}
        <section className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Priority Queue</h2>
            <Link to="/priority" className="text-[11px] font-semibold text-[#0071E3] hover:underline">
              View All ({incidents.length}) →
            </Link>
          </div>
          <div className="max-h-[520px] flex-1 overflow-y-auto scrollbar-thin pr-1">
            {loading && incidents.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <PriorityQueue incidents={incidents} limit={5} />
            )}
          </div>
        </section>
      </div>

      {/* Lower Dashboard: Recent Incidents & Weather Context */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Recent Field Alerts</h3>
            <Link to="/incidents" className="text-[11px] font-semibold text-[#0071E3] hover:underline">
              Full Register →
            </Link>
          </div>
          <RecentIncidents incidents={incidents} />
        </div>

        <div className="lg:col-span-5">
          <WeatherCard
            weather={selectedIncident?.weather}
            location={selectedIncident?.locationName ?? 'Operational Area'}
          />
        </div>
      </div>
    </PageContainer>
  )
}
