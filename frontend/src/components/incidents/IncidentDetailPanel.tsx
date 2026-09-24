import React from 'react';
import { Incident } from '../../types';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { formatCoordinates, getAccessStatusLabel, formatTime } from '../../lib/formatters';
import { MapPin } from 'lucide-react';

export interface IncidentDetailPanelProps {
  incident: Incident;
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  loading = false,
  isLoading = false,
  error,
  onRetry,
}) => {
  const isBusy = loading || isLoading;

  if (isBusy) {
    return <Spinner label="Loading incident details..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={onRetry} />;
  }

  const access = getAccessStatusLabel(incident.access_status);

  // Confidence extraction from contributing evidence if available
  const averageConfidence =
    incident.evidence_links.length > 0
      ? incident.evidence_links.reduce((acc, el) => acc + el.similarity_score, 0) / incident.evidence_links.length
      : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Title & Status Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700 }}>
              {incident.incident_id}
            </span>
            <Badge variant={incident.severity} size="sm" pulse={incident.severity === 'critical'}>
              {incident.severity}
            </Badge>
            <Badge variant={incident.status === 'active' ? 'info' : 'low'} size="sm">
              {incident.status}
            </Badge>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {incident.title}
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Last Updated</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatTime(incident.updated_at)}
          </span>
        </div>
      </div>

      {/* Grid of Key Operational Signals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '12px',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Disaster</span>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {incident.disaster_type}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>People Affected</span>
          <strong style={{ fontSize: '13px', color: incident.people_affected > 0 ? 'var(--severity-critical)' : 'var(--text-primary)' }}>
            {incident.people_affected > 0 ? `${incident.people_affected} in danger` : 'None reported'}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Road Access</span>
          <strong style={{ fontSize: '13px', color: access.color }}>
            {access.label}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>AI Match Confidence</span>
          <strong style={{ fontSize: '13px', color: averageConfidence ? 'var(--color-primary)' : 'var(--text-muted)' }}>
            {averageConfidence ? `${Math.round(averageConfidence * 100)}%` : 'Not available'}
          </strong>
        </div>
      </div>

      {/* Location Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--color-primary)" />
          <span>{incident.location.address || 'Address unspecified'}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {formatCoordinates(incident.location.lat, incident.location.lng)}
        </span>
      </div>
    </div>
  );
};
