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
  glow = false,
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
        backgroundColor: 'var(--bg-card, #0f172a)',
        borderRadius: '10px',
        border: glow ? '1px solid var(--border-active, #38bdf8)' : '1px solid var(--border-subtle, #1e293b)',
        boxShadow: glow ? '0 0 20px rgba(56, 189, 248, 0.15)' : 'var(--shadow-card, 0 4px 6px -1px rgba(0, 0, 0, 0.5))',
        padding: '16px',
        transition: 'all 0.2s ease',
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
            marginBottom: subtitle ? '4px' : '14px',
            borderBottom: '1px solid var(--border-subtle, #1e293b)',
            paddingBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span>{icon}</span>}
            <div>
              {typeof title === 'string' ? (
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>{subtitle}</p>
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
