import React from 'react';
import type { Incident } from '@/types/domain';
import { IncidentCard } from './IncidentCard';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorAlert } from '@/components/common/ErrorAlert';

export interface IncidentListProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident: (incidentId: string) => void;
  isLoading?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isLoading = false,
  loading = false,
  error,
  onRetry,
}) => {
  const isBusy = isLoading || loading;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        padding: '14px',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0,0,0,0.06))',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontWeight: 700 }}>
            Active Incident Queue
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
            }}
          >
            {incidents.length}
          </span>
        </div>

        {isBusy && (
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Syncing...
          </span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : isBusy && incidents.length === 0 ? (
        <Spinner message="Loading active incidents..." />
      ) : incidents.length === 0 ? (
        <EmptyState message="No active incidents require attention." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.incident_id}
              incident={incident}
              isSelected={incident.incident_id === selectedIncidentId}
              onSelect={onSelectIncident}
            />
          ))}
        </div>
      )}
    </div>
  );
};
