import type { ReactNode } from 'react'

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1D1D1F]/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur-xs group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  )
}
