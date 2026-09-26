import type { DisasterEvent, EarthquakeEvent, FireHotspot, HealthResponse } from '../types/disaster'
import { apiGet } from './api'

export async function getDisasters(limit = 50): Promise<DisasterEvent[]> {
  return apiGet<DisasterEvent[]>(`/api/disasters?limit=${limit}`)
}

export async function getEarthquakes(limit = 100): Promise<EarthquakeEvent[]> {
  return apiGet<EarthquakeEvent[]>(`/api/earthquakes?limit=${limit}`)
}

export async function getFires(params?: {
  lat?: number
  lon?: number
  radiusKm?: number
}): Promise<FireHotspot[]> {
  const query = new URLSearchParams()
  if (params?.lat !== undefined) query.set('lat', String(params.lat))
  if (params?.lon !== undefined) query.set('lon', String(params.lon))
  if (params?.radiusKm) query.set('radius_km', String(params.radiusKm))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiGet<FireHotspot[]>(`/api/fires${suffix}`)
}

export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/api/health')
}
