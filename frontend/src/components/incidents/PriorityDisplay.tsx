import React from 'react';
import type { SeverityLevel, PriorityResult } from '@/types/domain';
import { Badge } from '@/components/common/Badge';

export interface PriorityDisplayProps {
  score?: number;
  priorityScore?: number;
  level?: SeverityLevel;
  priorityLevel?: SeverityLevel;
  reasons?: string[];
  priorityResult?: PriorityResult;
}

export const PriorityDisplay: React.FC<PriorityDisplayProps> = ({
  score,
  priorityScore,
  level,
  priorityLevel,
  reasons = [],
  priorityResult,
}) => {
  const finalScore =
    priorityResult?.score !== undefined
      ? priorityResult.score
      : score !== undefined
      ? score
      : priorityScore !== undefined
      ? priorityScore
      : 0;
  const finalLevel: SeverityLevel = priorityResult?.priority_level || level || priorityLevel || 'medium';
  const finalReasons =
    priorityResult?.reasons && priorityResult.reasons.length > 0 ? priorityResult.reasons : reasons;

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
      {/* Header & Priority Level */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            PRIORITY
          </h3>
          <Badge variant={finalLevel} size="md">
            {finalLevel}
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {finalScore > 0 && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Score: <strong style={{ color: '#475569' }}>{finalScore.toFixed(1)}</strong> / 100
            </span>
          )}
          {priorityResult?.confidence !== undefined && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Conf: <strong style={{ color: '#475569' }}>{Math.round(priorityResult.confidence * 100)}%</strong>
            </span>
          )}
        </div>
      </div>

      {/* Reasons (Plain language backend-provided rationale) */}
      <div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
          Reasons:
        </span>
        {finalReasons.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Priority established by active disaster indicators.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {finalReasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '13px',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: finalLevel === 'critical' ? '#b91c1c' : '#64748b' }}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
