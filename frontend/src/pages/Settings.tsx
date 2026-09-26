import { useState } from 'react'
import { Sparkles, Trash2, CheckCircle2 } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import { seedDemo, resetDemo } from '../services/incidents'
import { API_BASE } from '../services/api'

export function Settings() {
  const { responderName, setResponderName, refreshIncidents, demoCount } = useApp()
  const [nameInput, setNameInput] = useState(responderName)
  const [callsign, setCallsign] = useState(() => localStorage.getItem('crisislens.callsign') ?? 'EOC-ALPHA')
  const [seeding, setSeeding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setResponderName(nameInput.trim() || 'Duty Officer')
    localStorage.setItem('crisislens.callsign', callsign.trim() || 'EOC-ALPHA')
    setMessage('Responder profile identity successfully stored.')
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSeedDemo() {
    setSeeding(true)
    setMessage(null)
    try {
      await seedDemo()
      await refreshIncidents()
      setMessage('Official benchmark disaster scenarios (Flood, Earthquake, Wildfire) successfully seeded.')
    } catch {
      setMessage('Failed to seed demo scenarios. Ensure backend service is reachable.')
    } finally {
      setSeeding(false)
    }
  }

  async function handleResetDemo() {
    setResetting(true)
    setMessage(null)
    try {
      await resetDemo()
      await refreshIncidents()
      setMessage('Demo incidents purged successfully. Live user records preserved.')
    } catch {
      setMessage('Failed to purge demo scenarios.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <PageContainer title="System & Console Settings" kicker="Operational Configuration">
      <div className="max-w-3xl space-y-6">
        {message ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 shadow-xs">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{message}</span>
          </div>
        ) : null}

        {/* Responder Profile */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xs">
          <h2 className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase mb-1.5">
            Emergency Responder Identity
          </h2>
          <p className="text-xs leading-relaxed text-[#6E6E73] mb-4">
            Incident review and assessment approvals will be stamped with this identity in the permanent audit trail.
          </p>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label htmlFor="responder-name-input" className="block text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                Responder Name / Officer Callout
              </label>
              <input
                id="responder-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 py-2 text-sm text-[#1D1D1F] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
              />
            </div>
            <div>
              <label htmlFor="callsign-input" className="block text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
                Command Callsign / Station Identifier
              </label>
              <input
                id="callsign-input"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 py-2 text-sm text-[#1D1D1F] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
              />
            </div>
            <Button type="submit" variant="primary">
              Save Identity Profile
            </Button>
          </form>
        </section>

        {/* Demonstration Scenarios Management */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xs">
          <h2 className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase mb-1.5">
            Demonstration Scenarios & Evaluation Sandbox
          </h2>
          <p className="text-xs leading-relaxed text-[#6E6E73] mb-4">
            Load the three official benchmark disaster scenarios: Urban Flood (Bengaluru), Collapsed Building void search (Antakya), and Wildfire canyon front (California).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={seeding} onClick={() => void handleSeedDemo()}>
              <Sparkles size={14} />
              {seeding ? 'Seeding Demo Data...' : 'Seed 3 Benchmark Scenarios'}
            </Button>
            {demoCount > 0 ? (
              <Button variant="danger" disabled={resetting} onClick={() => void handleResetDemo()}>
                <Trash2 size={14} />
                {resetting ? 'Purging Demo...' : `Purge Demo Data (${demoCount} active)`}
              </Button>
            ) : null}
          </div>
        </section>

        {/* System & Connection Environment Info */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-xs">
          <h2 className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase mb-3">
            Environment & Gateway Status
          </h2>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-black/[0.05] pb-2">
              <span className="text-[#86868B]">API Endpoint Target</span>
              <span className="font-semibold text-[#1D1D1F]">{API_BASE || '(Direct host / same-origin proxy)'}</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.05] pb-2">
              <span className="text-[#86868B]">Geospatial Provider</span>
              <span className="font-semibold text-emerald-600">Leaflet + OpenStreetMap (No API key required)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86868B]">Platform Build</span>
              <span className="font-semibold text-[#0071E3]">CrisisLens 1.0 (Apple Edition)</span>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
