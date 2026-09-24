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
        return <ShieldCheck size={18} color="#15803d" />;
      case 'reject':
        return <XCircle size={18} color="#b91c1c" />;
      case 'edit':
        return <Edit3 size={18} color="#b45309" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ marginTop: '2px' }}>{getIcon()}</div>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              Action Plan #{recommendation.action_id}
            </span>
            <span style={{ color: '#475569' }}>
              Allocated: {recommendation.recommended_resources.map((r) => r.name).join(', ')}
            </span>
          </div>
        </div>

        {actionType === 'approve' && (
          <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
            Confirming will mark this AI recommendation as human-verified. You may optionally attach operational verification notes below.
          </p>
        )}

        {actionType === 'reject' && (
          <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0, fontWeight: 500 }}>
            Please record why this recommendation is being rejected (e.g. invalid location, road obstructed, team already assigned).
          </p>
        )}

        {actionType === 'edit' && (
          <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
            Specify modifications or specific operational orders before marking as verified.
          </p>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Responder Notes / Verification Rationale
            {actionType === 'reject' && <span style={{ color: '#b91c1c', marginLeft: '4px' }}>*</span>}
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
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '8px 10px',
              color: '#0f172a',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Audit Record Disclaimer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            fontSize: '11px',
            color: '#0369a1',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Audit Record Notice:</strong> This action records your verification decision in CrisisLens audit logs. It does not trigger real-world emergency dispatch.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
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
