import React from 'react';
import type { Incident, Location } from '@/types/domain';
import { MapPin } from 'lucide-react';

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
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '380px',
      }}
    >
      {/* Header: MAP & Where is this happening? */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              fontWeight: 700,
              margin: 0,
            }}
          >
            MAP
          </h3>
          <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>
            {selectedIncident?.location.address || centerLocation.address || 'Operations Sector'}
          </span>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
          {centerLocation.lat.toFixed(4)}° N, {centerLocation.lng.toFixed(4)}° E
        </div>
      </div>

      {/* Map Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: '320px',
          borderRadius: '4px',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          userSelect: 'none',
        }}
      >
        {/* Subtle geographic backdrop */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          preserveAspectRatio="none"
          viewBox="0 0 800 500"
        >
          {/* Water channel / River */}
          <path
            d="M -20,200 Q 200,240 400,190 T 820,250 L 820,300 Q 600,250 400,250 T -20,260 Z"
            fill="#e0f2fe"
            stroke="#bae6fd"
            strokeWidth="1.5"
          />

          {/* Roadways */}
          <line x1="0" y1="120" x2="800" y2="140" stroke="#ffffff" strokeWidth="10" />
          <line x1="0" y1="120" x2="800" y2="140" stroke="#cbd5e1" strokeWidth="1" />

          <line x1="280" y1="0" x2="310" y2="500" stroke="#ffffff" strokeWidth="10" />
          <line x1="280" y1="0" x2="310" y2="500" stroke="#cbd5e1" strokeWidth="1" />

          {/* Bridge Crossing Structure */}
          <rect x="360" y="195" width="80" height="55" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" rx="2" />
          <line x1="360" y1="222" x2="440" y2="222" stroke="#e2e8f0" strokeWidth="3" />

          {/* Secondary streets */}
          <line x1="120" y1="0" x2="140" y2="500" stroke="#ffffff" strokeWidth="6" />
          <line x1="580" y1="0" x2="570" y2="500" stroke="#ffffff" strokeWidth="6" />
          <line x1="0" y1="380" x2="800" y2="400" stroke="#ffffff" strokeWidth="6" />

          {/* Buildings / city blocks */}
          <rect x="60" y="40" width="80" height="60" fill="#e2e8f0" rx="2" />
          <rect x="180" y="30" width="70" height="70" fill="#e2e8f0" rx="2" />
          <rect x="420" y="40" width="120" height="60" fill="#e2e8f0" rx="2" />
          <rect x="620" y="50" width="100" height="60" fill="#e2e8f0" rx="2" />
          <rect x="50" y="300" width="110" height="60" fill="#e2e8f0" rx="2" />
          <rect x="190" y="320" width="80" height="50" fill="#e2e8f0" rx="2" />
          <rect x="470" y="300" width="90" height="70" fill="#e2e8f0" rx="2" />
          <rect x="620" y="320" width="120" height="60" fill="#e2e8f0" rx="2" />
        </svg>

        {/* Selected Incident Highlight Ring */}
        {selectedIncident && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '120px',
              height: '120px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px dashed #ef4444',
              pointerEvents: 'none',
            }}
          />
        )}

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
                zIndex: isSelected ? 30 : 20,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Marker Dot / Pin */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isSelected ? '28px' : '22px',
                  height: isSelected ? '28px' : '22px',
                  borderRadius: '50%',
                  backgroundColor: isCritical ? '#dc2626' : '#ea580c',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
              >
                <MapPin size={isSelected ? 15 : 12} />
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span>Critical Incident</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <span>High Severity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
