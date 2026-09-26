import { Bell, Search, Sparkles, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { seedDemo } from '../../services/incidents'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

export function Header() {
  const { query, setQuery, liveConnected, demoCount, responderName, refreshIncidents } = useApp()
  const navigate = useNavigate()

  async function loadDemo() {
    await seedDemo()
    await refreshIncidents()
    navigate('/')
  }

  return (
    <header className="hidden h-14 items-center justify-between gap-4 border-b border-black/[0.06] bg-white/80 px-6 backdrop-blur-xl lg:flex">
      {/* Left status chips */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.02] px-2.5 py-1 text-[11px] font-medium">
          <span className={`h-2 w-2 rounded-full ${liveConnected ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'}`} aria-hidden />
          <span className="text-[#6E6E73]">{liveConnected ? 'Live Connection' : 'Offline'}</span>
        </div>

        {demoCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Sparkles size={11} className="text-amber-600" />
            Demo Mode ({demoCount} Scenarios)
          </span>
        ) : (
          <span className="rounded-full border border-black/[0.06] bg-black/[0.02] px-2.5 py-1 text-[11px] font-medium text-[#86868B]">
            Production Feeds
          </span>
        )}
      </div>

      {/* Center Spotlight Search */}
      <label className="relative flex max-w-sm flex-1 items-center">
        <Search size={14} className="pointer-events-none absolute left-3 text-[#86868B]" />
        <span className="sr-only">Search incidents</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Spotlight search (incidents, locations, disaster)..."
          className="w-full rounded-full border border-black/[0.08] bg-black/[0.035] py-1.5 pl-8.5 pr-4 text-[12px] text-[#1D1D1F] placeholder:text-[#86868B] transition-all focus:border-[#0071E3]/50 focus:bg-white focus:ring-3 focus:ring-[#0071E3]/15"
        />
      </label>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <Tooltip label="Load official demonstration disaster scenarios">
          <Button variant="secondary" onClick={() => void loadDemo()} className="text-[11px] py-1 px-3">
            <Sparkles size={13} className="text-[#0071E3]" />
            Load Demo
          </Button>
        </Tooltip>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-all"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-black/[0.08]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#0071E3] to-[#42A5F5] text-white shadow-xs">
            <User size={14} strokeWidth={2.2} />
          </div>
          <div className="text-left">
            <p className="text-[12px] font-medium leading-none text-[#1D1D1F]">{responderName}</p>
            <p className="text-[10px] text-[#86868B]">Duty Officer</p>
          </div>
        </div>
      </div>
    </header>
  )
}
