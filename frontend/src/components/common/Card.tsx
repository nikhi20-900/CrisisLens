import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  headerExtra?: React.ReactNode;
  icon?: React.ReactNode;
  glow?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  headerExtra,
  icon,
  style,
  className = '',
  onClick,
}) => {
  const extra = headerExtra || headerAction;

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0,0,0,0.06))',
        padding: '16px',
        transition: 'border-color 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {(title || extra || icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: subtitle ? '4px' : '12px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span style={{ color: '#475569', display: 'flex' }}>{icon}</span>}
            <div>
              {typeof title === 'string' ? (
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{subtitle}</p>
              )}
            </div>
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
