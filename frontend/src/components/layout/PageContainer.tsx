import type { ReactNode } from 'react'

export function PageContainer({
  title,
  kicker,
  actions,
  children,
}: {
  title: string
  kicker?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {kicker ? (
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">{kicker}</p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-2.5">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
