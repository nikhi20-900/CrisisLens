import React from 'react';
import type { Evidence } from '@/types/domain';
import { formatTime } from '@/lib/formatters';
import { Clock, ShieldAlert, User, PhoneCall, Radio, AlertTriangle } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
  similarityScore?: number;
}

const getSourceIcon = (source?: string) => {
  const s = (source || '').toLowerCase();
  if (s.includes('responder')) return <ShieldAlert size={14} color="#0284c7" />;
  if (s.includes('call') || s.includes('emergency')) return <PhoneCall size={14} color="#b91c1c" />;
  if (s.includes('citizen')) return <User size={14} color="#15803d" />;
  return <Radio size={14} color="#64748b" />;
};

const getConfidenceLabel = (conf?: any): string => {
  if (!conf) return 'High confidence';
  const scores = typeof conf === 'object' ? Object.values(conf) : [conf];
  const avg = scores.reduce((a: any, b: any) => Number(a) + Number(b), 0) / scores.length;
  if (avg >= 0.8) return 'High confidence';
  if (avg >= 0.6) return 'Moderate confidence';
  return 'Low confidence';
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, similarityScore }) => {
  const sourceName = evidence.raw_report?.source || 'Citizen';
  const timestamp = evidence.raw_report?.timestamp || evidence.extracted_at;
  const textContent = evidence.raw_report?.text;
  const confLabel = getConfidenceLabel(evidence.confidence);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Header: Source, ID, Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getSourceIcon(sourceName)}
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
            {sourceName.replace('_', ' ')} Report
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
            #{evidence.evidence_id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          <Clock size={11} />
          {formatTime(timestamp)}
        </div>
      </div>

      {/* Raw text */}
      {textContent && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid #f1f5f9',
          }}
        >
          <p style={{ fontSize: '12px', color: '#1e293b', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
            "{textContent}"
          </p>
        </div>
      )}

      {/* Detected observations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
        {evidence.people_affected !== undefined && evidence.people_affected > 0 && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontWeight: 600,
            }}
          >
            {evidence.people_affected} people affected
          </span>
        )}

        {evidence.access_status && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <AlertTriangle size={11} />
            Road: {evidence.access_status}
          </span>
        )}

        {evidence.needs && evidence.needs.map((need, idx) => (
          <span
            key={idx}
            style={{
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
            }}
          >
            Need: {need}
          </span>
        ))}
      </div>

      {/* Footer: Human-readable confidence */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #f8fafc', fontSize: '11px', color: '#64748b' }}>
        <span>Quality: <strong style={{ color: '#0f172a' }}>{confLabel}</strong></span>
        {similarityScore !== undefined && (
          <span>Incident match: <strong style={{ color: '#0f172a' }}>{Math.round(similarityScore * 100)}%</strong></span>
        )}
      </div>
    </div>
  );
};
