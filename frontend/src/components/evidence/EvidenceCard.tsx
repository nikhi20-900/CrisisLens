import React from 'react';
import type { Evidence } from '@/types/domain';
import { Badge } from '@/components/common/Badge';
import { formatTime } from '@/lib';
import { User, ShieldAlert, Radio, Cpu, Camera, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
  similarityScore?: number;
}

const getSourceIcon = (source?: string) => {
  switch (source) {
    case 'responder':
      return <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />;
    case 'citizen':
      return <User className="w-3.5 h-3.5 text-emerald-400" />;
    case 'sensor':
      return <Cpu className="w-3.5 h-3.5 text-amber-400" />;
    case 'drone':
      return <Camera className="w-3.5 h-3.5 text-purple-400" />;
    case 'social':
    default:
      return <Radio className="w-3.5 h-3.5 text-pink-400" />;
  }
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, similarityScore }) => {
  // Average confidence score across dimensions
  const confScores = evidence.confidence ? Object.values(evidence.confidence) : [0.9];
  const avgConf = confScores.reduce((a, b) => a + b, 0) / confScores.length;
  const confPct = Math.round(avgConf * 100);

  const sourceName = evidence.raw_report?.source || 'Citizen';
  const timestamp = evidence.raw_report?.timestamp || evidence.extracted_at;
  const textContent = evidence.raw_report?.text;

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle, #1e293b)',
        backgroundColor: 'var(--bg-card, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Header: Source, Time, ID */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getSourceIcon(sourceName)}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)', textTransform: 'capitalize' }}>
            {sourceName} Report
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted, #64748b)' }}>
            #{evidence.evidence_id}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono)' }}>
          <Clock size={12} />
          {formatTime(timestamp)}
        </div>
      </div>

      {/* Raw text */}
      {textContent && (
        <div
          style={{
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-elevated, #1e293b)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
            "{textContent}"
          </p>
        </div>
      )}

      {/* Extracted Structured Observations */}
      <div>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '6px' }}>
          Detected Observations
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {evidence.people_affected !== undefined && evidence.people_affected > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--severity-critical, #ef4444)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
              }}
            >
              <strong>{evidence.people_affected}</strong> people affected
            </span>
          )}

          {evidence.access_status && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <AlertTriangle size={11} />
              Access: {evidence.access_status}
            </span>
          )}

          {evidence.severity && (
            <Badge variant={evidence.severity} size="sm">
              {evidence.severity.toUpperCase()}
            </Badge>
          )}

          {evidence.needs && evidence.needs.map((need, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--color-primary, #38bdf8)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Need: {need}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Confidence & Fusion Match Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted, #64748b)' }}>AI Confidence:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: confPct >= 80 ? '#22c55e' : '#f59e0b' }}>
            {confPct}%
          </span>
        </div>

        {similarityScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary, #38bdf8)' }}>
            <CheckCircle2 size={12} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>Fusion Match:</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(similarityScore * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
