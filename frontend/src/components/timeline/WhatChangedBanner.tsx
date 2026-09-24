import React from 'react';
import type { IncidentSnapshot, SeverityLevel } from '@/types/domain';
import { formatTime } from '@/lib/formatters';
import { Clock, ArrowRight } from 'lucide-react';

interface WhatChangedBannerProps {
  snapshot?: IncidentSnapshot | null;
  previousSeverity?: SeverityLevel;
}

export const WhatChangedBanner: React.FC<WhatChangedBannerProps> = ({
  snapshot,
  previousSeverity,
}) => {
  if (!snapshot) {
    return (
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        Waiting for initial situation evolution snapshot...
      </div>
    );
  }

  const deltas = snapshot.delta_summary || [];
  const isSeverityEscalated =
    previousSeverity && previousSeverity !== snapshot.severity;

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
        gap: '10px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a' }}>
            What Changed? (Situation Evolution)
          </h3>
        </div>

        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          Snapshot {snapshot.snapshot_id} • {formatTime(snapshot.timestamp)}
        </span>
      </div>

      {/* Snapshot summary */}
      <p style={{ fontSize: '13px', color: '#334155', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
        {snapshot.summary}
      </p>

      {/* Delta Badges / Change list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
        {isSeverityEscalated && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
            }}
          >
            Severity changed: {previousSeverity?.toUpperCase()} <ArrowRight size={11} /> {snapshot.severity.toUpperCase()}
          </span>
        )}

        {deltas.length > 0 ? (
          deltas.map((delta, idx) => {
            const isCritical =
              delta.toLowerCase().includes('critical') ||
              delta.toLowerCase().includes('medical') ||
              delta.toLowerCase().includes('trapped');
            const isBlocked = delta.toLowerCase().includes('blocked');

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: isCritical ? 600 : 500,
                  backgroundColor: isCritical ? '#fef2f2' : isBlocked ? '#fffbeb' : '#f1f5f9',
                  border: isCritical ? '1px solid #fecaca' : isBlocked ? '1px solid #fde68a' : '1px solid #cbd5e1',
                  color: isCritical ? '#991b1b' : isBlocked ? '#92400e' : '#1e293b',
                }}
              >
                <span>•</span>
                <span>{delta}</span>
              </span>
            );
          })
        ) : (
          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
            No delta changes recorded in this snapshot.
          </span>
        )}
      </div>
    </div>
  );
};
