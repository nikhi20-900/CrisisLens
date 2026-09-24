import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral' | 'pending' | 'approved' | 'rejected' | 'default';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'critical':
      case 'rejected':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.35)',
        };
      case 'high':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: 'rgba(249, 115, 22, 0.35)',
        };
      case 'medium':
      case 'pending':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          color: '#eab308',
          border: 'rgba(234, 179, 8, 0.35)',
        };
      case 'low':
      case 'approved':
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          border: 'rgba(34, 197, 94, 0.35)',
        };
      case 'info':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.35)',
        };
      case 'default':
      case 'neutral':
      default:
        return {
          bg: 'var(--bg-elevated, #1e293b)',
          color: 'var(--text-secondary, #94a3b8)',
          border: 'var(--border-subtle, #334155)',
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {pulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: colors.color,
            boxShadow: `0 0 8px ${colors.color}`,
          }}
        />
      )}
      {children}
    </span>
  );
};
