import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label, message }) => {
  const getDims = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 36;
      default:
        return 24;
    }
  };

  const dim = getDims();
  const text = message || label;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '12px',
        color: 'var(--text-muted, #64748b)',
      }}
    >
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          borderRadius: '50%',
          border: '2px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: 'var(--color-primary, #38bdf8)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && <span style={{ fontSize: '12px', fontWeight: 500 }}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
