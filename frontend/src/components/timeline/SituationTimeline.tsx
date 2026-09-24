import React from 'react';
import type { IncidentSnapshot } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
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
        padding: '16px',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0,0,0,0.06))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontWeight: 700 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
          {snapshots.map((snap, idx) => {
            const isLatest = idx === snapshots.length - 1;

            return (
              <div
                key={snap.snapshot_id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  backgroundColor: isLatest ? '#f8fafc' : '#ffffff',
                  border: isLatest ? '1px solid #cbd5e1' : '1px solid #f1f5f9',
                }}
              >
                {/* Time & Snapshot ID */}
                <div style={{ minWidth: '70px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    {formatTime(snap.timestamp)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b' }}>
                    #{snap.snapshot_id}
                  </span>
                </div>

                {/* Summary & Badges */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={snap.severity} size="sm">
                      {snap.severity}
                    </Badge>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                      {snap.summary}
                    </span>
                  </div>

                  {/* Impact metrics & deltas */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                    <span>Affected: <strong>{snap.people_affected}</strong></span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>Road: <strong>{snap.access_status}</strong></span>
                    <span>•</span>
                    <span>Priority: <strong>{snap.priority_score.toFixed(1)}</strong></span>
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
