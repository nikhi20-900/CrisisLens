import type { Incident } from '../types/incident'

export function caseId(id: number): string {
  return `CASE-${String(id).padStart(5, '0')}`
}

export function formatDisaster(type?: string | null): string {
  if (!type) return 'UNCLASSIFIED'
  return type.replace(/_/g, ' ').toUpperCase()
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return 'Time unknown'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Time unknown'
  const delta = Math.max(0, Date.now() - then)
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatClock(iso?: string | null): string {
  if (!iso) return '--:--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function confidencePercent(score?: number | null): number {
  if (score === null || score === undefined) return 0
  return score <= 1 ? Math.round(score * 100) : Math.round(score)
}

export function confidenceLevel(score?: number | null): 'HIGH' | 'MODERATE' | 'LOW' {
  const pct = confidencePercent(score)
  if (pct >= 75) return 'HIGH'
  if (pct >= 50) return 'MODERATE'
  return 'LOW'
}

export function normalizeLabel(value?: string | null): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const upper = (value ?? 'LOW').toUpperCase()
  if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') return upper
  return 'LOW'
}

export function scoreValue(value?: number | null): number {
  if (value === null || value === undefined) return 0
  return Math.round(value)
}

export function matchesQuery(incident: Incident, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    caseId(incident.id),
    String(incident.id),
    incident.locationName,
    incident.disasterType,
    incident.reportText,
    incident.severityLabel,
    incident.priorityLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
