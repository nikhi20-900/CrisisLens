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
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '12px',
      }}
    >
      {/* Header */}
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
            Active Incidents
          </h3>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '2px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
            }}
          >
            {incidents.length}
          </span>
        </div>

        {isBusy && (
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            Updating...
          </span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : isBusy && incidents.length === 0 ? (
        <Spinner message="Loading active incidents..." />
      ) : incidents.length === 0 ? (
        <EmptyState message="No active incidents reported." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
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
