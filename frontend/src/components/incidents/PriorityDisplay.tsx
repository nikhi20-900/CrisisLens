import type { SeverityLevel } from '@/types/domain';
import { Badge } from '@/components/common/Badge';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontWeight: 700 }}>
            Operational Priority
          </h4>
          <Badge variant={finalLevel} size="md">
            {finalLevel}
          </Badge>
        </div>

        {finalScore > 0 && (
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
            Score: <strong style={{ color: '#0f172a' }}>{finalScore.toFixed(1)}</strong> / 100
          </span>
        )}
      </div>

      {/* Rationale */}
      <div>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
          Scoring Rationale (Why):
        </span>
        {reasons.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Priority established by initial disaster evidence indicators.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '12px',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: '#0284c7', fontSize: '14px', lineHeight: 1 }}>•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
