import {
  Activity,
  Bell,
  Database,
  LayoutDashboard,
  ListOrdered,
  Map as MapIcon,
  Menu,
  ScanSearch,
  Settings,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Header } from './Header'

const primary = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidents', icon: ShieldAlert, end: false },
  { to: '/map', label: 'Live Map', icon: MapIcon, end: false },
  { to: '/analyze', label: 'Analyze Incident', icon: ScanSearch, end: false },
  { to: '/priority', label: 'Priority Queue', icon: ListOrdered, end: false },
]

const secondary = [
  { to: '/sources', label: 'Data Sources', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { health, healthError, liveConnected } = useApp()
  const aiOnline = Boolean(health?.services.openrouter_configured || health?.services.gemini_configured)
  const mapOnline = true // OpenStreetMap active without API key
  const weatherOnline = Boolean(health) && !healthError

  return (
    <div className="flex h-full bg-[#F5F5F7] text-[#1D1D1F] antialiased">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-black/[0.07] bg-[#FBFBFD]/95 lg:bg-[#FBFBFD] backdrop-blur-xl transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* App Branding */}
        <div className="flex h-16 items-center justify-between border-b border-black/[0.06] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0071E3] to-[#47A3FF] text-white shadow-sm">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
                Crisis<span className="text-[#0071E3]">Lens</span>
              </p>
              <p className="text-[10px] font-medium tracking-wide text-[#86868B]">Decision Support AI</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex h-[calc(100%-14.5rem)] flex-col gap-6 overflow-y-auto px-3.5 py-4 scrollbar-thin">
          <div className="space-y-1">
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Workspace</p>
            {primary.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">Platform</p>
            {secondary.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
            ))}
          </div>
        </nav>

        {/* System Health Widget */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-black/[0.06] bg-black/[0.015] p-4 text-[11px]">
          <div className="rounded-xl border border-black/[0.05] bg-white p-3 shadow-xs">
            <p className="mb-2.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">
              <span className="flex items-center gap-1.5">
                <Activity size={12} className="text-[#0071E3]" /> Telemetry
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${liveConnected ? 'text-[#34C759]' : 'text-[#86868B]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${liveConnected ? 'bg-[#34C759]' : 'bg-[#86868B]'}`} />
                {liveConnected ? 'Connected' : 'Offline'}
              </span>
            </p>
            <div className="space-y-1.5">
              <StatusRow label="Multimodal AI" online={aiOnline} />
              <StatusRow label="OpenStreetMap" online={mapOnline} />
              <StatusRow label="Weather Feed" online={weatherOnline} />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-xs transition-opacity lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-black/[0.06] bg-white/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1D1D1F] hover:bg-black/[0.05]"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0071E3] text-white">
              <Sparkles size={12} />
            </div>
            <span className="font-semibold tracking-tight text-[13px] text-[#1D1D1F]">CrisisLens</span>
          </div>
          <Bell size={18} className="text-[#86868B]" />
        </div>

        {/* Desktop Header */}
        <Header />

        {/* Main Routed Page Container */}
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  onClick: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-black/[0.08] text-[#1D1D1F] font-semibold shadow-xs'
            : 'text-[#6E6E73] hover:bg-black/[0.035] hover:text-[#1D1D1F]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[#0071E3]' : 'text-[#86868B]'} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function StatusRow({ label, online }: { label: string; online: boolean }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[#6E6E73]">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'}`} aria-hidden />
        <span className={online ? 'text-[#1D1D1F]' : 'text-[#86868B]'}>{online ? 'Active' : 'Offline'}</span>
      </span>
    </div>
  )
}
