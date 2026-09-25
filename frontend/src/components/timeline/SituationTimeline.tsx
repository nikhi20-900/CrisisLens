import React from 'react';
import type { IncidentSnapshot } from '@/types/domain';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTime } from '@/lib/formatters';

interface SituationTimelineProps {
  snapshots: IncidentSnapshot[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const SituationTimeline: React.FC<SituationTimelineProps> = ({
  snapshots,
  loading = false,
  error = null,
  onRetry,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', fontWeight: 800, margin: 0 }}>
          Incident Evolution Timeline
        </h3>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
          {snapshots.length} Snapshots
        </span>
      </div>

      {loading ? (
        <Spinner message="Loading situation timeline..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : snapshots.length === 0 ? (
        <EmptyState
          title="No Timeline Snapshots"
          message="Situation evolution snapshots have not been recorded yet."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {snapshots.map((snap, idx) => {
            const isLatest = idx === snapshots.length - 1;

            return (
              <div
                key={snap.snapshot_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr',
                  gap: '12px',
                  alignItems: 'baseline',
                  padding: '6px 0',
                  borderBottom: idx < snapshots.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: isLatest ? '#0f172a' : '#64748b' }}>
                    {formatTime(snap.timestamp)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#94a3b8' }}>
                    #{snap.snapshot_id}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: isLatest ? 600 : 500, color: isLatest ? '#0f172a' : '#334155' }}>
                    {snap.summary}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                    <span>Severity: <strong style={{ textTransform: 'uppercase' }}>{snap.severity}</strong></span>
                    <span>•</span>
                    <span>Affected: <strong>{snap.people_affected}</strong></span>
                    <span>•</span>
                    <span>Road: <strong>{snap.access_status}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
