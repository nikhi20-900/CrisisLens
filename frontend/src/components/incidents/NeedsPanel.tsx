import React from 'react';
import type { Need } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { getNeedTypeIcon } from '@/lib/formatters';
import { LifeBuoy } from 'lucide-react';

export interface NeedsPanelProps {
  needs: Need[];
}

export const NeedsPanel: React.FC<NeedsPanelProps> = ({ needs }) => {
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
        <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LifeBuoy size={14} color="#0284c7" /> Current Operational Needs ({needs.length})
        </h4>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {needs.filter((n) => n.status === 'unmet').length} Unmet
        </span>
      </div>

      {needs.length === 0 ? (
        <div style={{ padding: '14px', borderRadius: '4px', background: '#f8fafc', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
          No immediate resource requests recorded.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {needs.map((need) => (
            <div
              key={need.need_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '4px',
                backgroundColor: need.urgency === 'critical' ? '#fef2f2' : '#f8fafc',
                border: need.urgency === 'critical' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{getNeedTypeIcon(need.type)}</span>
                <div>
                  <strong style={{ fontSize: '13px', textTransform: 'capitalize', color: '#0f172a', display: 'block' }}>
                    {need.type}
                  </strong>
                  {need.description && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {need.description}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Badge variant={need.urgency} size="sm">
                  {need.urgency}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
