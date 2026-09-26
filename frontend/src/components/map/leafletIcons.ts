import L from 'leaflet'

interface CrisisZoneIconOptions {
  priority: string
  disasterType?: string | null
  updateCount?: number
  isSelected?: boolean
}

export function createCrisisZoneIcon({
  priority,
  updateCount = 1,
  isSelected = false,
}: CrisisZoneIconOptions): L.DivIcon {
  const norm = (priority ?? 'LOW').toUpperCase()

  let bgClass = 'bg-[#0071E3]'
  let textClass = 'text-white'
  let borderClass = 'border-white'
  let label = 'LOW'
  let pulseClass = ''
  let iconSvg = ''

  if (norm === 'CRITICAL') {
    bgClass = 'bg-[#FF3B30]'
    borderClass = isSelected ? 'border-[#1D1D1F] ring-4 ring-[#FF3B30]/30' : 'border-white'
    label = 'CRIT'
    pulseClass = 'severity-pulse'
    // Alert Triangle SVG
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  } else if (norm === 'HIGH') {
    bgClass = 'bg-[#FF9500]'
    borderClass = isSelected ? 'border-[#1D1D1F] ring-4 ring-[#FF9500]/30' : 'border-white'
    label = 'HIGH'
    pulseClass = 'high-pulse'
    // Flame/Alert SVG
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>`
  } else if (norm === 'MEDIUM') {
    bgClass = 'bg-[#D97706]'
    borderClass = isSelected ? 'border-[#1D1D1F] ring-4 ring-[#D97706]/30' : 'border-white'
    label = 'MED'
    // Warning SVG
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  } else {
    bgClass = 'bg-[#0071E3]'
    borderClass = isSelected ? 'border-[#1D1D1F] ring-4 ring-[#0071E3]/30' : 'border-white'
    label = 'LOW'
    // Info SVG
    iconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  }

  const updateBadgeHtml = updateCount > 1
    ? `<span style="position:absolute;top:-6px;right:-8px;background:#1D1D1F;color:#ffffff;font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;padding:1px 5px;border-radius:9999px;border:1.5px solid #ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.25);" title="${updateCount} Living Updates">${updateCount}x</span>`
    : ''

  const html = `
    <div class="crisis-marker-pin relative" style="width: auto; height: auto;">
      <div class="flex items-center gap-1 px-2 py-1 rounded-full ${bgClass} ${textClass} border-2 ${borderClass} shadow-lg ${pulseClass}" style="transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        ${iconSvg}
        <span style="font-size: 10px; font-weight: 800; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em;">${label}</span>
      </div>
      ${updateBadgeHtml}
    </div>
  `

  return L.divIcon({
    html,
    className: 'crisis-leaflet-div-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  })
}

export function createEarthquakeIcon(magnitude: number): L.DivIcon {
  const size = Math.max(16, Math.min(36, Math.round(magnitude * 5)))
  const html = `
    <div style="width:${size}px;height:${size}px;border-radius:9999px;background:rgba(59,130,246,0.35);border:2px solid #2563eb;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#1e40af;box-shadow:0 2px 6px rgba(0,0,0,0.15)">
      ${magnitude.toFixed(1)}
    </div>
  `
  return L.divIcon({
    html,
    className: 'earthquake-leaflet-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -size / 2],
  })
}

export function createFireIcon(): L.DivIcon {
  const html = `
    <div style="width:18px;height:18px;border-radius:9999px;background:#ea580c;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);color:#ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>
    </div>
  `
  return L.divIcon({
    html,
    className: 'fire-leaflet-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -12],
  })
}

export function createNearbyPoiIcon(type: string): L.DivIcon {
  const isHospital = type.toLowerCase().includes('hospital')
  const bg = isHospital ? '#059669' : '#0284c7'
  const text = isHospital ? 'H' : 'POI'
  const html = `
    <div style="width:16px;height:16px;border-radius:4px;background:${bg};border:1.5px solid #ffffff;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);color:#ffffff;font-size:9px;font-weight:800;font-family:'JetBrains Mono',monospace;box-shadow:0 2px 4px rgba(0,0,0,0.2)">
      ${text}
    </div>
  `
  return L.divIcon({
    html,
    className: 'poi-leaflet-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  })
}
