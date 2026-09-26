import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { ConfidenceIndicator } from '../components/analysis/ConfidenceIndicator'
import { EvidencePanel } from '../components/analysis/EvidencePanel'
import { ExplainabilityPanel } from '../components/analysis/ExplainabilityPanel'
import { HumanReviewPanel } from '../components/analysis/HumanReviewPanel'
import { RecommendationPanel } from '../components/analysis/RecommendationPanel'
import { SituationAssessment } from '../components/analysis/SituationAssessment'
import { UncertaintyPanel } from '../components/analysis/UncertaintyPanel'
import { IncidentTimeline } from '../components/incidents/IncidentTimeline'
import { CrisisZoneEvolutionPanel } from '../components/analysis/CrisisZoneEvolutionPanel'
import { MultimodalIntelligencePanel } from '../components/analysis/MultimodalIntelligencePanel'
import { PageContainer } from '../components/layout/PageContainer'
import { IncidentMap } from '../components/map/IncidentMap'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { WeatherCard } from '../components/weather/WeatherCard'
import { caseId, formatDisaster, normalizeLabel } from '../lib/format'
import { getIncident } from '../services/incidents'
import type { MapLayerState } from '../types/disaster'
import type { Incident } from '../types/incident'

const INITIAL_LAYERS: MapLayerState[] = [
  { id: 'incidents', label: 'Incident Target', enabled: true, available: true },
  { id: 'weather', label: 'Weather Context', enabled: true, available: true },
  { id: 'roads', label: 'Road Transit GIS', enabled: false, available: false, reason: 'Feed offline' },
  { id: 'hospitals', label: 'Medical Facilities', enabled: true, available: true },
  { id: 'shelters', label: 'Evacuation Shelters', enabled: false, available: false, reason: 'Feed unconfigured' },
]

export function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const numId = Number(id)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<MapLayerState[]>(INITIAL_LAYERS)

  useEffect(() => {
    if (!numId || Number.isNaN(numId)) {
      setError('Invalid incident identifier.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    void getIncident(numId)
      .then((data) => {
        if (!data) setError('Incident was not found in database.')
        else setIncident(data)
      })
      .catch(() => setError('Failed to retrieve incident telemetry.'))
      .finally(() => setLoading(false))
  }, [numId])

  function toggleLayer(layerId: MapLayerState['id']) {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    )
  }

  if (loading) {
    return (
      <PageContainer title="Retrieving Incident Dossier..." kicker="Decision Support Archive">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !incident) {
    return (
      <PageContainer title="Incident Record Unavailable" kicker="Investigation Registry">
        <ErrorState
          title="Incident Record Not Found"
          body={error || 'This incident record could not be retrieved from the operational store.'}
          action={{ label: 'Return to Roster', onClick: () => navigate('/incidents') }}
        />
      </PageContainer>
    )
  }

  const priority = normalizeLabel(incident.priorityLabel)

  return (
    <PageContainer
      title={`${formatDisaster(incident.disasterType)} · ${incident.locationName ?? 'Location Unspecified'}`}
      kicker={`Incident Investigation · ${caseId(incident.id)}`}
      actions={
        <div className="flex items-center gap-2.5">
          <Badge kind="severity">{priority}</Badge>
          {incident.isDemo ? <Badge>DEMO</Badge> : null}
          {incident.reviewStatus === 'approved' ? (
            <Badge>HUMAN VERIFIED</Badge>
          ) : incident.reviewStatus === 'escalated' ? (
            <Badge kind="severity">ESCALATED</Badge>
          ) : (
            <Badge>REVIEW PENDING</Badge>
          )}
          <Link to="/incidents">
            <Button variant="secondary" className="flex items-center gap-1.5">
              <ArrowLeft size={13} />
              Back to List
            </Button>
          </Link>
        </div>
      }
    >
      {/* Crisis Zone Evolution Banner */}
      {incident.crisisZoneId || (incident.evolutionHistory && incident.evolutionHistory.length > 0) ? (
        <div className="mb-6">
          <CrisisZoneEvolutionPanel incident={incident} />
        </div>
      ) : null}

      {/* OpenRouter Multimodal AI Assessment */}
      {incident.openrouterAnalysis ? (
        <div className="mb-6">
          <MultimodalIntelligencePanel
            analysis={incident.openrouterAnalysis}
            summaryText={incident.aiAssessment?.summary}
          />
        </div>
      ) : null}

      {/* Upper Grid: Evidence, Map, Assessment */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Raw Evidence */}
        <div className="space-y-6 lg:col-span-4">
          <EvidencePanel incident={incident} />
          <WeatherCard
            weather={incident.weather}
            location={incident.locationName ?? undefined}
          />
        </div>

        {/* Center: Geo Map */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xs lg:col-span-4">
          <div className="border-b border-black/[0.06] px-4 py-3 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
            Geographic Impact & Surrounding POIs
          </div>
          <div className="relative min-h-[380px] flex-1">
            <IncidentMap
              incidents={[incident]}
              selectedId={incident.id}
              layers={layers}
              onToggleLayer={toggleLayer}
              className="h-full w-full rounded-none border-none"
            />
          </div>
        </div>

        {/* Right: Situation Assessment & Confidence */}
        <div className="space-y-6 lg:col-span-4">
          <SituationAssessment incident={incident} />
          <ConfidenceIndicator
            score={incident.confidenceScore}
            flag={incident.uncertaintyFlag}
          />
          <UncertaintyPanel
            flag={incident.uncertaintyFlag}
            reason={incident.uncertaintyReason}
            factors={incident.aiAssessment?.uncertainty_factors}
          />
        </div>
      </div>

      {/* Middle Grid: Explainability & Hazards */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ExplainabilityPanel incident={incident} />
        </div>

        {/* Immediate Hazards */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs lg:col-span-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
            <AlertTriangle size={13} className="text-[#FF9500]" />
            <span>Identified Physical Hazards</span>
          </div>

          {incident.hazards.length > 0 ? (
            <ul className="mt-3.5 space-y-2 text-sm">
              {incident.hazards.map((hazard) => (
                <li key={hazard} className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3">
                  <span className="font-bold text-[#D70015]">!</span>
                  <span className="font-medium text-[#1D1D1F]">{hazard}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#86868B]">No immediate hazardous conditions detected in field telemetry.</p>
          )}

          {/* Infrastructure Damage */}
          <div className="mt-6 border-t border-black/[0.06] pt-4">
            <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Critical Infrastructure Status</p>
            {incident.infrastructureDamage ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[12px]">
                {Object.entries(incident.infrastructureDamage).map(([asset, status]) => (
                  <div key={asset} className="rounded-lg border border-black/[0.05] bg-black/[0.02] p-2.5">
                    <span className="font-semibold text-[#86868B] uppercase text-[10px] block">{asset}</span>
                    <span
                      className={`font-semibold capitalize ${
                        status === 'destroyed' || status === 'blocked' ? 'text-[#D70015]' : 'text-[#1D1D1F]'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#86868B]">Infrastructure telemetry unrecorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recommendations, Human-in-the-Loop, and Timeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <RecommendationPanel recommendations={incident.recommendations} />
        </div>

        <div className="lg:col-span-4">
          <HumanReviewPanel incident={incident} onUpdated={setIncident} />
        </div>

        <div className="lg:col-span-3">
          <IncidentTimeline incident={incident} />
        </div>
      </div>
    </PageContainer>
  )
}
