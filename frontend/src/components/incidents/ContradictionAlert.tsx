import React from 'react';
import type { Contradiction } from '@/types/domain';
import { AlertTriangle } from 'lucide-react';

interface ContradictionAlertProps {
  contradictions?: Contradiction[];
  onReviewEvidence?: () => void;
}

export const ContradictionAlert: React.FC<ContradictionAlertProps> = ({
  contradictions,
  onReviewEvidence,
}) => {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#fefce8',
        borderRadius: '4px',
        border: '1px solid #fef08a',
        borderLeft: '3px solid #ca8a04',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertTriangle size={14} color="#a16207" />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#854d0e',
          }}
        >
          CONFLICTING REPORTS
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: '#713f12', lineHeight: 1.45 }}>
        {contradictions.map((c) => (
          <div key={c.contradiction_id}>
            <span>{c.claim_a?.statement || 'One report indicates standard road access.'}</span>
            <span style={{ display: 'block', marginTop: '1px' }}>
              {c.claim_b?.statement || 'A later recording indicates vehicles cannot pass.'}
            </span>
          </div>
        ))}
      </div>

      {onReviewEvidence && (
        <div style={{ paddingTop: '2px' }}>
          <button
            type="button"
            onClick={onReviewEvidence}
            style={{
              padding: '4px 10px',
              borderRadius: '3px',
              backgroundColor: '#ffffff',
              border: '1px solid #fde047',
              color: '#854d0e',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            [ REVIEW EVIDENCE ]
          </button>
        </div>
      )}
    </div>
  );
};
