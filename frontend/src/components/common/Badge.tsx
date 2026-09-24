import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'moderate' | 'low' | 'info' | 'neutral' | 'pending' | 'approved' | 'rejected' | 'default';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
}) => {
  const getStyle = (): { bg: string; color: string; border: string } => {
    switch (variant) {
      case 'critical':
      case 'rejected':
        return {
          bg: '#fef2f2',
          color: '#991b1b',
          border: '#fecaca',
        };
      case 'high':
        return {
          bg: '#fff7ed',
          color: '#9a3412',
          border: '#fed7aa',
        };
      case 'medium':
      case 'moderate':
      case 'pending':
        return {
          bg: '#fffbeb',
          color: '#92400e',
          border: '#fde68a',
        };
      case 'low':
      case 'approved':
        return {
          bg: '#f0fdf4',
          color: '#166534',
          border: '#bbf7d0',
        };
      case 'info':
        return {
          bg: '#f0f9ff',
          color: '#075985',
          border: '#bae6fd',
        };
      case 'default':
      case 'neutral':
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '1px 6px' : '3px 8px',
        borderRadius: '3px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};
