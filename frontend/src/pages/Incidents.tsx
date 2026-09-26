import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, RotateCcw } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { IncidentCard } from '../components/incidents/IncidentCard'
import { IncidentFilters } from '../components/incidents/IncidentFilters'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useApp } from '../context/AppContext'
import { matchesQuery } from '../lib/format'

export function Incidents() {
  const { incidents, loading, query } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const [severity, setSeverity] = useState(() => searchParams.get('severity') ?? 'ALL')
  const [priority, setPriority] = useState(() => searchParams.get('priority') ?? 'ALL')
  const [disasterType, setDisasterType] = useState(() => searchParams.get('disasterType') ?? 'ALL')
  const [review, setReview] = useState(() => searchParams.get('review') ?? 'ALL')

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      if (!matchesQuery(incident, query)) return false

      if (severity !== 'ALL' && (incident.severityLabel ?? 'LOW').toUpperCase() !== severity) {
        return false
      }
      if (priority !== 'ALL' && (incident.priorityLabel ?? 'LOW').toUpperCase() !== priority) {
        return false
      }
      if (disasterType !== 'ALL' && (incident.disasterType ?? 'unknown').toLowerCase() !== disasterType.toLowerCase()) {
        return false
      }
      if (review !== 'ALL' && (incident.reviewStatus ?? 'pending').toLowerCase() !== review.toLowerCase()) {
        return false
      }

      return true
    })
  }, [incidents, query, severity, priority, disasterType, review])

  function handleFilterChange(next: { severity?: string; priority?: string; disasterType?: string; review?: string }) {
    if (next.severity !== undefined) {
      setSeverity(next.severity)
      if (next.severity === 'ALL') searchParams.delete('severity')
      else searchParams.set('severity', next.severity)
    }
    if (next.priority !== undefined) {
      setPriority(next.priority)
      if (next.priority === 'ALL') searchParams.delete('priority')
      else searchParams.set('priority', next.priority)
    }
    if (next.disasterType !== undefined) {
      setDisasterType(next.disasterType)
      if (next.disasterType === 'ALL') searchParams.delete('disasterType')
      else searchParams.set('disasterType', next.disasterType)
    }
    if (next.review !== undefined) {
      setReview(next.review)
      if (next.review === 'ALL') searchParams.delete('review')
      else searchParams.set('review', next.review)
    }
    setSearchParams(searchParams)
  }

  return (
    <PageContainer
      title="Incident Roster & Triage"
      kicker="Operational Register"
      actions={
        <div className="rounded-full bg-black/[0.04] px-3 py-1 font-mono text-[11px] font-medium text-[#6E6E73]">
          Showing <strong className="text-[#1D1D1F]">{filtered.length}</strong> of {incidents.length} recorded
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Filters sidebar */}
        <aside className="h-fit rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs lg:col-span-4 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between border-b border-black/[0.06] pb-3">
            <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
              <Filter size={13} className="text-[#0071E3]" /> Filter Triage
            </h2>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-[#0071E3] hover:underline"
              onClick={() => handleFilterChange({ severity: 'ALL', priority: 'ALL', disasterType: 'ALL', review: 'ALL' })}
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
          <IncidentFilters
            severity={severity}
            priority={priority}
            disasterType={disasterType}
            review={review}
            onChange={handleFilterChange}
          />
        </aside>

        {/* Incident cards list */}
        <main className="lg:col-span-8 xl:col-span-9">
          {loading && incidents.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Incidents Match Active Criteria"
              body="Try resetting the severity or disaster type filters, or search for another keyword."
              action={{
                label: 'Reset All Filters',
                onClick: () => handleFilterChange({ severity: 'ALL', priority: 'ALL', disasterType: 'ALL', review: 'ALL' }),
              }}
            />
          ) : (
            <div className="grid gap-4.5 sm:grid-cols-2">
              {filtered.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </main>
      </div>
    </PageContainer>
  )
}
