export type SeverityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type PriorityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type ReviewStatus = 'pending' | 'approved' | 'modified' | 'escalated'

export interface Recommendation {
  action: string
  reason: string
  priority: string
  category: string
}

export interface SeverityFactor {
  factor: string
  score: number
  max_score: number
  description: string
}

export interface SeverityBreakdown {
  factors: SeverityFactor[]
  raw_total: number
  normalized_score: number
  label: string
}

export interface PriorityBreakdown {
  severity_component: number
  exposure_component: number
  urgency_component: number
  accessibility_component: number
  raw_score: number
  normalized_score: number
  label: string
  reasons: string[]
}

export interface DamageAssessment {
  buildings: string
  roads: string
  utilities: string
  bridges: string
  vehicles: string
}

export interface PeopleAssessment {
  visible_people: number
  estimated_affected: number
  possible_stranded_people: boolean
  possible_injuries: boolean
  possible_casualties: boolean
}

export interface AIAnalysisResult {
  disaster_type: string
  summary: string
  damage: DamageAssessment
  people: PeopleAssessment
  hazards: string[]
  severity: number
  severity_label: string
  confidence: number
  evidence: string[]
  recommended_actions: string[]
  accessibility_issues: string[]
  environmental_risks: string[]
  uncertainty_factors: string[]
}

export interface HumanAssessment {
  severity_label?: string
  severity_score?: number
  priority_label?: string
  priority_score?: number
  disaster_type?: string
  recommendations?: string[]
  reviewer_notes?: string
  reviewed_by?: string
  review_status?: string
}

export interface Incident {
  id: number
  createdAt: string | null
  source: string | null
  imageUrl: string | null
  reportText: string | null
  latitude: number | null
  longitude: number | null
  locationName: string | null
  disasterType: string | null
  severityScore: number | null
  severityLabel: string | null
  priorityScore: number | null
  priorityLabel: string | null
  confidenceScore: number | null
  uncertaintyFlag: boolean | null
  uncertaintyReason: string | null
  affectedPeopleEstimate: number | null
  infrastructureDamage: DamageAssessment | null
  hazards: string[]
  evidence: string[]
  recommendations: Recommendation[]
  weather: WeatherContext | null
  externalEventId: string | null
  aiAssessment: AIAnalysisResult | null
  severityBreakdown: SeverityBreakdown | null
  priorityBreakdown: PriorityBreakdown | null
  humanAssessment: HumanAssessment | null
  humanOverride: boolean | null
  reviewStatus: string | null
  reviewerNotes: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  isDemo: boolean
  crisisZoneId?: string | null
  crisisZoneName?: string | null
  evolutionHistory?: CrisisZoneEvolutionEvent[] | null
  priorityChangeReason?: string | null
  openrouterAnalysis?: OpenRouterDisasterAnalysis | null
}

export interface IncidentListResponse {
  incidents: Incident[]
  total: number
}

export interface AnalysisResponse {
  incident: Incident
  analysisTimeMs: number
  warnings: string[]
}

export interface OpenRouterDisasterAnalysis {
  disaster_type: string
  observed_conditions: string[]
  visible_damage: string[]
  affected_area_description: string
  possible_people_at_risk: string
  accessibility_issues: string[]
  severity_indicators: string[]
  supporting_evidence: string[]
  unknown_information: string[]
  confidence: number
  recommended_attention_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface CrisisZoneEvolutionEvent {
  timestamp: string
  observation: string
  disaster_type?: string
  visible_damage?: string[]
  possible_people_at_risk?: string
  accessibility_issues?: string[]
  priority_score: number
  priority_label: string
  severity_score: number
  severity_label: string
  change_reason: string
  confidence?: number
}

export interface CrisisZoneInfo {
  zone_id: string | null
  zone_name: string | null
  is_update: boolean
  evolution_history: CrisisZoneEvolutionEvent[]
  priority_change_reason: string | null
}

export interface AnalyzeDisasterResponse {
  analysis: OpenRouterDisasterAnalysis
  crisis_zone: CrisisZoneInfo
  incident: Incident
  analysisTimeMs: number
  warnings: string[]
}

export interface HumanReviewPayload {
  severity_label?: string
  severity_score?: number
  priority_label?: string
  priority_score?: number
  disaster_type?: string
  recommendations?: string[]
  reviewer_notes?: string
  reviewed_by?: string
  review_status: 'approved' | 'modified' | 'escalated'
}

export interface WeatherContext {
  temperature_c: number | null
  precipitation_mm: number | null
  precipitation_probability: number | null
  wind_speed_kmh: number | null
  wind_direction: number | null
  weather_code: number | null
  weather_description: string | null
  is_severe: boolean
  source: string
  retrieved_at: string | null
  available: boolean
}

export interface AnalyzeIncidentInput {
  image?: File
  citizenReport?: string
  reportText?: string
  latitude?: number
  longitude?: number
  locationName?: string
  crisisZoneId?: string
}
