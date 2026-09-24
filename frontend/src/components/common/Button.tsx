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
      gap: '6px',
      borderRadius: '4px',
      fontWeight: 600,
      cursor: disabled || isBusy ? 'not-allowed' : 'pointer',
      opacity: disabled || isBusy ? 0.6 : 1,
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
      border: '1px solid transparent',
      ...style,
    };

    if (size === 'sm') {
      base.padding = '4px 10px';
      base.fontSize = '12px';
      base.lineHeight = '16px';
    } else if (size === 'lg') {
      base.padding = '10px 20px';
      base.fontSize = '14px';
      base.lineHeight = '20px';
    } else {
      base.padding = '6px 14px';
      base.fontSize = '13px';
      base.lineHeight = '18px';
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = '#0284c7';
        base.color = '#ffffff';
        base.borderColor = '#0284c7';
        break;
      case 'secondary':
        base.backgroundColor = '#ffffff';
        base.color = '#1e293b';
        base.borderColor = '#cbd5e1';
        break;
      case 'success':
        base.backgroundColor = '#15803d';
        base.color = '#ffffff';
        base.borderColor = '#15803d';
        break;
      case 'danger':
        base.backgroundColor = '#b91c1c';
        base.color = '#ffffff';
        base.borderColor = '#b91c1c';
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.color = '#334155';
        base.borderColor = '#94a3b8';
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
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255,255,255,0.4)',
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
