export function FieldReport({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Incident Field Narrative</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="Enter on-scene observations, civilian eyewitness reports, trapped persons, road conditions, or hazard descriptions..."
        className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-black/[0.02] p-3.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
      />
    </label>
  )
}
