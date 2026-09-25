import React, { useState } from 'react';
import type { Evidence, EvidenceLink } from '@/types/domain';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { EvidenceCard } from './EvidenceCard';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTime } from '@/lib/formatters';

interface EvidencePanelProps {
  evidenceList?: Evidence[];
  evidenceLinks?: EvidenceLink[];
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddEvidence?: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidenceList,
  evidenceLinks,
  loading = false,
  isLoading = false,
  error = null,
  onRetry,
  onAddEvidence,
}) => {
  const isBusy = loading || isLoading;
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Merge direct evidence and evidence linked if available
  const items: { evidence: Evidence; similarityScore?: number }[] = [];

  if (evidenceList && evidenceList.length > 0) {
    evidenceList.forEach((e) => {
      const link = evidenceLinks?.find((l) => l.evidence_id === e.evidence_id);
      items.push({ evidence: e, similarityScore: link?.similarity_score });
    });
  } else if (evidenceLinks && evidenceLinks.length > 0) {
    evidenceLinks.forEach((link) => {
      if (link.evidence) {
        items.push({ evidence: link.evidence, similarityScore: link.similarity_score });
      }
    });
  }

  // Source breakdown counts
  const photosCount = items.filter(
    (it) => it.evidence.raw_report?.media?.some(
      (m) => m.media_type.includes('image') || m.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) || m.url.includes('unsplash.com') || m.url.startsWith('data:image/')
    )
  ).length;

  const videosCount = items.filter(
    (it) => it.evidence.raw_report?.media?.some(
      (m) => m.media_type.includes('video') || m.url.match(/\.(mp4|mov|webm)$/i) || m.url.startsWith('data:video/') || m.url.startsWith('blob:')
    )
  ).length;

  const textReportsCount = Math.max(
    items.length - photosCount - videosCount,
    items.length > 0 && photosCount === 0 && videosCount === 0 ? items.length : 0
  );

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              margin: 0,
            }}
          >
            EVIDENCE
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {items.length} {items.length === 1 ? 'source' : 'sources'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onAddEvidence && (
            <button
              type="button"
              onClick={onAddEvidence}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} />
              <span>ADD EVIDENCE</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>{isOpen ? 'HIDE EVIDENCE' : 'VIEW EVIDENCE'}</span>
              {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Sources Breakdown Banner (5 SOURCES: 📷 2 photos · 🎥 1 video · 📝 2 reports) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          color: '#334155',
          padding: '8px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '4px',
          border: '1px solid #f1f5f9',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          {items.length} SOURCES
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        {photosCount > 0 && <span>📷 {photosCount} {photosCount === 1 ? 'Photo' : 'Photos'}</span>}
        {videosCount > 0 && <span>🎥 {videosCount} {videosCount === 1 ? 'Video' : 'Videos'}</span>}
        {textReportsCount > 0 && <span>📝 {textReportsCount} {textReportsCount === 1 ? 'Report' : 'Reports'}</span>}
        {items.length === 0 && <span style={{ color: '#64748b' }}>No reports recorded yet</span>}
      </div>

      {isBusy ? (
        <Spinner message="Loading incident evidence..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No Evidence Linked"
          message="No multimodal evidence reports have been linked to this incident yet."
        />
      ) : isOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Simple Evidence -> Incident Connection (Point 11) */}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#475569',
            }}
          >
            <span>EVIDENCE: <strong>{items.length} sources</strong></span>
            <span style={{ color: '#64748b' }}>↓</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>SUPPORTING INCIDENT</span>
          </div>

          {/* Chronological Evidence Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px 8px', backgroundColor: '#fafafa', borderRadius: '4px', border: '1px solid #f1f5f9', fontSize: '11px' }}>
            {items.map(({ evidence }, idx) => {
              const time = formatTime(evidence.raw_report?.timestamp || evidence.extracted_at);
              const source = evidence.raw_report?.source || 'Citizen';
              const hasImg = evidence.raw_report?.media?.some(m => m.media_type.includes('image') || m.url.includes('unsplash.com') || m.url.startsWith('data:image/'));
              const hasVid = evidence.raw_report?.media?.some(m => m.media_type.includes('video') || m.url.startsWith('data:video/') || m.url.startsWith('blob:'));
              const icon = hasImg ? '📷' : hasVid ? '🎥' : source.includes('responder') || source.includes('police') ? '✓' : '📝';
              const label = hasImg ? 'Flood image' : hasVid ? 'Road video' : source.includes('responder') ? 'Responder confirmation' : `${source} report`;

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b', minWidth: '55px' }}>{time}</span>
                  <span>{icon}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{label}</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span style={{ color: '#64748b' }}>#{evidence.evidence_id}</span>
                </div>
              );
            })}
          </div>

          {/* Detailed Evidence Cards with Media Previews */}
          {items.map(({ evidence, similarityScore }) => (
            <EvidenceCard
              key={evidence.evidence_id}
              evidence={evidence}
              similarityScore={similarityScore}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
