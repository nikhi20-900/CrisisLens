export interface DisasterEvent {
  event_id: string
  event_type: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  severity: string | null
  alert_level: string | null
  country: string | null
  source: string
  url: string | null
  from_date: string | null
  to_date: string | null
}

export interface EarthquakeEvent {
  event_id: string
  magnitude: number
  location: string
  latitude: number
  longitude: number
  depth_km: number
  timestamp: string
  url: string | null
  felt_reports: number | null
  tsunami_alert: boolean
  source: string
}

export interface FireHotspot {
  latitude: number
  longitude: number
  brightness: number | null
  confidence: string | null
  acq_date: string | null
  acq_time: string | null
  satellite: string | null
  source: string
}

export interface HealthResponse {
  status: string
  version: string
  services: Record<string, string | boolean>
}

export interface NearbyPlace {
  name: string
  full_name: string
  type: string
  latitude: number | null
  longitude: number | null
}

export interface MapContext {
  location: { latitude: number; longitude: number }
  nearby: NearbyPlace[]
  available: boolean
}

export interface GeocodeResult {
  place_name: string
  latitude: number
  longitude: number
}

export type MapLayerId =
  | 'incidents'
  | 'earthquakes'
  | 'fires'
  | 'weather'
  | 'roads'
  | 'hospitals'
  | 'shelters'

export interface MapLayerState {
  id: MapLayerId
  label: string
  enabled: boolean
  available: boolean
  reason?: string
}
