import type {
  AIAnalysisResult,
  AnalysisResponse,
  AnalyzeDisasterResponse,
  DamageAssessment,
  HumanReviewPayload,
  Incident,
  IncidentListResponse,
  Recommendation,
  SeverityBreakdown,
  PriorityBreakdown,
  WeatherContext,
} from '../types/incident'
import { apiGet, apiSend } from './api'

interface RawIncident {
  id: number
  created_at?: string | null
  source?: string | null
  image_url?: string | null
  report_text?: string | null
  latitude?: number | null
  longitude?: number | null
  location_name?: string | null
  disaster_type?: string | null
  severity_score?: number | null
  severity_label?: string | null
  priority_score?: number | null
  priority_label?: string | null
  confidence_score?: number | null
  uncertainty_flag?: boolean | null
  uncertainty_reason?: string | null
  affected_people_estimate?: number | null
  infrastructure_damage?: DamageAssessment | null
  hazards?: unknown
  evidence?: unknown
  recommendations?: unknown
  weather_context?: WeatherContext | null
  external_event_id?: string | null
  ai_assessment?: AIAnalysisResult | null
  severity_breakdown?: SeverityBreakdown | null
  priority_breakdown?: PriorityBreakdown | null
  human_assessment?: Incident['humanAssessment']
  human_override?: boolean | null
  review_status?: string | null
  reviewer_notes?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  is_demo?: boolean | null
  crisis_zone_id?: string | null
  crisis_zone_name?: string | null
  evolution_history?: any[] | null
  priority_change_reason?: string | null
  openrouter_analysis?: any | null
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asRecommendations(value: unknown): Recommendation[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { action: item, reason: '', priority: 'MEDIUM', category: 'general' }
      }
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>
        return {
          action: String(rec.action ?? ''),
          reason: String(rec.reason ?? ''),
          priority: String(rec.priority ?? 'MEDIUM'),
          category: String(rec.category ?? 'general'),
        }
      }
      return null
    })
    .filter((item): item is Recommendation => item !== null && item.action.length > 0)
}

export function mapIncident(raw: RawIncident): Incident {
  return {
    id: raw.id,
    createdAt: raw.created_at ?? null,
    source: raw.source ?? null,
    imageUrl: raw.image_url ?? null,
    reportText: raw.report_text ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    locationName: raw.location_name ?? null,
    disasterType: raw.disaster_type ?? null,
    severityScore: raw.severity_score ?? null,
    severityLabel: raw.severity_label ?? null,
    priorityScore: raw.priority_score ?? null,
    priorityLabel: raw.priority_label ?? null,
    confidenceScore: raw.confidence_score ?? null,
    uncertaintyFlag: raw.uncertainty_flag ?? null,
    uncertaintyReason: raw.uncertainty_reason ?? null,
    affectedPeopleEstimate: raw.affected_people_estimate ?? null,
    infrastructureDamage: raw.infrastructure_damage ?? null,
    hazards: asStringList(raw.hazards),
    evidence: asStringList(raw.evidence),
    recommendations: asRecommendations(raw.recommendations),
    weather: raw.weather_context ?? null,
    externalEventId: raw.external_event_id ?? null,
    aiAssessment: raw.ai_assessment ?? null,
    severityBreakdown: raw.severity_breakdown ?? null,
    priorityBreakdown: raw.priority_breakdown ?? null,
    humanAssessment: raw.human_assessment ?? null,
    humanOverride: raw.human_override ?? null,
    reviewStatus: raw.review_status ?? null,
    reviewerNotes: raw.reviewer_notes ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    reviewedBy: raw.reviewed_by ?? null,
    isDemo: Boolean(raw.is_demo),
    crisisZoneId: raw.crisis_zone_id ?? null,
    crisisZoneName: raw.crisis_zone_name ?? null,
    evolutionHistory: raw.evolution_history ?? null,
    priorityChangeReason: raw.priority_change_reason ?? null,
    openrouterAnalysis: raw.openrouter_analysis ?? null,
  }
}

