import React from 'react';
import type { Incident } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { formatCoordinates, getAccessStatusLabel, formatTime } from '@/lib/formatters';
import { MapPin, Users, Clock, Plus } from 'lucide-react';

export interface IncidentDetailPanelProps {
  incident: Incident;
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddEvidence?: (incidentId: string) => void;
}

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  loading = false,
  isLoading = false,
  error,
  onRetry,
  onAddEvidence,
}) => {
  const isBusy = loading || isLoading;

  if (isBusy) {
    return <Spinner message="Loading incident situation..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={onRetry} />;
  }

  const access = getAccessStatusLabel(incident.access_status);
  const latestSnapshot = incident.snapshots && incident.snapshots.length > 0
    ? incident.snapshots[incident.snapshots.length - 1]
    : null;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0,0,0,0.06))',
      }}
    >
      {/* Top Header: Title, Severity, Metadata */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
              {incident.incident_id}
            </span>
            <Badge variant={incident.severity} size="md">
              {incident.severity}
            </Badge>
            <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
              {incident.disaster_type} Hazard
            </span>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {incident.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
            {incident.people_affected > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#b91c1c' }}>
                <Users size={13} />
                {incident.people_affected} in danger
              </span>
            )}
            <span>•</span>
            <span style={{ color: access.color, fontWeight: 600 }}>
              {access.label}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
              <Clock size={12} />
              Updated {formatTime(incident.updated_at)}
            </span>
          </div>
        </div>

        {/* Location & Coordinates */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
            <MapPin size={13} color="#0284c7" />
            <span>{incident.location.address || 'Address unspecified'}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
            {formatCoordinates(incident.location.lat, incident.location.lng)}
          </span>
          {onAddEvidence && (
            <button
              onClick={() => onAddEvidence(incident.incident_id)}
              style={{
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} color="#0284c7" />
              <span>+ ADD EVIDENCE</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent "NOW" Operational Briefing Box */}
      <div
        style={{
          backgroundColor: incident.severity === 'critical' ? '#fef2f2' : '#f8fafc',
          borderRadius: '6px',
          border: incident.severity === 'critical' ? '1px solid #fecaca' : '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: incident.severity === 'critical' ? '#991b1b' : '#0284c7' }}>
            NOW (Current Situation Brief)
          </span>
        </div>

        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.4, margin: 0 }}>
          {latestSnapshot?.summary || `${incident.title}: situation active with ${incident.people_affected} affected citizens.`}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px', fontSize: '12px', color: '#334155' }}>
          <span>• Road access status: <strong style={{ color: access.color }}>{access.label}</strong></span>
          <span>• Citizens affected: <strong style={{ color: '#b91c1c' }}>{incident.people_affected}</strong></span>
          {incident.current_needs && incident.current_needs.length > 0 && (
            <span>• Immediate unmet needs: <strong>{incident.current_needs.map(n => n.type).join(', ')}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
};
