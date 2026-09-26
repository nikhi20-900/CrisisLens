export const DISASTER_FILTERS = ['ALL', 'flood', 'earthquake', 'wildfire', 'storm', 'unknown'] as const
export const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
export const REVIEW_FILTERS = ['ALL', 'pending', 'approved', 'modified', 'escalated'] as const

interface IncidentFiltersProps {
  severity: string
  priority: string
  disasterType: string
  review: string
  onChange: (next: { severity?: string; priority?: string; disasterType?: string; review?: string }) => void
}

export function IncidentFilters({ severity, priority, disasterType, review, onChange }: IncidentFiltersProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
      <FilterRow
        label="Severity Level"
        value={severity}
        options={SEVERITY_FILTERS}
        onChange={(value) => onChange({ severity: value })}
      />
      <FilterRow
        label="Triage Priority"
        value={priority}
        options={SEVERITY_FILTERS}
        onChange={(value) => onChange({ priority: value })}
      />
      <FilterRow
        label="Disaster Type"
        value={disasterType}
        options={DISASTER_FILTERS}
        onChange={(value) => onChange({ disasterType: value })}
      />
      <FilterRow
        label="Verification Status"
        value={review}
        options={REVIEW_FILTERS}
        onChange={(value) => onChange({ review: value })}
      />
    </div>
  )
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">{label}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-black/[0.05] bg-black/[0.03] p-1">
        {options.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-150 uppercase tracking-wide ${
                active
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.03]'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
