import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, ArrowRight, RotateCcw, Map, AlertTriangle, Clock } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EvidenceUploader } from '../components/analysis/EvidenceUploader'
import { LocationPicker } from '../components/analysis/LocationPicker'
import { MultimodalIntelligencePanel } from '../components/analysis/MultimodalIntelligencePanel'
import { CrisisZoneEvolutionPanel } from '../components/analysis/CrisisZoneEvolutionPanel'
import { ExplainabilityPanel } from '../components/analysis/ExplainabilityPanel'
import { RecommendationPanel } from '../components/analysis/RecommendationPanel'
import { HumanReviewPanel } from '../components/analysis/HumanReviewPanel'
import { WeatherCard } from '../components/weather/WeatherCard'
import { Button } from '../components/ui/Button'
import { analyzeDisaster } from '../services/incidents'
import { useApp } from '../context/AppContext'
import type { AnalyzeDisasterResponse, Incident } from '../types/incident'

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export function AnalyzeIncident() {
  const navigate = useNavigate()
  const { refreshIncidents } = useApp()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [reportText, setReportText] = useState('')
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number; locationName?: string }>({
    latitude: 12.9352,
    longitude: 77.6245,
    locationName: 'Koramangala, Bengaluru',
  })

  const [analyzing, setAnalyzing] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [disasterResponse, setDisasterResponse] = useState<AnalyzeDisasterResponse | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  async function handleAnalyze() {
    if (!imageFile && !reportText.trim()) {
      setError('Missing Input: Please upload a disaster photograph or enter a citizen/field report.')
      return
    }

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Invalid Image: '.${ext}' is not supported. Please upload a PNG, JPG, JPEG, or WEBP photo.`)
        return
      }
      if (imageFile.size > 10 * 1024 * 1024) {
        setError('File Too Large: Uploaded image exceeds the 10MB limit.')
        return
      }
    }

    setAnalyzing(true)
    setError(null)
    setWarnings([])
    setDisasterResponse(null)
    setLoadingStep('Uploading evidence & preparing multimodal payload...')

    try {
      const timer1 = setTimeout(() => {
        setLoadingStep('OpenRouter multimodal vision AI reasoning across evidence...')
      }, 1000)

      const timer2 = setTimeout(() => {
        setLoadingStep('Evaluating Crisis Zone correlation & calculating priority evolution...')
      }, 3000)

      const response = await analyzeDisaster({
        image: imageFile || undefined,
        citizenReport: reportText.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationName: coords.locationName,
      })

      clearTimeout(timer1)
      clearTimeout(timer2)

      setDisasterResponse(response)
      setWarnings(response.warnings)
      void refreshIncidents()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('OPENROUTER_API_KEY') || message.includes('OpenRouter AI service is not configured')) {
        setError('OpenRouter Unavailable: OPENROUTER_API_KEY is not configured in backend/.env. Please configure your API key.')
      } else if (message.includes('HTTP 502') || message.includes('Bad Gateway') || message.includes('Failed to connect')) {
        setError('OpenRouter API Failure: Unable to reach OpenRouter multimodal endpoint. Please check network connectivity.')
      } else if (message.includes('unparseable') || message.includes('JSON')) {
        setError('Malformed AI Response: AI response could not be parsed as valid JSON. Manual assessment required.')
      } else if (message.includes('400') || message.includes('At least a disaster photograph')) {
        setError('Missing Input: At least a disaster photograph or a citizen report is required.')
      } else {
        setError(`Analysis Failed: ${message}`)
      }
    } finally {
      setAnalyzing(false)
      setLoadingStep('')
    }
  }

  function handleReset() {
    setDisasterResponse(null)
    setImageFile(null)
    setReportText('')
    setError(null)
    setWarnings([])
    setLoadingStep('')
  }

  const result: Incident | null = disasterResponse?.incident ?? null
  const analysis = disasterResponse?.analysis ?? result?.openrouterAnalysis ?? null
  const crisisZone = disasterResponse?.crisis_zone ?? null

  return (
    <PageContainer
      title="Multimodal Disaster Intelligence"
      kicker="OpenRouter Vision AI · Living Crisis Map Ingestion"
      actions={
        result ? (
          <div className="flex items-center gap-2.5">
            <Link to="/map">
              <Button variant="secondary" className="flex items-center gap-1.5">
                <Map size={13} />
                Living Crisis Map
              </Button>
            </Link>
            <Button variant="primary" onClick={() => navigate(`/incidents/${result.id}`)}>
              Open Full Incident Case
              <ArrowRight size={14} />
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw size={13} />
              New Intake
            </Button>
          </div>
        ) : undefined
      }
    >
      {!result ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Form: Evidence + Citizen Report */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                1. Visual Disaster Telemetry (Image Upload)
              </h2>
              <EvidenceUploader file={imageFile} onChange={setImageFile} />
              <p className="mt-2 text-[11px] text-[#86868B]">
                Supported formats: PNG, JPG, JPEG, WEBP. Maximum file size: 10MB.
              </p>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
              <h2 className="mb-2.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                2. Citizen Field Observation & Dispatch Report
              </h2>
              <label htmlFor="field-report-textarea" className="sr-only">Field Observation Report</label>
              <textarea
                id="field-report-textarea"
                rows={5}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Enter citizen observations, emergency radio transcripts, or distress calls (e.g., '10:05: Road flooded near 80ft road. 10:15: Water entering ground floor homes. 10:25: Families trapped on rooftop. Access road blocked...')"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] p-3.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
              />
            </section>
          </div>

          {/* Right Form: Location & AI Trigger */}
          <div className="space-y-6 lg:col-span-5">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                3. Incident Coordinates & Crisis Zone Geofence
              </h2>
              <LocationPicker
                latitude={coords.latitude}
                longitude={coords.longitude}
                locationName={coords.locationName}
                onChange={(loc) => setCoords(loc)}
              />
              <p className="mt-2 text-[11px] text-[#86868B]">
                Crisis Zone Engine will automatically correlate this report with any active crisis within 2.0 km to show priority evolution without duplicating incidents.
              </p>
            </section>

            {/* Analysis Action Box */}
            <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
              <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-3.5 text-[12px] text-[#6E6E73]">
                <p className="flex items-center gap-1.5 font-semibold text-[#1D1D1F]">
                  <Sparkles size={14} className="text-[#0071E3]" /> OpenRouter Multimodal AI Synthesis
                </p>
                <p className="mt-1 leading-relaxed">
                  Fuses imagery, citizen narrative, Open-Meteo telemetry, and Crisis Zone history via OpenRouter vision models. Feeds deterministic severity and Living Crisis Map scoring.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-[13px] font-medium text-[#D70015]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {analyzing ? (
                <div className="rounded-xl border border-[#0071E3]/20 bg-[#0071E3]/[0.05] p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0071E3]">
                    <Clock size={14} className="animate-spin" />
                    <span>{loadingStep || 'AI Analysis in progress...'}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0071E3]/20">
                    <div className="h-full animate-pulse rounded-full bg-[#0071E3] w-3/4" />
                  </div>
                </div>
              ) : null}

              <Button
                variant="primary"
                disabled={analyzing}
                onClick={() => void handleAnalyze()}
                className="w-full py-2.5 text-sm font-semibold tracking-wide"
              >
                <Sparkles size={16} />
                {analyzing ? 'Reasoning Across Multimodal Feeds...' : 'Analyze with OpenRouter AI'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Operational Telemetry Warnings */}
          {warnings.length > 0 ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900">
              <p className="text-[10px] font-semibold tracking-wider text-amber-800 uppercase">Operational Telemetry Notes</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px]">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Crisis Zone Status & Evolution Banner */}
          <CrisisZoneEvolutionPanel crisisZone={crisisZone} incident={result} />

          {/* OpenRouter Multimodal AI Structured Intelligence */}
          {analysis ? (
            <MultimodalIntelligencePanel
              analysis={analysis}
              summaryText={result.aiAssessment?.summary}
            />
          ) : null}

          {/* Engine Outputs & Explainability */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <ExplainabilityPanel incident={result} />
            </div>

            <div className="space-y-6 lg:col-span-4">
              <WeatherCard weather={result.weather} location={result.locationName ?? undefined} />
            </div>
          </div>

          {/* Recommendations & Human Decision Support */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <RecommendationPanel recommendations={result.recommendations} />
            </div>
            <div className="lg:col-span-6">
              <HumanReviewPanel
                incident={result}
                onUpdated={(updated) => {
                  if (disasterResponse) {
                    setDisasterResponse({ ...disasterResponse, incident: updated })
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
