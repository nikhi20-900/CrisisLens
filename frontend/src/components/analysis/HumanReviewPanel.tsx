import { useState } from 'react'
import { ShieldCheck, CheckCircle2, AlertOctagon, Sliders } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { reviewIncident } from '../../services/incidents'
import type { Incident } from '../../types/incident'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function HumanReviewPanel({
  incident,
  onUpdated,
}: {
  incident: Incident
  onUpdated: (incident: Incident) => void
}) {
  const { responderName } = useApp()
  const [mode, setMode] = useState<'idle' | 'modify'>('idle')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disasterType, setDisasterType] = useState(incident.disasterType ?? '')
  const [severityLabel, setSeverityLabel] = useState(incident.severityLabel ?? 'MEDIUM')
  const [priorityLabel, setPriorityLabel] = useState(incident.priorityLabel ?? 'MEDIUM')
  const [action, setAction] = useState(incident.recommendations[0]?.action ?? '')
  const [notes, setNotes] = useState('')

  const verified = incident.reviewStatus === 'approved' || incident.reviewStatus === 'modified'

  async function submit(status: 'approved' | 'modified' | 'escalated') {
    setBusy(true)
    setError(null)
    try {
      const updated = await reviewIncident(incident.id, {
        review_status: status,
        reviewed_by: responderName,
        reviewer_notes: notes || undefined,
        disaster_type: status === 'modified' ? disasterType : undefined,
        severity_label: status === 'modified' ? severityLabel : undefined,
        priority_label: status === 'modified' ? priorityLabel : undefined,
        recommendations: status === 'modified' && action ? [action] : undefined,
      })
      onUpdated(updated)
      setMode('idle')
    } catch {
      setError('Review decision could not be saved. Check connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Human Operator Certification</p>
        {verified ? <Badge>HUMAN</Badge> : <Badge>AI</Badge>}
      </div>

      <div className="mt-3.5 grid gap-2.5 rounded-xl border border-black/[0.05] bg-black/[0.02] p-3 text-[13px] sm:grid-cols-3">
        <p className="text-[#6E6E73]">
          Severity: <strong className="text-[#1D1D1F]">{incident.severityLabel ?? '—'}</strong>
        </p>
        <p className="text-[#6E6E73]">
          Priority: <strong className="text-[#0071E3]">{incident.priorityLabel ?? '—'}</strong>
        </p>
        <p className="text-[#6E6E73]">
          Confidence: <strong className="text-[#1D1D1F]">{Math.round((incident.confidenceScore ?? 0) * 100)}%</strong>
        </p>
      </div>

      {verified ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[13px] font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Incident certified by authorized responder ({incident.reviewedBy ?? responderName}).</span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="ok" disabled={busy} onClick={() => void submit('approved')}>
            <ShieldCheck size={14} />
            Approve AI Assessment
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setMode(mode === 'modify' ? 'idle' : 'modify')}>
            <Sliders size={14} />
            Modify Assessment
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void submit('escalated')}>
            <AlertOctagon size={14} />
            Escalate Incident
          </Button>
        </div>
      )}

      {mode === 'modify' ? (
        <div className="mt-5 space-y-3.5 rounded-xl border border-black/[0.06] bg-black/[0.015] p-4">
          <Field label="Disaster type" value={disasterType} onChange={setDisasterType} />

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[13px]">
              <span className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Severity Override</span>
              <select
                className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 font-medium text-[#1D1D1F]"
                value={severityLabel}
                onChange={(event) => setSeverityLabel(event.target.value)}
              >
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block text-[13px]">
              <span className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Priority Override</span>
              <select
                className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 font-medium text-[#1D1D1F]"
                value={priorityLabel}
                onChange={(event) => setPriorityLabel(event.target.value)}
              >
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <Field label="Adjusted response recommendation" value={action} onChange={setAction} />

          <label className="block text-[13px]">
            <span className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Investigator Audit Notes</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white p-2.5 text-sm text-[#1D1D1F]"
              rows={2}
              placeholder="State rationale for modifying the automated model assessment..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <Button variant="primary" disabled={busy} onClick={() => void submit('modified')}>
            Commit Human Assessment
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[12px] font-semibold text-[#D70015]">{error}</p> : null}
    </section>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[13px]">
      <span className="text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 text-sm text-[#1D1D1F]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
