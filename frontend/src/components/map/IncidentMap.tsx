import React from 'react';
import type { Incident, Location } from '@/types/domain';
import { MapPin, Navigation } from 'lucide-react';

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
  // Center coordinates (fallback to selected incident or default)
  const centerLocation: Location = selectedIncident?.location ||
    (incidents.length > 0 && incidents[0].location ? incidents[0].location : {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Central Market Bridge, Sector 4',
    });

  // Calculate relative pixel offsets based on GPS coordinate differences
  const getMarkerPosition = (loc?: Location) => {
    if (!loc) return { top: '50%', left: '50%' };
    const latDiff = (loc.lat - centerLocation.lat) * 2000;
    const lngDiff = (loc.lng - centerLocation.lng) * 2000;
    const top = Math.min(Math.max(50 - latDiff, 15), 85);
    const left = Math.min(Math.max(50 + lngDiff, 15), 85);
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0,0,0,0.06))',
      }}
    >
      {/* Map Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontWeight: 700 }}>
            Spatial Context & Incident Map
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {centerLocation.address || 'Active sector'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
          <span>LAT: {centerLocation.lat.toFixed(4)}° N</span>
          <span>•</span>
          <span>LNG: {centerLocation.lng.toFixed(4)}° E</span>
        </div>
      </div>

      {/* Map Canvas Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: '260px',
          borderRadius: '4px',
          backgroundColor: '#eef2f6',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          userSelect: 'none',
        }}
      >
        {/* Realistic Street & River Map Background Representation */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          preserveAspectRatio="none"
          viewBox="0 0 800 500"
        >
          {/* Water channel / Inundated River */}
          <path
            d="M -20,200 Q 200,240 400,190 T 820,250 L 820,310 Q 600,250 400,260 T -20,270 Z"
            fill="#bae6fd"
            stroke="#7dd3fc"
            strokeWidth="1.5"
          />
          <text x="360" y="245" fill="#0284c7" fontSize="12" fontFamily="sans-serif" fontWeight="600" opacity="0.8">
            Sector 4 River Drainage Channel
          </text>

          {/* Main Arterial Roadways */}
          <line x1="0" y1="120" x2="800" y2="140" stroke="#ffffff" strokeWidth="12" />
          <line x1="0" y1="120" x2="800" y2="140" stroke="#cbd5e1" strokeWidth="1" />

          <line x1="280" y1="0" x2="310" y2="500" stroke="#ffffff" strokeWidth="10" />
          <line x1="280" y1="0" x2="310" y2="500" stroke="#cbd5e1" strokeWidth="1" />

          {/* Bridge Crossing Structure */}
          <rect x="360" y="200" width="80" height="48" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" rx="2" />
          <line x1="360" y1="224" x2="440" y2="224" stroke="#e2e8f0" strokeWidth="4" />

          {/* Secondary Roads */}
          <line x1="120" y1="0" x2="140" y2="500" stroke="#ffffff" strokeWidth="6" />
          <line x1="580" y1="0" x2="570" y2="500" stroke="#ffffff" strokeWidth="6" />
          <line x1="0" y1="380" x2="800" y2="400" stroke="#ffffff" strokeWidth="6" />

          {/* Neighborhood blocks / buildings */}
          <rect x="60" y="40" width="80" height="60" fill="#e2e8f0" rx="2" />
          <rect x="180" y="30" width="70" height="70" fill="#e2e8f0" rx="2" />
          <rect x="420" y="40" width="120" height="60" fill="#e2e8f0" rx="2" />
          <rect x="620" y="50" width="100" height="60" fill="#e2e8f0" rx="2" />

          <rect x="50" y="300" width="110" height="60" fill="#e2e8f0" rx="2" />
          <rect x="190" y="320" width="80" height="50" fill="#e2e8f0" rx="2" />
          <rect x="470" y="300" width="90" height="70" fill="#e2e8f0" rx="2" />
          <rect x="620" y="320" width="120" height="60" fill="#e2e8f0" rx="2" />
        </svg>

        {/* Selected Incident Inundation Area */}
        {selectedIncident && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '160px',
              height: '160px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px dashed #ef4444',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#991b1b', backgroundColor: '#ffffff', padding: '1px 6px', borderRadius: '3px', border: '1px solid #fecaca' }}>
              Flood Perimeter ~250m
            </span>
          </div>
        )}

        {/* Responder Units on Map */}
        <div
          style={{ position: 'absolute', top: '70%', left: '42%', transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#ffffff',
              border: '1px solid #0284c7',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#0369a1',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <Navigation size={10} color="#0284c7" />
            <span>Unit Alpha (ETA 12m)</span>
          </div>
        </div>

        {/* Incident Hotspot Markers */}
        {incidents.map((inc) => {
          const isSelected = selectedIncident?.incident_id === inc.incident_id;
          const pos = getMarkerPosition(inc.location);
          const isCritical = inc.severity === 'critical';

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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Marker Pin */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isSelected ? '30px' : '24px',
                  height: isSelected ? '30px' : '24px',
                  borderRadius: '50%',
                  backgroundColor: isCritical ? '#dc2626' : '#ea580c',
                  color: '#ffffff',
                  border: isSelected ? '2px solid #ffffff' : '1px solid #ffffff',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <MapPin size={isSelected ? 16 : 13} />
              </div>

              {/* Pin Label */}
              <div
                style={{
                  marginTop: '2px',
                  backgroundColor: '#ffffff',
                  border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                {inc.incident_id}
              </div>
            </div>
          );
        })}

        {/* Map Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '11px',
            color: '#334155',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span>Selected Incident</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <span>Active Hotspot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            <span>Dispatched Unit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
