import React, { useState } from 'react';
import type { Evidence, EvidenceLink } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { EvidenceCard } from './EvidenceCard';
import { FileText, Filter } from 'lucide-react';

interface EvidencePanelProps {
  evidenceList?: Evidence[];
  evidenceLinks?: EvidenceLink[];
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidenceList,
  evidenceLinks,
  loading = false,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const isBusy = loading || isLoading;
  const [filterSource, setFilterSource] = useState<string>('all');

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

  const filteredItems = filterSource === 'all'
    ? items
    : items.filter((item) => (item.evidence.raw_report?.source || '').toLowerCase() === filterSource.toLowerCase());

  return (
    <Card
      title="Incident Evidence"
      icon={<FileText size={16} color="var(--color-primary, #38bdf8)" />}
      headerExtra={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated, #1e293b)', color: 'var(--color-primary, #38bdf8)' }}>
            {items.length} Reports
          </span>
          {items.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} color="var(--text-muted, #64748b)" />
              <select
                aria-label="Filter evidence by source"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-elevated, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: 'var(--text-primary, #f8fafc)',
                  outline: 'none',
                }}
              >
                <option value="all">All Sources</option>
                <option value="citizen">Citizen</option>
                <option value="responder">Responder</option>
                <option value="emergency_call">Emergency Call</option>
                <option value="social">Social Media</option>
                <option value="sensor">IoT Sensor</option>
              </select>
            </div>
          )}
        </div>
      }
    >
      {isBusy ? (
        <Spinner label="Loading incident evidence..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} color="var(--text-muted, #64748b)" />}
          title="No Evidence Linked"
          message="No multimodal evidence reports have been fused into this incident yet."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredItems.map(({ evidence, similarityScore }) => (
            <EvidenceCard
              key={evidence.evidence_id}
              evidence={evidence}
              similarityScore={similarityScore}
            />
          ))}
          {filteredItems.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', textAlign: 'center', padding: '16px' }}>
              No evidence matching selected filter "{filterSource}".
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
