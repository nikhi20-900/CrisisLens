import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
  style?: React.CSSProperties;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message = 'Unable to communicate with the incident intelligence engine.',
  onRetry,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444',
        gap: '12px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={18} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>{message}</span>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          <RefreshCw size={12} /> Retry
        </Button>
      )}
    </div>
  );
};
