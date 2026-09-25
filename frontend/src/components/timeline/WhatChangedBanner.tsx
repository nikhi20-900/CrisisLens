import React from 'react';
import type { IncidentSnapshot, SeverityLevel } from '@/types/domain';
import { formatTime } from '@/lib/formatters';

interface WhatChangedBannerProps {
  snapshot?: IncidentSnapshot | null;
  snapshots?: IncidentSnapshot[];
  previousSeverity?: SeverityLevel;
}

export const WhatChangedBanner: React.FC<WhatChangedBannerProps> = ({
  snapshot,
  snapshots,
  previousSeverity,
}) => {
  const listToRender = snapshots && snapshots.length > 0 ? snapshots : (snapshot ? [snapshot] : []);

  if (listToRender.length === 0) {
    return (
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        Waiting for situation changes...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#475569',
            margin: 0,
          }}
        >
          WHAT CHANGED?
        </h3>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Chronological Evolution ({listToRender.length})
        </span>
      </div>

      {/* Chronological Vertical Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {listToRender.map((snap, idx) => {
          const timeStr = formatTime(snap.timestamp);
          const deltas = snap.delta_summary || [];
          const mainText = deltas.length > 0 ? deltas[0] : snap.summary;
          const isLatest = idx === listToRender.length - 1;

          // Determine if there is a newly added change or access status change
          const isAccessChanged = deltas.some((d) => d.toLowerCase().includes('access') || d.toLowerCase().includes('blocked'));
          const isCriticalNew = isLatest && (snap.severity === 'critical' || deltas.some((d) => d.toLowerCase().includes('critical') || d.toLowerCase().includes('medical')));

          return (
            <React.Fragment key={snap.snapshot_id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '6px 0',
                }}
              >
                {/* Fixed-width aligned timestamp */}
                <div style={{ minWidth: '55px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: isLatest ? 700 : 500,
                      color: isLatest ? '#0f172a' : '#64748b',
                    }}
                  >
                    {timeStr}
                  </span>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    {snap.snapshot_id}
                  </span>
                </div>

                {/* Event Description & Subtle Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  {isCriticalNew && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        letterSpacing: '0.04em',
                      }}
                    >
                      NEW
                    </span>
                  )}
                  {isAccessChanged && isLatest && !isCriticalNew && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '2px',
                        backgroundColor: '#fffbeb',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        letterSpacing: '0.04em',
                      }}
                    >
                      CHANGED
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isLatest ? 600 : 400,
                      color: isLatest ? '#0f172a' : '#334155',
                      lineHeight: 1.4,
                    }}
                  >
                    {mainText}
                  </span>
                </div>
              </div>

              {/* Subtle vertical connector between events */}
              {idx < listToRender.length - 1 && (
                <div style={{ paddingLeft: '22px', height: '14px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: 1 }}>↓</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {previousSeverity && snapshot && previousSeverity !== snapshot.severity && (
        <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, paddingTop: '4px', borderTop: '1px solid #f8fafc' }}>
          Incident escalated from {previousSeverity} to {snapshot.severity}
        </div>
      )}
    </div>
  );
};
