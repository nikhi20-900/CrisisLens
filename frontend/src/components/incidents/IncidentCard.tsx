import React from 'react';
import { Incident } from '../../types';
import { Badge } from '../common/Badge';
import { formatTime, getAccessStatusLabel } from '../../lib/formatters';
import { MapPin, Users } from 'lucide-react';

interface IncidentCardProps {
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

  return (
    <div
      onClick={() => onSelect(incident.incident_id)}
      style={{
        backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderRadius: '10px',
        border: isSelected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
            {incident.incident_id}
          </span>
          <Badge variant={incident.severity} size="sm" pulse={incident.severity === 'critical'}>
            {incident.severity}
          </Badge>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {formatTime(incident.updated_at)}
        </span>
      </div>

      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {incident.title}
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={12} color="var(--text-muted)" />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {incident.location.address || 'Unknown coordinates'}
          </span>
        </div>
        {incident.people_affected > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--severity-high)' }}>
            <Users size={12} />
            <strong>{incident.people_affected} affected</strong>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '11px' }}>
        <span style={{ color: access.color, fontWeight: 500 }}>
          {access.label}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Priority Score: <strong style={{ color: 'var(--text-primary)' }}>{incident.priority_score.toFixed(1)}</strong>
        </span>
      </div>
    </div>
  );
};
