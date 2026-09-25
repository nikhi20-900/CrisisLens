import React from 'react';
import type { Incident } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { formatTime, getAccessStatusLabel } from '@/lib/formatters';
import { Plus } from 'lucide-react';

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

  // Compute operational state
  const getOperationalState = () => {
    if (incident.status === 'resolved') {
      return { label: 'RESOLVED', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' };
    }
    if (incident.status === 'contained') {
      return { label: 'STABILIZING', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' };
    }
    if (incident.severity === 'critical') {
      return { label: 'CRITICAL', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' };
    }
    if (incident.severity === 'high') {
      return { label: 'ESCALATING', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' };
    }
    return { label: 'MONITORING', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' };
  };

  const opState = getOperationalState();
  const addressLabel = incident.location.address || 'Sector 4';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* 1. INCIDENT HEADER (Disaster Type & Location is strongest visual element) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          {/* Status & ID Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '2px',
                backgroundColor: opState.bg,
                color: opState.color,
                border: `1px solid ${opState.border}`,
                letterSpacing: '0.04em',
              }}
            >
              {opState.label}
            </span>
            <Badge variant={incident.severity} size="sm">
              {incident.severity}
            </Badge>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              {incident.incident_id}
            </span>
          </div>

          {/* Large Authoritative Title: Disaster Type & Location */}
          <h2
            style={{
              fontSize: '19px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              margin: '3px 0 5px 0',
              textTransform: 'uppercase',
            }}
          >
            {incident.title}
          </h2>

          {/* Core Secondary Scan Facts on one clean line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            <span style={{ fontWeight: 700, color: incident.severity === 'critical' ? '#b91c1c' : '#0f172a' }}>
              {incident.people_affected} in danger
            </span>
            <span>·</span>
            <span style={{ fontWeight: 600, color: access.color }}>
              Road access {incident.access_status}
            </span>
            <span>·</span>
            <span>Updated {formatTime(incident.updated_at)}</span>
            <span>·</span>
            <span>{addressLabel}</span>
          </div>
        </div>

        {/* Action: + ADD EVIDENCE */}
        {onAddEvidence && (
          <button
            type="button"
            onClick={() => onAddEvidence(incident.incident_id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={12} color="#0f172a" />
            <span>ADD EVIDENCE</span>
          </button>
        )}
      </div>

      {/* 2. NOW (Plain human language current brief) */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderLeft: incident.severity === 'critical' ? '3px solid #dc2626' : '3px solid #64748b',
          borderRadius: '2px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748b',
          }}
        >
          NOW
        </span>

        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#0f172a',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {latestSnapshot?.summary || `${incident.title}: situation active with ${incident.people_affected} affected citizens.`}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          <span>Road access status: <strong style={{ color: access.color }}>{access.label}</strong></span>
          {incident.current_needs && incident.current_needs.length > 0 && (
            <span>Immediate needs: <strong style={{ color: '#0f172a' }}>{incident.current_needs.map(n => n.type).join(', ')}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
};
