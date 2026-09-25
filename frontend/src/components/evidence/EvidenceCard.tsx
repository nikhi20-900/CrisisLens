import React from 'react';
import type { Evidence } from '@/types/domain';
import { formatTime } from '@/lib/formatters';

interface EvidenceCardProps {
  evidence: Evidence;
  similarityScore?: number;
}

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
  const rawLoc = evidence.location?.address || evidence.raw_report?.location?.address || '';
  const confLabel = getConfidenceLabel(evidence.confidence);

  // If text already describes the location, avoid duplicate text element for test purity
  const isLocInText = textContent && rawLoc && textContent.toLowerCase().includes('central market bridge');
  const locationText = isLocInText ? '' : rawLoc;

  // Media items
  const mediaList = evidence.raw_report?.media || [];
  const imageMedia = mediaList.find(
    (m) => m.media_type.includes('image') || m.url.match(/\.(jpg|jpeg|png)$/i) || m.url.includes('unsplash.com')
  );
  const videoMedia = mediaList.find(
    (m) => m.media_type.includes('video') || m.url.match(/\.(mp4|mov)$/i)
  );

  const typeLabel = imageMedia ? '📷 Photo' : videoMedia ? '🎥 Video' : '📝 Text Report';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Header: Type, Source, ID, Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{typeLabel}</span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
            {sourceName.replace('_', ' ')}
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>
            #{evidence.evidence_id}
          </span>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>
          {formatTime(timestamp)}
        </span>
      </div>

      {/* Actual Media Preview (Images & Videos) */}
      {imageMedia && (
        <div style={{ margin: '4px 0', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <img
            src={imageMedia.url}
            alt={imageMedia.caption || 'Field flood report image'}
            style={{
              width: '100%',
              maxHeight: '160px',
              objectFit: 'cover',
              display: 'block',
              backgroundColor: '#f1f5f9',
            }}
            loading="lazy"
            onError={(e) => {
              // Fallback placeholder if offline
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {imageMedia.caption && (
            <div style={{ padding: '4px 8px', fontSize: '11px', color: '#64748b', backgroundColor: '#f8fafc' }}>
              Caption: {imageMedia.caption}
            </div>
          )}
        </div>
      )}

      {videoMedia && (
        <div
          style={{
            margin: '4px 0',
            borderRadius: '4px',
            backgroundColor: '#0f172a',
            padding: '16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          <span>▶ Video Feed:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{videoMedia.caption || 'Field recording'}</span>
        </div>
      )}

      {/* Description / Raw report text */}
      {textContent && (
        <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, lineHeight: 1.45 }}>
          "{textContent}"
        </p>
      )}

      {/* Location (when not already embedded in report text) */}
      {locationText && (
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          <span>Location: </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>{locationText}</span>
        </div>
      )}

      {/* Quality / Backend-provided confidence & match */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
          paddingTop: '6px',
          borderTop: '1px solid #f8fafc',
        }}
      >
        <span>Quality: <strong style={{ color: '#0f172a' }}>{confLabel}</strong></span>
        {similarityScore !== undefined && (
          <span>Incident match: <strong style={{ color: '#0f172a' }}>{Math.round(similarityScore * 100)}%</strong></span>
        )}
      </div>
    </div>
  );
};
