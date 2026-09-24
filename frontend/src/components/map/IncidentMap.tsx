import React, { useState } from 'react';
import type { Incident, Location } from '@/types/domain';
import { Card } from '@/components/common/Card';
import {
  MapPin,
  Compass,
  Crosshair,
  Truck,
  Ambulance,
} from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (id: string) => void;
  className?: string;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const [mapMode, setMapMode] = useState<'tactical' | 'satellite'>('tactical');

  // Center coordinates (fallback to selected incident or default Kudlu Gate/Sector 4)
  const centerLocation: Location = selectedIncident?.location ||
    (incidents.length > 0 && incidents[0].location ? incidents[0].location : {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Central Market Bridge, Sector 4',
    });

  // Calculate relative pixel offsets for demonstration based on GPS coordinate differences
  const getMarkerPosition = (loc?: Location) => {
    if (!loc) return { top: '50%', left: '50%' };
    const latDiff = (loc.lat - centerLocation.lat) * 2000;
    const lngDiff = (loc.lng - centerLocation.lng) * 2000;
    const top = Math.min(Math.max(50 - latDiff, 15), 85);
    const left = Math.min(Math.max(50 + lngDiff, 15), 85);
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <Card
      title="Tactical Situation Map"
      icon={<Compass size={16} color="var(--color-primary, #38bdf8)" />}
      headerExtra={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-elevated, #1e293b)', borderRadius: '4px', padding: '2px' }}>
            <button
              onClick={() => setMapMode('tactical')}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mapMode === 'tactical' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: mapMode === 'tactical' ? 'var(--color-primary, #38bdf8)' : 'var(--text-muted, #64748b)',
                fontWeight: mapMode === 'tactical' ? 700 : 400,
              }}
            >
              Radar Grid
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mapMode === 'satellite' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: mapMode === 'satellite' ? 'var(--color-primary, #38bdf8)' : 'var(--text-muted, #64748b)',
                fontWeight: mapMode === 'satellite' ? 700 : 400,
              }}
            >
              Dark Sat
            </button>
          </div>

          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated, #1e293b)', color: 'var(--text-secondary, #94a3b8)' }}>
            {incidents.length} Hotspots
          </span>
        </div>
      }
    >
      {/* Map Canvas Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          borderRadius: '8px',
          backgroundColor: '#050914',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle, #1e293b)',
        }}
      >
        {/* Tactical Grid Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(to right, #0ea5e9 1px, transparent 1px),
              linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Radar concentric rings */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '1px solid rgba(14, 165, 233, 0.15)' }} />
          <div style={{ width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(14, 165, 233, 0.1)', position: 'absolute' }} />
        </div>

        {/* HUD Top Left: Coordinates & Region */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle, #1e293b)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ color: 'var(--color-primary, #38bdf8)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Crosshair size={12} />
            <span>GEO-RADAR HUD</span>
          </div>
          <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>
            LAT: {centerLocation.lat.toFixed(4)}° N | LNG: {centerLocation.lng.toFixed(4)}° E
          </div>
          <div style={{ color: 'var(--text-muted, #64748b)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {centerLocation.address || 'Operational Zone'}
          </div>
        </div>

        {/* HUD Top Right: Controls */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle, #1e293b)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span>GPS LOCKED</span>
          </div>
        </div>

        {/* Responder Units on Radar */}
        <div
          style={{ position: 'absolute', top: '68%', left: '38%', transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(30, 58, 138, 0.9)',
              border: '1px solid #3b82f6',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: '#93c5fd',
            }}
          >
            <Truck size={10} />
            <span>RESCUE-01</span>
          </div>
        </div>

        <div
          style={{ position: 'absolute', top: '32%', left: '65%', transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(136, 19, 55, 0.9)',
              border: '1px solid #f43f5e',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: '#fecdd3',
            }}
          >
            <Ambulance size={10} />
            <span>MED-02</span>
          </div>
        </div>

        {/* Incident Hotspot Markers */}
        {incidents.map((inc) => {
          const isSelected = selectedIncident?.incident_id === inc.incident_id;
          const pos = getMarkerPosition(inc.location);

          return (
            <div
              key={inc.incident_id}
              onClick={() => onSelectIncident(inc.incident_id)}
              style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                cursor: 'pointer',
              }}
            >
              {/* Pulsing Impact Ring when Selected */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Marker Pin Icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#dc2626' : '#0f172a',
                  color: isSelected ? '#ffffff' : '#f59e0b',
                  border: isSelected ? '2px solid #ffffff' : '1px solid #f59e0b',
                  boxShadow: isSelected ? '0 0 12px rgba(220, 38, 38, 0.6)' : 'none',
                }}
              >
                <MapPin size={14} />
              </div>
            </div>
          );
        })}

        {/* HUD Bottom Left: Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle, #1e293b)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>Target Incident</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span>Units</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>Hotspots</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
