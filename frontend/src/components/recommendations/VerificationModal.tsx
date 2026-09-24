import React, { useState } from 'react';
import type { ActionPlan } from '@/types/domain';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ShieldCheck, XCircle, Edit3, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  actionType: 'approve' | 'edit' | 'reject';
  recommendation: ActionPlan | null;
  submitting?: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  recommendation,
  submitting = false,
}) => {
  const [notes, setNotes] = useState('');

  if (!recommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(notes);
    setNotes('');
  };

  const getTitle = () => {
    switch (actionType) {
      case 'approve':
        return 'Verify & Approve Recommendation';
      case 'reject':
        return 'Reject Recommendation';
      case 'edit':
        return 'Modify & Approve Recommendation';
    }
  };

  const getIcon = () => {
    switch (actionType) {
      case 'approve':
        return <ShieldCheck size={20} color="#22c55e" />;
      case 'reject':
        return <XCircle size={20} color="#ef4444" />;
      case 'edit':
        return <Edit3 size={20} color="#eab308" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-elevated, #1e293b)',
            border: '1px solid var(--border-subtle, #334155)',
          }}
        >
          <div style={{ marginTop: '2px' }}>{getIcon()}</div>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
              Action Plan #{recommendation.action_id}
            </div>
            <div style={{ color: 'var(--text-muted, #64748b)' }}>
              Targeting: {recommendation.recommended_resources.map((r) => r.name).join(', ')}
            </div>
          </div>
        </div>

        {actionType === 'approve' && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
            Confirming will mark this AI recommendation as human-verified. You may optionally attach operational verification notes below.
          </p>
        )}

        {actionType === 'reject' && (
          <p style={{ fontSize: '12px', color: 'var(--severity-critical, #ef4444)', margin: 0 }}>
            Please record why this recommendation is being rejected (e.g. invalid location, road obstructed, team already assigned).
          </p>
        )}

        {actionType === 'edit' && (
          <p style={{ fontSize: '12px', color: '#eab308', margin: 0 }}>
            Specify modifications or operational orders before marking as verified.
          </p>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
            Responder Notes / Verification Rationale
            {actionType === 'reject' && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </label>
          <textarea
            required={actionType === 'reject'}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              actionType === 'reject'
                ? 'Enter reason for rejection...'
                : 'Add optional instructions, access route guidance, or priority confirmation...'
            }
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '12px',
              backgroundColor: 'var(--bg-elevated, #1e293b)',
              border: '1px solid var(--border-subtle, #334155)',
              borderRadius: '6px',
              padding: '10px',
              color: 'var(--text-primary, #f8fafc)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Important Disclaimer Required by Core Specification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '11px',
            color: 'var(--color-primary, #38bdf8)',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Audit Record Notice:</strong> This action records your verification decision in CrisisLens. It does not dispatch emergency services.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle, #334155)' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant={actionType === 'reject' ? 'danger' : 'primary'}
            size="sm"
            isLoading={submitting}
          >
            {actionType === 'approve'
              ? 'Verify Recommendation'
              : actionType === 'reject'
              ? 'Reject Recommendation'
              : 'Save Modifications'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
