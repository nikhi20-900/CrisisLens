import type { WeatherContext } from '../types/incident'
import { apiGet } from './api'

export async function getWeather(lat: number, lon: number): Promise<WeatherContext> {
  return apiGet<WeatherContext>(`/api/weather?lat=${lat}&lon=${lon}`)
}
