import { CloudRain, Compass, Thermometer, Wind } from 'lucide-react'
import type { WeatherContext } from '../../types/incident'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'

export function WeatherCard({
  weather,
  loading,
  onRetry,
  location,
}: {
  weather?: WeatherContext | null
  loading?: boolean
  onRetry?: () => void
  location?: string
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-xs">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (!weather || !weather.available) {
    return (
      <ErrorState
        title="Weather Context Unavailable"
        body="Hyper-local telemetry is currently unavailable for these coordinates."
        onRetry={onRetry}
      />
    )
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">Hyper-Local Weather</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0071E3]">
          <Compass size={12} /> {weather.source ?? 'Open-Meteo'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-xl font-bold tracking-tight text-[#1D1D1F]">
            {weather.weather_description ?? 'Standard Conditions'}
          </p>
          {location ? <p className="text-[12px] text-[#6E6E73]">{location}</p> : null}
        </div>
        {weather.temperature_c != null ? (
          <p className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
            {weather.temperature_c}°<span className="text-lg font-normal text-[#86868B]">C</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Metric
          icon={Thermometer}
          label="Temperature"
          value={weather.temperature_c != null ? `${weather.temperature_c}°C` : '—'}
        />
        <Metric
          icon={CloudRain}
          label="Precipitation"
          value={weather.precipitation_mm != null ? `${weather.precipitation_mm} mm` : '0 mm'}
        />
        <Metric
          icon={Wind}
          label="Wind Speed"
          value={weather.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/h` : '—'}
        />
      </div>

      <p className="mt-3.5 text-[11px] text-[#86868B]">
        Ground telemetry observation. Sensor data is fused deterministically into flood/storm risk indices.
      </p>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Thermometer
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#86868B] uppercase">
        <Icon size={12} className="text-[#0071E3]" />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold text-[13px] text-[#1D1D1F]">{value}</p>
    </div>
  )
}
