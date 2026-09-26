import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { HealthResponse } from '../types/disaster'
import type { Incident } from '../types/incident'
import { getHealth } from '../services/disasters'
import { listIncidents } from '../services/incidents'

interface AppState {
  incidents: Incident[]
  total: number
  loading: boolean
  error: string | null
  health: HealthResponse | null
  healthError: string | null
  responderName: string
  query: string
  setQuery: (value: string) => void
  setResponderName: (value: string) => void
  refreshIncidents: () => Promise<void>
  refreshHealth: () => Promise<void>
  liveConnected: boolean
  demoCount: number
}

const AppContext = createContext<AppState | null>(null)

const RESPONDER_KEY = 'crisislens.responder'

export function AppProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [responderName, setResponderNameState] = useState(
    () => localStorage.getItem(RESPONDER_KEY) ?? 'Duty Officer',
  )

  const refreshIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listIncidents({ limit: 100 })
      setIncidents(data.incidents)
      setTotal(data.total)
    } catch {
      setError('Incident feed unavailable. The rest of the console remains usable.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      setHealth(data)
      setHealthError(null)
    } catch {
      setHealth(null)
      setHealthError('Health endpoint unavailable')
    }
  }, [])

  useEffect(() => {
    void refreshIncidents()
    void refreshHealth()
    const incidentsTimer = window.setInterval(() => void refreshIncidents(), 30000)
    const healthTimer = window.setInterval(() => void refreshHealth(), 45000)
    return () => {
      window.clearInterval(incidentsTimer)
      window.clearInterval(healthTimer)
    }
  }, [refreshHealth, refreshIncidents])

  const setResponderName = useCallback((value: string) => {
    setResponderNameState(value)
    localStorage.setItem(RESPONDER_KEY, value)
  }, [])

  const value = useMemo<AppState>(
    () => ({
      incidents,
      total,
      loading,
      error,
      health,
      healthError,
      responderName,
      query,
      setQuery,
      setResponderName,
      refreshIncidents,
      refreshHealth,
      liveConnected: Boolean(health) && !healthError,
      demoCount: incidents.filter((item) => item.isDemo).length,
    }),
    [
      error,
      health,
      healthError,
      incidents,
      loading,
      query,
      refreshHealth,
      refreshIncidents,
      responderName,
      total,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
