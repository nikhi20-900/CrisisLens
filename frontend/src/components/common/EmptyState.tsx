import React from 'react';
import { Info } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  description,
  icon = <Info size={28} color="var(--text-muted, #64748b)" />,
}) => {
  const text = description || message || 'No data available';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px dashed var(--border-subtle, #334155)',
        gap: '8px',
      }}
    >
      <div>{icon}</div>
      {title && (
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)' }}>{title}</h4>
      )}
      <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', maxWidth: '320px' }}>{text}</p>
    </div>
  );
};
