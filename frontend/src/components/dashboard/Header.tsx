import React from 'react';
import {
  RotateCcw,
  FastForward,
  Server,
  Plus,
} from 'lucide-react';

interface HeaderProps {
  isLiveApi: boolean;
  onToggleSource: () => void;
  onAddReport?: () => void;
  attentionCount?: number;
  // Demo simulation controls
  isDemoMode: boolean;
  simulationStep: number;
  totalSteps: number;
  onAdvanceSimulation: () => void;
  onResetSimulation: () => void;
  nextStepLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isLiveApi,
  onToggleSource,
  onAddReport,
  attentionCount = 1,
  isDemoMode,
  simulationStep,
  totalSteps,
  onAdvanceSimulation,
  onResetSimulation,
  nextStepLabel,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1720px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand & Mission */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#0f172a',
              }}
            >
              CRISISLENS
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Operations Center
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0' }} />

          {/* Global Attention Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
              }}
            />
            <span>LIVE — {attentionCount} {attentionCount === 1 ? 'incident requires' : 'incidents require'} attention</span>
          </div>
        </div>

        {/* Operational Controls & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Simulation Stepper (When in Demo Mode) */}
          {isDemoMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                Demo Step {simulationStep}/{totalSteps}
              </span>
              <button
                onClick={onAdvanceSimulation}
                disabled={simulationStep >= totalSteps}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: simulationStep >= totalSteps ? 'not-allowed' : 'pointer',
                  opacity: simulationStep >= totalSteps ? 0.5 : 1,
                }}
                title={nextStepLabel || 'Advance to next disaster snapshot'}
              >
                <FastForward size={12} />
                <span>Advance</span>
              </button>
              <button
                onClick={onResetSimulation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
                title="Reset simulation to initial flood report"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          {/* Primary Ingestion Action: Add Report */}
          {onAddReport && (
            <button
              onClick={onAddReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '4px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              <Plus size={13} />
              <span>+ ADD REPORT</span>
            </button>
          )}

          {/* Source Toggle: Backend vs Demo */}
          <button
            onClick={onToggleSource}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: isLiveApi ? '#86efac' : '#cbd5e1',
              backgroundColor: isLiveApi ? '#f0fdf4' : '#ffffff',
              color: isLiveApi ? '#166534' : '#475569',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <Server size={13} color={isLiveApi ? '#16a34a' : '#64748b'} />
            <span>{isLiveApi ? 'Connected (Live API)' : 'Offline Demo Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
