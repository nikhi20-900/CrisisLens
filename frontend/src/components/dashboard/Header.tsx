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
  activeTab?: 'live' | 'incidents' | 'map';
  onSelectTab?: (tab: 'live' | 'incidents' | 'map') => void;
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
  activeTab = 'live',
  onSelectTab,
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
        padding: '0 20px',
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1800px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: CRISISLENS & Minimal Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#0f172a',
              }}
            >
              CRISISLENS
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: '#e2e8f0' }} />

          {/* Minimal Navigation: LIVE, INCIDENTS, MAP */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('live')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'live' ? '#f1f5f9' : 'transparent',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: activeTab === 'live' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'inline-block',
                }}
              />
              <span>LIVE</span>
              {attentionCount > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '0 5px',
                    borderRadius: '10px',
                  }}
                >
                  {attentionCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('incidents')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'incidents' ? '#f1f5f9' : 'transparent',
                color: activeTab === 'incidents' ? '#0f172a' : '#64748b',
                fontSize: '12px',
                fontWeight: activeTab === 'incidents' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              INCIDENTS
            </button>

            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: activeTab === 'map' ? '#f1f5f9' : 'transparent',
                color: activeTab === 'map' ? '#0f172a' : '#64748b',
                fontSize: '12px',
                fontWeight: activeTab === 'map' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              MAP
            </button>
          </nav>
        </div>

        {/* Right: + ADD REPORT & Unobtrusive Ops Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Primary Action: + ADD REPORT */}
          {onAddReport && (
            <button
              type="button"
              onClick={onAddReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '4px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>+ ADD REPORT</span>
            </button>
          )}

          {/* Demo Step Control (Quiet & Subtle) */}
          {isDemoMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                color: '#475569',
              }}
            >
              <span>Demo Step {simulationStep}/{totalSteps}</span>
              <button
                type="button"
                onClick={onAdvanceSimulation}
                disabled={simulationStep >= totalSteps}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: simulationStep >= totalSteps ? 'not-allowed' : 'pointer',
                  opacity: simulationStep >= totalSteps ? 0.4 : 1,
                }}
                title={nextStepLabel || 'Advance timeline snapshot'}
              >
                <FastForward size={11} />
                <span>Next</span>
              </button>
              <button
                type="button"
                onClick={onResetSimulation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
                title="Reset simulation"
              >
                <RotateCcw size={11} />
              </button>
            </div>
          )}

          {/* Backend / Demo Mode toggle */}
          <button
            type="button"
            onClick={onToggleSource}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: isLiveApi ? '#166534' : '#64748b',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Toggle between live backend API and demo mode"
          >
            <Server size={11} color={isLiveApi ? '#16a34a' : '#94a3b8'} />
            <span>{isLiveApi ? 'API Connected' : 'Demo Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
