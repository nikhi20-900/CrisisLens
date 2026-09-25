import React, { useState } from 'react';
import type { ActionPlan } from '@/types/domain';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { VerificationModal } from './VerificationModal';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RecommendationPanelProps {
  recommendations: ActionPlan[];
  loading?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onVerify: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onEdit: (id: string, notes: string) => Promise<void>;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  loading = false,
  isLoading = false,
  error = null,
  onRetry,
  onVerify,
  onReject,
  onEdit,
}) => {
  const isBusy = loading || isLoading;
  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'edit' | 'reject';
    rec: ActionPlan;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (notes: string) => {
    if (!activeModal) return;
    setSubmitting(true);

    try {
      if (activeModal.type === 'approve') {
        await onVerify(activeModal.rec.action_id, notes);
      } else if (activeModal.type === 'reject') {
        await onReject(activeModal.rec.action_id, notes);
      } else if (activeModal.type === 'edit') {
        await onEdit(activeModal.rec.action_id, notes);
      }
      setActiveModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
          <h3
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              fontWeight: 700,
              margin: 0,
            }}
          >
            RECOMMENDED RESPONSE
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Decision Support
          </span>
        </div>

        {isBusy ? (
          <Spinner message="Retrieving response recommendation..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={onRetry} />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No Recommendations"
            message="No response actions currently proposed."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recommendations.map((rec) => {
              const isPending = rec.verification_status === 'pending';
              const isApproved = rec.verification_status === 'approved' || rec.verification_status === 'edited';
              const isRejected = rec.verification_status === 'rejected';

              return (
                <div
                  key={rec.action_id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '4px',
                    border: isPending
                      ? '1px solid #e2e8f0'
                      : isApproved
                      ? '1px solid #bbf7d0'
                      : '1px solid #fecaca',
                    backgroundColor: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {/* Action Plan Title & Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#94a3b8',
                          display: 'block',
                        }}
                      >
                        RECOMMENDED ACTION PLAN #{rec.action_id}
                      </span>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                        {isPending ? 'Recommend deploying emergency response units' : 'Verified Action Plan'}
                      </h4>
                      {rec.resource_rationale && (
                        <p style={{ fontSize: '12px', color: '#475569', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                          {isPending
                            ? rec.resource_rationale.replace(/\bDispatched\b/gi, 'Recommend deploying')
                            : rec.resource_rationale}
                        </p>
                      )}
                    </div>

                    <div>
                      {isPending && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          PENDING VERIFICATION
                        </span>
                      )}
                      {isApproved && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            border: '1px solid #86efac',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          RECOMMENDATION VERIFIED
                        </span>
                      )}
                      {isRejected && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <XCircle size={12} />
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nearby Resources & ETA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isPending ? 'Recommended resource:' : 'Assigned resource:'}
                    </span>
                    {rec.recommended_resources.map((res) => (
                      <div
                        key={res.resource_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {res.name}
                          {res.capacity && (
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                              (capacity: {res.capacity})
                            </span>
                          )}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                          ETA: {res.estimated_eta_minutes ? `${res.estimated_eta_minutes} min` : 'Available nearby'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Why */}
                  {rec.priority_rationale && rec.priority_rationale.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Why:
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {rec.priority_rationale.map((line, idx) => (
                          <li key={idx} style={{ color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ color: '#64748b' }}>•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Human Decision Verification Actions */}
                  {isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={() => setActiveModal({ type: 'reject', rec })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#991b1b',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        [ REJECT ]
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModal({ type: 'approve', rec })}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '4px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #0f172a',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Verify Action
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
                      <span>
                        {isApproved ? 'Recommendation verified by human responder' : 'Recommendation rejected'}
                        {rec.verified_by && ` (${rec.verified_by})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModal({ type: isApproved ? 'reject' : 'approve', rec })}
                        style={{ background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                      >
                        Change Decision
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeModal && (
        <VerificationModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onConfirm={handleAction}
          actionType={activeModal.type}
          recommendation={activeModal.rec}
          submitting={submitting}
        />
      )}
    </>
  );
};
