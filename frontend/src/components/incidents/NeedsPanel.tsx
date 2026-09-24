import React from 'react';
import { Need } from '../../types';
import { Badge } from '../common/Badge';
import { formatConfidence, getNeedTypeIcon } from '../../lib/formatters';
import { LifeBuoy } from 'lucide-react';

interface NeedsPanelProps {
  needs: Need[];
}

export const NeedsPanel: React.FC<NeedsPanelProps> = ({ needs }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LifeBuoy size={14} color="var(--color-primary)" /> Operational Needs ({needs.length})
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {needs.filter((n) => n.status === 'unmet').length} Unmet
        </span>
      </div>

      {needs.length === 0 ? (
        <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg-elevated)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          No immediate resource requests recorded.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {needs.map((need) => (
            <div
              key={need.need_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: need.status === 'unmet' ? 'var(--bg-card)' : 'rgba(255,255,255,0.02)',
                border: need.urgency === 'critical' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <span style={{ fontSize: '18px' }}>{getNeedTypeIcon(need.type)}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                      {need.type}
                    </strong>
                    {need.quantity && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Qty: {need.quantity}
                      </span>
                    )}
                  </div>
                  {need.description && (
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                      {need.description}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant={need.urgency} size="sm">
                  {need.urgency}
                </Badge>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Conf: {formatConfidence(need.confidence)}
                </span>
                <Badge variant={need.status === 'met' ? 'approved' : need.status === 'in_progress' ? 'pending' : 'neutral'} size="sm">
                  {need.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
