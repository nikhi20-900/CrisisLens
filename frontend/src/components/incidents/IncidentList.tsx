import React from 'react';
import { Incident } from '../../types';
import { IncidentCard } from './IncidentCard';
import { Spinner } from '../common/Spinner';
import { EmptyState } from '../common/EmptyState';
import { ErrorAlert } from '../common/ErrorAlert';
import { Radio } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={14} color="var(--color-primary)" /> Active Incidents ({incidents.length})
        </h3>
        {isBusy && (
          <span style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', animation: 'pulse 1s infinite' }} />
            Syncing...
          </span>
        )}
      </div>

      {error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : isBusy && incidents.length === 0 ? (
        <Spinner label="Loading active incidents..." />
      ) : incidents.length === 0 ? (
        <EmptyState message="No active disaster incidents reported in this operational sector." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
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
