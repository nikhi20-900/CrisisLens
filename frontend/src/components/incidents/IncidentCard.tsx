import React from 'react';
import type { Incident } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { formatTime } from '@/lib/formatters';

export interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: (incidentId: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  isSelected,
  onSelect,
}) => {
  // Extract a clean short location label
  const locationLabel = incident.location.address || incident.title.replace(/^Flash Flood & Bridge Inundation — /i, '');

  // Extract a short operational reason from latest snapshot or impact
  const latestSnapshot = incident.snapshots && incident.snapshots.length > 0
    ? incident.snapshots[incident.snapshots.length - 1]
    : null;

  const shortReasons: string[] = [];
  if (latestSnapshot?.delta_summary && latestSnapshot.delta_summary.length > 0) {
    shortReasons.push(latestSnapshot.delta_summary[0]);
  } else if (incident.access_status === 'blocked') {
    shortReasons.push('Road access blocked');
  }

  if (incident.current_needs?.some(n => n.type === 'medical')) {
    shortReasons.unshift('Medical emergency');
  }

  return (
    <div
      onClick={() => onSelect(incident.incident_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(incident.incident_id);
        }
      }}
      style={{
        backgroundColor: isSelected ? '#f1f5f9' : '#ffffff',
        borderLeft: isSelected ? '3px solid #0f172a' : '3px solid transparent',
        borderBottom: '1px solid #f1f5f9',
        borderRadius: '3px',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        textAlign: 'left',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* 1. DISASTER TYPE & LOCATION */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: isSelected ? '#0f172a' : '#334155',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {incident.disaster_type}
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
            {incident.incident_id}
          </span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0f172a', marginTop: '1px' }}>
          {locationLabel}
        </div>
      </div>

      {/* 2. SEVERITY & IMPACT */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <Badge variant={incident.severity} size="sm">
          {incident.severity}
        </Badge>
        <span style={{ fontSize: '11px', fontWeight: 600, color: incident.severity === 'critical' ? '#b91c1c' : '#64748b' }}>
          {incident.people_affected} affected
        </span>
      </div>

      {/* 3. SHORT REASON (Plain language) */}
      {shortReasons.length > 0 && (
        <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.35, marginTop: '2px' }}>
          {shortReasons.slice(0, 2).map((r, i) => (
            <div key={i} style={{ color: r.toLowerCase().includes('medical') ? '#b91c1c' : '#475569' }}>
              • {r}
            </div>
          ))}
        </div>
      )}

      {/* 4. LAST UPDATED */}
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
        Updated {formatTime(incident.updated_at)}
      </div>
    </div>
  );
};
