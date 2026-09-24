import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  icon,
  disabled,
  style,
  ...props
}) => {
  const isBusy = isLoading || loading;

  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '6px',
      fontWeight: 600,
      cursor: disabled || isBusy ? 'not-allowed' : 'pointer',
      opacity: disabled || isBusy ? 0.6 : 1,
      transition: 'all 0.15s ease',
      border: 'none',
      ...style,
    };

    if (size === 'sm') {
      base.padding = '6px 12px';
      base.fontSize = '12px';
    } else if (size === 'lg') {
      base.padding = '12px 24px';
      base.fontSize = '15px';
    } else {
      base.padding = '8px 16px';
      base.fontSize = '13px';
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = 'var(--color-primary, #38bdf8)';
        base.color = '#0a0d14';
        break;
      case 'secondary':
        base.backgroundColor = 'var(--bg-elevated, #1e293b)';
        base.color = 'var(--text-primary, #f8fafc)';
        base.border = '1px solid var(--border-subtle, #334155)';
        break;
      case 'success':
        base.backgroundColor = '#16a34a';
        base.color = '#ffffff';
        break;
      case 'danger':
        base.backgroundColor = '#dc2626';
        base.color = '#ffffff';
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.color = 'var(--text-secondary, #94a3b8)';
        base.border = '1px solid var(--border-subtle, #334155)';
        break;
    }

    return base;
  };

  return (
    <button disabled={disabled || isBusy} style={getStyles()} {...props}>
      {isBusy ? (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
