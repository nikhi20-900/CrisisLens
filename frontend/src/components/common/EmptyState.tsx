import React from 'react';

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
  icon,
}) => {
  const text = description || message || 'No incidents currently require attention.';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '4px',
        border: '1px dashed #cbd5e1',
        gap: '4px',
      }}
    >
      {icon && <div style={{ marginBottom: '2px' }}>{icon}</div>}
      {title && (
        <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', margin: 0 }}>
          {title}
        </h4>
      )}
      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '320px', lineHeight: 1.4 }}>
        {text}
      </p>
    </div>
  );
};
