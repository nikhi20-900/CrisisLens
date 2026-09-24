import React from 'react';
import { SeverityLevel } from '../../types';
import { Badge } from '../common/Badge';
import { Flame } from 'lucide-react';

export interface PriorityDisplayProps {
  score?: number;
  priorityScore?: number;
  level?: SeverityLevel;
  priorityLevel?: SeverityLevel;
  reasons?: string[];
}

export const PriorityDisplay: React.FC<PriorityDisplayProps> = ({
  score,
  priorityScore,
  level,
  priorityLevel,
  reasons = [],
}) => {
  const finalScore = score !== undefined ? score : priorityScore !== undefined ? priorityScore : 0;
  const finalLevel: SeverityLevel = level || priorityLevel || 'medium';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card, #0f172a)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle, #1e293b)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} color="var(--severity-critical, #ef4444)" />
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #94a3b8)', fontWeight: 700 }}>
            Dynamic Priority Assessment
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={finalLevel} size="sm" pulse={finalLevel === 'critical'}>
            {finalLevel}
          </Badge>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', fontFamily: 'var(--font-mono)' }}>
            {finalScore.toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>/ 100</span>
          </span>
        </div>
      </div>

      <div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
          Scoring Rationale (Explainable AI):
        </span>
        {reasons.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Baseline priority based on initial evidence reporting.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary, #94a3b8)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: 'var(--color-primary, #38bdf8)', fontSize: '14px', lineHeight: 1 }}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
