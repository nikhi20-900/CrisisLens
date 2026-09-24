import React from 'react';
import type { Incident } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { formatTime, getAccessStatusLabel } from '@/lib/formatters';
import { Users, Clock } from 'lucide-react';

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
  const access = getAccessStatusLabel(incident.access_status);

  // Extract a brief current note if available from snapshots or needs
  const latestSnapshot = incident.snapshots && incident.snapshots.length > 0
    ? incident.snapshots[incident.snapshots.length - 1]
    : null;

  return (
    <div
      onClick={() => onSelect(incident.incident_id)}
      style={{
        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
        borderRadius: '6px',
        border: isSelected ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
        borderLeft: isSelected ? '4px solid #0284c7' : '1px solid #e2e8f0',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Header: Title / Location + Severity Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
              {incident.incident_id}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
              {incident.disaster_type}
            </span>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
            {incident.title}
          </h4>
        </div>

        <Badge variant={incident.severity} size="sm">
          {incident.severity}
        </Badge>
      </div>

      {/* Primary Impact & Accessibility Signals */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#475569' }}>
        {incident.people_affected > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#b91c1c' }}>
            <Users size={12} />
            {incident.people_affected} affected
          </span>
        )}

        <span style={{ color: access.color, fontWeight: 500 }}>
          {access.label}
        </span>

        <span style={{ color: '#64748b', fontSize: '11px' }}>
          Priority: <strong style={{ color: '#0f172a' }}>{incident.priority_score.toFixed(1)}</strong>
        </span>
      </div>

      {/* Snapshot/Evolution note if present */}
      {latestSnapshot?.summary && (
        <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0', lineHeight: 1.35 }}>
          {latestSnapshot.summary}
        </p>
      )}

      {/* Footer: Location & Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {incident.location.address || 'Location on map'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)' }}>
          <Clock size={11} />
          {formatTime(incident.updated_at)}
        </span>
      </div>
    </div>
  );
};
