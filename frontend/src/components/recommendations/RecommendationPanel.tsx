import React, { useState } from 'react';
import type { ActionPlan } from '@/types/domain';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { EmptyState } from '@/components/common/EmptyState';
import { VerificationModal } from './VerificationModal';
import {
  ShieldCheck,
  XCircle,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAction = async (notes: string) => {
    if (!activeModal) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      if (activeModal.type === 'approve') {
        await onVerify(activeModal.rec.action_id, notes);
        setFeedback({
          type: 'success',
          message: `Recommendation approved: Action Plan #${activeModal.rec.action_id} verified.`,
        });
      } else if (activeModal.type === 'reject') {
        await onReject(activeModal.rec.action_id, notes);
        setFeedback({
          type: 'success',
          message: `Recommendation rejected: Action Plan #${activeModal.rec.action_id} rejected.`,
        });
      } else if (activeModal.type === 'edit') {
        await onEdit(activeModal.rec.action_id, notes);
        setFeedback({
          type: 'success',
          message: `Recommendation updated & approved: Action Plan #${activeModal.rec.action_id}.`,
        });
      }
      setActiveModal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record response decision';
      setFeedback({
        type: 'error',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        title="Recommended Operational Response"
        icon={<ShieldCheck size={16} color="#0f172a" />}
        headerExtra={
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Human Decision Required
          </span>
        }
      >
        {feedback && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: feedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: feedback.type === 'success' ? '#166534' : '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
            >
              ×
            </button>
          </div>
        )}

        {isBusy ? (
          <Spinner message="Generating response recommendations..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={onRetry} />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No Recommendations Generated"
            message="No action plans have been proposed for this incident yet."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map((rec) => {
              const isPending = rec.verification_status === 'pending';
              const isApproved = rec.verification_status === 'approved' || rec.verification_status === 'edited';
              const isRejected = rec.verification_status === 'rejected';

              return (
                <div
                  key={rec.action_id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '6px',
                    border: isPending
                      ? '1px solid #fde68a'
                      : isApproved
                      ? '1px solid #bbf7d0'
                      : '1px solid #e2e8f0',
                    backgroundColor: isPending ? '#fffbeb' : isApproved ? '#f0fdf4' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Top Bar: Action Title & Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          RECOMMENDED ACTION PLAN #{rec.action_id}
                        </span>
                        <Badge variant={rec.priority_level} size="sm">
                          {rec.priority_level} priority
                        </Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                        {rec.resource_rationale}
                      </p>
                    </div>

                    <div>
                      {isPending && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '3px' }}>
                          PENDING VERIFICATION
                        </span>
                      )}
                      {isApproved && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '3px' }}>
                          <CheckCircle2 size={12} />
                          VERIFIED
                        </span>
                      )}
                      {isRejected && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#991b1b', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '3px' }}>
                          <XCircle size={12} />
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allocated Resources & ETAs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                      Available Resources & Staged Units:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {rec.recommended_resources.map((res) => (
                        <div
                          key={res.resource_id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={12} color="#0284c7" />
                              {res.name}
                            </strong>
                            {res.estimated_eta_minutes && (
                              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#15803d', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                <Clock size={11} />
                                {res.estimated_eta_minutes}m ETA
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Type: {res.resource_type.replace('_', ' ')} • Capacity: {res.capacity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why / Scoring Rationale */}
                  {rec.priority_rationale && rec.priority_rationale.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                        Why (Decision Rationale):
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {rec.priority_rationale.map((line, idx) => (
                          <li key={idx} style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ color: '#0284c7' }}>•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Controls for Human Verification */}
                  {isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Edit3 size={12} />}
                        onClick={() => setActiveModal({ type: 'edit', rec })}
                      >
                        Edit Notes
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircle size={12} />}
                        onClick={() => setActiveModal({ type: 'reject', rec })}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        icon={<ShieldCheck size={12} />}
                        onClick={() => setActiveModal({ type: 'approve', rec })}
                      >
                        Verify Action
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                      <span>
                        Status: <strong style={{ color: '#0f172a' }}>{isApproved ? 'Approved by Responder' : 'Rejected by Responder'}</strong>
                        {rec.verified_by && ` (${rec.verified_by})`}
                      </span>
                      <button
                        onClick={() => setActiveModal({ type: isApproved ? 'edit' : 'approve', rec })}
                        style={{ background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
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
      </Card>

      {/* Verification Modal */}
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
