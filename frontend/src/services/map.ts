import type { GeocodeResult, MapContext } from '../types/disaster'
import { apiGet } from './api'

export async function getMapContext(lat: number, lon: number): Promise<MapContext> {
  return apiGet<MapContext>(`/api/map/context?lat=${lat}&lon=${lon}`)
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'json')
    url.searchParams.set('q', trimmed)
    url.searchParams.set('limit', '5')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      display_name?: string
      lat?: string
      lon?: string
    }>

    return data
      .map((item) => {
        if (!item.lat || !item.lon) return null
        return {
          place_name: item.display_name ?? 'Unknown location',
          longitude: parseFloat(item.lon),
          latitude: parseFloat(item.lat),
        }
      })
      .filter((item): item is GeocodeResult => item !== null)
  } catch (error) {
    console.warn('OpenStreetMap Nominatim search error:', error)
    return []
  }
}
