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
  Sparkles,
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
        title="AI Response Recommendations"
        icon={<Sparkles size={16} color="#eab308" />}
        headerExtra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>Human Verification Required</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated, #1e293b)', color: '#eab308' }}>
              {recommendations.length} Action Plans
            </span>
          </div>
        }
      >
        {feedback && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: feedback.type === 'success' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
              color: feedback.type === 'success' ? '#22c55e' : '#ef4444',
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
          <Spinner label="Generating AI response recommendations..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={onRetry} />
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} color="var(--text-muted, #64748b)" />}
            title="No Recommendations Generated"
            message="AI response intelligence has not proposed any actions for this incident yet."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recommendations.map((rec) => {
              const isPending = rec.verification_status === 'pending';
              const isApproved = rec.verification_status === 'approved' || rec.verification_status === 'edited';
              const isRejected = rec.verification_status === 'rejected';

              return (
                <div
                  key={rec.action_id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: isPending
                      ? '1px solid rgba(234, 179, 8, 0.4)'
                      : isApproved
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : '1px solid var(--border-subtle, #1e293b)',
                    backgroundColor: isPending ? 'var(--bg-card, #0f172a)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Top Bar: Action Title & Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                          RECOMMENDED ACTION PLAN #{rec.action_id}
                        </span>
                        <Badge variant={rec.priority_level} size="sm">
                          {rec.priority_level.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
                        {rec.resource_rationale}
                      </p>
                    </div>

                    <div>
                      {isPending && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', padding: '4px 10px', borderRadius: '9999px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                          PENDING VERIFICATION
                        </span>
                      )}
                      {isApproved && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', padding: '4px 10px', borderRadius: '9999px' }}>
                          <CheckCircle2 size={12} />
                          VERIFIED
                        </span>
                      )}
                      {isRejected && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '4px 10px', borderRadius: '9999px' }}>
                          <XCircle size={12} />
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allocated Resources */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted, #64748b)' }}>
                      Allocated Resources & ETAs:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {rec.recommended_resources.map((res) => (
                        <div
                          key={res.resource_id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-elevated, #1e293b)',
                            border: '1px solid var(--border-subtle, #334155)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '12px', color: 'var(--color-primary, #38bdf8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={12} />
                              {res.name}
                            </strong>
                            {res.estimated_eta_minutes && (
                              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} />
                                {res.estimated_eta_minutes}m ETA
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                            Type: {res.resource_type} • Capacity: {res.capacity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why / Scoring Rationale */}
                  {rec.priority_rationale && rec.priority_rationale.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted, #64748b)' }}>
                        Why (AI Intelligence Rationale):
                      </span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {rec.priority_rationale.map((line, idx) => (
                          <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ color: '#eab308' }}>•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Controls for Human Verification */}
                  {isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle, #1e293b)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle, #1e293b)', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                      <span>
                        Status: <strong>{isApproved ? 'Approved by Responder' : 'Rejected by Responder'}</strong>
                        {rec.verified_by && ` (${rec.verified_by})`}
                      </span>
                      <button
                        onClick={() => setActiveModal({ type: isApproved ? 'edit' : 'approve', rec })}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #38bdf8)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
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
