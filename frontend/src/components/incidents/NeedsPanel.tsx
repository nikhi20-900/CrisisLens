import React from 'react';
import type { Need } from '@/types/domain';
import { Badge } from '@/components/common/Badge';

export interface NeedsPanelProps {
  needs: Need[];
}

const getNeedIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'rescue':
      return '🚨';
    case 'medical':
      return '🚑';
    case 'water':
    case 'food':
      return '💧';
    case 'transport':
      return '🚐';
    default:
      return '⚠️';
  }
};

export const NeedsPanel: React.FC<NeedsPanelProps> = ({ needs }) => {
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          CURRENT NEEDS
        </h3>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Operational Needs ({needs.length})
        </span>
      </div>

      {needs.length === 0 ? (
        <div style={{ padding: '8px 10px', borderRadius: '3px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px' }}>
          No immediate resource requests recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {needs.map((need) => (
            <div
              key={need.need_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>{getNeedIcon(need.type)}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {need.type}
                </span>
              </div>

              <Badge variant={need.urgency} size="sm">
                {need.urgency === 'critical' ? 'Critical' : need.urgency === 'high' ? 'Urgent' : need.urgency}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
