/**
 * CrisisLens AI - Shared TypeScript Domain Contracts
 * Matches backend Pydantic models 1:1.
 */

export type DisasterType = 'flood' | 'earthquake' | 'fire' | 'landslide' | 'other';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type AccessStatus = 'open' | 'partially_blocked' | 'blocked' | 'submerged' | 'unknown';
export type NeedType = 'rescue' | 'medical' | 'food' | 'water' | 'shelter' | 'transport' | 'other';
export type NeedStatus = 'unmet' | 'in_progress' | 'met' | 'cancelled';
export type ResourceType =
  | 'rescue_boat'
  | 'rescue_team'
  | 'ambulance'
  | 'medical_team'
  | 'evacuation_bus'
  | 'food_water_unit'
  | 'water_pump'
  | 'helicopter';

export type ResourceAvailability = 'available' | 'assigned' | 'in_transit' | 'depleted';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type IncidentStatus = 'active' | 'contained' | 'resolved';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  radius_meters?: number;
}

export interface MediaItem {
  media_id: string;
  media_type: string;
  url: string;
  caption?: string;
}

// 1. Report (Raw Incoming Data)
export interface Report {
  report_id: string;
  text: string;
  media: MediaItem[];
  location?: Location;
  source: string;
  reporter_id?: string;
  timestamp: string;
}

export interface ReportSubmissionResponse {
  status: string;
  report_id: string;
  evidence: Evidence;
  evidence_link: EvidenceLink;
  incident_id: string;
  active_recommendation?: ActionPlan;
}

// 2. Evidence (AI-Extracted Knowledge)
export interface EvidenceConfidence {
  disaster_type: number;
  severity: number;
  people_affected: number;
  needs: number;
  access_status: number;
  location: number;
  urgency: number;
}

export interface Evidence {
  evidence_id: string;
  report_id: string;
  disaster_type: DisasterType;
  severity: SeverityLevel;
  people_affected?: number;
  needs: NeedType[];
  access_status: AccessStatus;
  location?: Location;
  urgency: UrgencyLevel;
  extracted_entities: Record<string, any>;
  confidence: EvidenceConfidence;
  raw_report?: Report;
  extracted_at: string;
}

// 3. Evidence Link
export interface EvidenceLink {
  link_id: string;
  incident_id: string;
  evidence_id: string;
  linked_at: string;
  similarity_score: number;
  link_rationale: string;
  evidence?: Evidence;
}

// 4. Impact
export interface Impact {
  impact_id: string;
  casualty_count: number;
  displaced_count: number;
  trapped_count: number;
  infrastructure_damage: Record<string, string>;
  hazard_radius_meters: number;
  environmental_hazards: string[];
  updated_at: string;
}

// 5. Need
export interface Need {
  need_id: string;
  type: NeedType;
  urgency: UrgencyLevel;
  confidence: number;
  status: NeedStatus;
  quantity?: number;
  description?: string;
  identified_at: string;
}

// 6. Resource
export interface Resource {
  resource_id: string;
  name: string;
  resource_type: ResourceType;
  location: Location;
  availability: ResourceAvailability;
  capacity: number;
  current_assignment?: string;
  estimated_eta_minutes?: number;
}

// 7. Action Plan / Recommendation
export interface ActionPlan {
  action_id: string;
  incident_id: string;
  priority_level: SeverityLevel;
  priority_score: number;
  priority_rationale: string[];
  recommended_resources: Resource[];
  resource_rationale: string;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  responder_notes?: string;
  created_at: string;
}

export type Recommendation = ActionPlan;

// 8. Incident Snapshot ("What Changed?")
export interface IncidentSnapshot {
  snapshot_id: string;
  incident_id: string;
  timestamp: string;
  severity: SeverityLevel;
  people_affected: number;
  access_status: AccessStatus;
  active_needs: NeedType[];
  priority_score: number;
  summary: string;
  delta_summary: string[];
}

// 9. Contradiction Flag
export interface Contradiction {
  contradiction_id: string;
  field_name: string;
  claim_a: Record<string, any>;
  claim_b: Record<string, any>;
  requires_human_resolution: boolean;
  resolved: boolean;
  resolution_notes?: string;
}

// 9.5 Priority Result
export interface PriorityResult {
  score: number;
  priority_level: SeverityLevel;
  factors?: Record<string, number>;
  reasons: string[];
  confidence?: number;
  situation_trend?: string;
  configuration_version?: string;
}

// 10. Incident (Core Evolving Incident Object)
export interface Incident {
  incident_id: string;
  title: string;
  disaster_type: DisasterType;
  status: IncidentStatus;
  severity: SeverityLevel;
  priority_level: SeverityLevel;
  priority_score: number;
  priority_result?: PriorityResult;
  location: Location;
  people_affected: number;
  access_status: AccessStatus;
  evidence_links: EvidenceLink[];
  current_impact?: Impact;
  current_needs: Need[];
  active_recommendation?: ActionPlan;
  snapshots: IncidentSnapshot[];
  contradictions: Contradiction[];
  created_at: string;
  updated_at: string;
}
