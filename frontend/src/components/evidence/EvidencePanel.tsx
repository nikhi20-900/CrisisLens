import React, { useState } from 'react';
import type { Evidence, EvidenceLink } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { EvidenceCard } from './EvidenceCard';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
    : items.filter((item) => (item.evidence.raw_report?.source || '').toLowerCase().includes(filterSource.toLowerCase()));

  // Progressive disclosure: show 2 items when collapsed, all when expanded
  const displayItems = isExpanded ? filteredItems : filteredItems.slice(0, 2);

  return (
    <Card
      title="Supporting Evidence & Field Reports"
      icon={<FileText size={15} color="#0f172a" />}
      headerExtra={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
            {items.length} Reports
          </span>
          {items.length > 1 && (
            <select
              aria-label="Filter evidence by source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              style={{
                fontSize: '11px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '2px 6px',
                color: '#1e293b',
                outline: 'none',
              }}
            >
              <option value="all">All Sources</option>
              <option value="citizen">Citizen</option>
              <option value="responder">Responder</option>
              <option value="emergency">Emergency Calls</option>
            </select>
          )}
        </div>
      }
    >
      {isBusy ? (
        <Spinner message="Loading incident evidence..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No Evidence Linked"
          message="No multimodal evidence reports have been linked to this incident yet."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayItems.map(({ evidence, similarityScore }) => (
            <EvidenceCard
              key={evidence.evidence_id}
              evidence={evidence}
              similarityScore={similarityScore}
            />
          ))}

          {filteredItems.length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '4px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0284c7',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} /> Show fewer reports
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> View all {filteredItems.length} evidence sources
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