export async function listIncidents(params?: {
  skip?: number
  limit?: number
  severity?: string
  reviewStatus?: string
  isDemo?: boolean
}): Promise<IncidentListResponse> {
  const query = new URLSearchParams()
  if (params?.skip) query.set('skip', String(params.skip))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.severity) query.set('severity', params.severity)
  if (params?.reviewStatus) query.set('review_status', params.reviewStatus)
  if (params?.isDemo !== undefined) query.set('is_demo', String(params.isDemo))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const data = await apiGet<{ incidents: RawIncident[]; total: number }>(`/api/incidents${suffix}`)
  return {
    incidents: data.incidents.map(mapIncident),
    total: data.total,
  }
}

export async function getIncident(id: number): Promise<Incident> {
  const data = await apiGet<RawIncident>(`/api/incidents/${id}`)
  return mapIncident(data)
}

export async function analyzeDisaster(input: {
  image?: File
  citizenReport?: string
  reportText?: string
  latitude?: number
  longitude?: number
  locationName?: string
  crisisZoneId?: string
}): Promise<AnalyzeDisasterResponse> {
  const form = new FormData()
  if (input.image) form.append('image', input.image)
  const text = input.citizenReport || input.reportText
  if (text) {
    form.append('citizen_report', text)
    form.append('report_text', text)
  }
  if (input.latitude !== undefined) form.append('latitude', String(input.latitude))
  if (input.longitude !== undefined) form.append('longitude', String(input.longitude))
  if (input.locationName) form.append('location_name', input.locationName)
  if (input.crisisZoneId) form.append('crisis_zone_id', input.crisisZoneId)

  const data = await apiSend<{
    analysis: any
    crisis_zone: any
    incident: RawIncident
    analysis_time_ms: number
    warnings: string[]
  }>('/api/analyze-disaster', { method: 'POST', body: form })

  return {
    analysis: data.analysis,
    crisis_zone: {
      zone_id: data.crisis_zone?.zone_id ?? null,
      zone_name: data.crisis_zone?.zone_name ?? null,
      is_update: Boolean(data.crisis_zone?.is_update),
      evolution_history: data.crisis_zone?.evolution_history ?? [],
      priority_change_reason: data.crisis_zone?.priority_change_reason ?? null,
    },
    incident: mapIncident(data.incident),
    analysisTimeMs: data.analysis_time_ms,
    warnings: data.warnings ?? [],
  }
}

export async function analyzeIncident(input: {
  image?: File
  reportText?: string
  latitude?: number
  longitude?: number
  locationName?: string
}): Promise<AnalysisResponse> {
  const form = new FormData()
  if (input.image) form.append('image', input.image)
  if (input.reportText) form.append('report_text', input.reportText)
  if (input.latitude !== undefined) form.append('latitude', String(input.latitude))
  if (input.longitude !== undefined) form.append('longitude', String(input.longitude))
  if (input.locationName) form.append('location_name', input.locationName)

  const data = await apiSend<{
    incident: RawIncident
    analysis_time_ms: number
    warnings: string[]
  }>('/api/incidents/analyze', { method: 'POST', body: form })

  return {
    incident: mapIncident(data.incident),
    analysisTimeMs: data.analysis_time_ms,
    warnings: data.warnings ?? [],
  }
}

export async function reviewIncident(id: number, payload: HumanReviewPayload): Promise<Incident> {
  const data = await apiSend<RawIncident>(`/api/incidents/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return mapIncident(data)
}

export async function seedDemo(): Promise<Incident[]> {
  const data = await apiSend<RawIncident[]>('/api/demo/seed', { method: 'POST' })
  return data.map(mapIncident)
}

export async function resetDemo(): Promise<void> {
  await apiSend('/api/demo/reset', { method: 'POST' })
}
