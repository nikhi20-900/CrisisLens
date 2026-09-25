import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel';
import { NeedsPanel } from '@/components/incidents/NeedsPanel';
import { PriorityDisplay } from '@/components/incidents/PriorityDisplay';
import { ContradictionAlert } from '@/components/incidents/ContradictionAlert';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { EvidencePanel } from '@/components/evidence/EvidencePanel';
import { WhatChangedBanner } from '@/components/timeline/WhatChangedBanner';
import { SituationTimeline } from '@/components/timeline/SituationTimeline';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { AddReportModal } from '@/components/ingestion/AddReportModal';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { CommandCenterPage } from '@/pages/CommandCenter/CommandCenterPage';
import {
  demoIncidents,
  demoSnapshots,
  demoEvidenceList,
  demoRecommendation,
} from '@/features/demo/demoData';

describe('CrisisLens Command Center Components', () => {
  it('renders IncidentCard with ID, severity, affected people and priority', () => {
    const onSelect = vi.fn();
    render(
      <IncidentCard
        incident={demoIncidents[0]}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('INC-001')).toBeInTheDocument();
    expect(screen.getAllByText(/critical/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 affected/i)).toBeInTheDocument();

    // Clicking card triggers selection
    fireEvent.click(screen.getByText('INC-001'));
    expect(onSelect).toHaveBeenCalledWith('INC-001');
  });

  it('renders IncidentDetailPanel with correct metrics and location', () => {
    render(<IncidentDetailPanel incident={demoIncidents[0]} />);

    expect(screen.getByText('Flash Flood & Bridge Inundation — Sector 4')).toBeInTheDocument();
    expect(screen.getAllByText(/flood/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 in danger/i)).toBeInTheDocument();
    expect(screen.getByText(/Central Market Bridge, Sector 4/i)).toBeInTheDocument();
  });

  it('renders EvidenceCard with raw citizen text and observations', () => {
    const evidence = demoEvidenceList[0].evidence!;
    render(<EvidenceCard evidence={evidence} similarityScore={0.95} />);

    expect(screen.getByText(/#{1}EV-001/i)).toBeInTheDocument();
    expect(screen.getByText(/Central Market Bridge/i)).toBeInTheDocument();
    expect(screen.getByText(/Incident match:/i)).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders WhatChangedBanner with snapshot delta summary', () => {
    const snapshot = demoSnapshots[1]; // 10:08 people trapped
    render(<WhatChangedBanner snapshot={snapshot} previousSeverity="medium" />);

    expect(screen.getByText(/WHAT CHANGED\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SNAP-002/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/stranded inside bakery/i).length).toBeGreaterThan(0);
  });

  it('renders SituationTimeline with chronological stepper items', () => {
    render(<SituationTimeline snapshots={demoSnapshots} />);

    expect(screen.getByText(/Incident Evolution Timeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SNAP-001/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SNAP-002/i).length).toBeGreaterThan(0);
  });

  it('renders NeedsPanel with unmet operational needs', () => {
    render(<NeedsPanel needs={demoIncidents[0].current_needs} />);

    expect(screen.getByText(/Operational Needs/i)).toBeInTheDocument();
    expect(screen.getByText('rescue')).toBeInTheDocument();
    expect(screen.getByText('medical')).toBeInTheDocument();
  });

  it('renders PriorityDisplay with score and explainable rationale', () => {
    render(
      <PriorityDisplay
        score={88.5}
        level="critical"
        reasons={demoRecommendation.priority_rationale}
      />
    );

    expect(screen.getByText('88.5')).toBeInTheDocument();
    expect(screen.getAllByText(/critical/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 civilians directly trapped/i)).toBeInTheDocument();
  });

  it('renders RecommendationPanel and handles Verify and Reject modal actions', async () => {
    const onVerify = vi.fn().mockResolvedValue(undefined);
    const onReject = vi.fn().mockResolvedValue(undefined);
    const onEdit = vi.fn().mockResolvedValue(undefined);

    render(
      <RecommendationPanel
        recommendations={[demoRecommendation]}
        onVerify={onVerify}
        onReject={onReject}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText(/RECOMMENDED ACTION PLAN #ACT-001/i)).toBeInTheDocument();
    expect(screen.getByText(/PENDING VERIFICATION/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Water Rescue Boat Unit Alpha/i).length).toBeGreaterThan(0);

    // Click "Verify Action" button opens modal
    const verifyBtn = screen.getByText('Verify Action');
    fireEvent.click(verifyBtn);

    expect(screen.getByText('Verify & Approve Recommendation')).toBeInTheDocument();

    // Confirm verification inside modal
    const confirmBtn = screen.getByRole('button', { name: /Verify Recommendation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith('ACT-001', '');
    });
    await waitFor(() => {
      expect(screen.queryByText('Verify & Approve Recommendation')).not.toBeInTheDocument();
    });
  });

  it('renders EmptyState and ErrorAlert correctly', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Backend connection timeout" onRetry={onRetry} />);

    expect(screen.getByText('Backend connection timeout')).toBeInTheDocument();
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();

    render(<EmptyState message="No active incidents reported" />);
    expect(screen.getByText('No active incidents reported')).toBeInTheDocument();
  });

  it('renders EvidencePanel with fragmented sources breakdown and triggers onAddEvidence', () => {
    const onAddEvidence = vi.fn();
    render(
      <EvidencePanel
        evidenceList={demoEvidenceList.map((l) => l.evidence!).filter(Boolean)}
        evidenceLinks={demoEvidenceList}
        onAddEvidence={onAddEvidence}
      />
    );

    expect(screen.getAllByText(/SOURCES/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Photo/i).length).toBeGreaterThan(0);

    const addBtn = screen.getByRole('button', { name: /\+ ADD EVIDENCE/i });
    fireEvent.click(addBtn);
    expect(onAddEvidence).toHaveBeenCalled();
  });

  it('renders IncidentDetailPanel with + ADD EVIDENCE button and triggers handler', () => {
    const onAddEvidence = vi.fn();
    render(
      <IncidentDetailPanel
        incident={demoIncidents[0]}
        onAddEvidence={onAddEvidence}
      />
    );

    const addBtn = screen.getByRole('button', { name: /\+ ADD EVIDENCE/i });
    fireEvent.click(addBtn);
    expect(onAddEvidence).toHaveBeenCalledWith('INC-001');
  });

  it('renders ContradictionAlert with calm review evidence action', () => {
    const onReview = vi.fn();
    render(
      <ContradictionAlert
        contradictions={[
          {
            contradiction_id: 'C-01',
            field_name: 'access_status',
            claim_a: { statement: 'One report says the road is accessible.' },
            claim_b: { statement: 'A later video indicates vehicles cannot pass.' },
            requires_human_resolution: true,
            resolved: false,
          },
        ]}
        onReviewEvidence={onReview}
      />
    );

    expect(screen.getByText('CONFLICTING REPORTS')).toBeInTheDocument();
    expect(screen.getByText(/road is accessible/i)).toBeInTheDocument();
    expect(screen.getByText(/vehicles cannot pass/i)).toBeInTheDocument();

    const reviewBtn = screen.getByRole('button', { name: /\[ REVIEW EVIDENCE \]/i });
    fireEvent.click(reviewBtn);
    expect(onReview).toHaveBeenCalled();
  });

  it('renders AddReportModal, handles preset and confirms addition to incident', async () => {
    const onClose = vi.fn();
    const onSubmitted = vi.fn();

    render(
      <AddReportModal
        isOpen={true}
        onClose={onClose}
        preselectedIncidentId="INC-001"
        prefillLocation="Bridge Road, Sector 4"
        onReportSubmitted={onSubmitted}
      />
    );

    expect(screen.getByText('Add Disaster Information')).toBeInTheDocument();
    expect(screen.getByText('Targeting INC-001')).toBeInTheDocument();

    // Click demo preset
    const presetBtn = screen.getByText(/Trapped Residents/i);
    fireEvent.click(presetBtn);

    // Click "Analyze Evidence"
    const analyzeBtn = screen.getByRole('button', { name: /Analyze Evidence/i });
    fireEvent.click(analyzeBtn);

    // Wait for analysis to progress to matched state
    await waitFor(
      () => {
        expect(screen.getByText(/Evidence Analyzed & Incident Matched/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    expect(screen.getByText(/Related Incident Found/i)).toBeInTheDocument();
    expect(screen.getAllByText(/INC-001/i).length).toBeGreaterThan(0);

    // Confirm addition to incident
    const addConfirmBtn = screen.getByRole('button', { name: /Add to Incident/i });
    fireEvent.click(addConfirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Evidence Added to/i)).toBeInTheDocument();
    });

    const viewIncidentBtn = screen.getByRole('button', { name: /View Updated Incident/i });
    fireEvent.click(viewIncidentBtn);

    expect(onSubmitted).toHaveBeenCalled();
  });

  it('renders CommandCenterPage with top bar, operational summary, and full 1-to-8 operational information hierarchy', async () => {
    render(<CommandCenterPage />);

    // Top Bar items
    expect(screen.getByText('CRISISLENS')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('INCIDENTS')).toBeInTheDocument();
    expect(screen.getAllByText('MAP').length).toBeGreaterThan(0);
    expect(screen.getByText(/\+ ADD REPORT/i)).toBeInTheDocument();

    // Section 2: "Needs Attention" Operational Summary
    expect(screen.getByText(/INCIDENT NEEDS ATTENTION|INCIDENTS NEED ATTENTION/i)).toBeInTheDocument();

    // Wait for incident selection and 1-to-8 Hierarchy check
    await waitFor(() => {
      expect(screen.getByText('NOW')).toBeInTheDocument();
    });

    // 1. INCIDENT & 2. NOW
    expect(screen.getByText('NOW')).toBeInTheDocument();

    // 3. WHAT CHANGED
    expect(screen.getByText('WHAT CHANGED?')).toBeInTheDocument();

    // 4. EVIDENCE
    expect(screen.getByText('EVIDENCE')).toBeInTheDocument();

    // 5. CURRENT NEEDS
    expect(screen.getByText('CURRENT NEEDS')).toBeInTheDocument();

    // 6. PRIORITY
    expect(screen.getByText('PRIORITY')).toBeInTheDocument();

    // 7. RECOMMENDED RESPONSE
    expect(screen.getByText('RECOMMENDED RESPONSE')).toBeInTheDocument();
  });

  it('correctly renders latest priority 88.5 and CRITICAL level, preventing stale 52.0 values', () => {
    render(
      <PriorityDisplay
        score={88.5}
        level="critical"
        reasons={demoRecommendation.priority_rationale}
      />
    );

    expect(screen.getByText('88.5')).toBeInTheDocument();
    expect(screen.queryByText('52.0')).not.toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.queryByText('medium')).not.toBeInTheDocument();
  });

  it('renders PriorityDisplay using structured PriorityResult contract when available', () => {
    const priorityResult = {
      score: 88.5,
      priority_level: 'critical' as const,
      reasons: [
        '5 civilians directly trapped with water surrounding ground structure',
        'Road access completely BLOCKED',
        'Critical medical emergency reported: 68-year-old acute cardiac and asthma distress',
      ],
      confidence: 0.96,
      situation_trend: 'escalating',
      configuration_version: '1.0',
    };

    render(<PriorityDisplay priorityResult={priorityResult} />);

    expect(screen.getByText('88.5')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText(/68-year-old acute cardiac and asthma distress/i)).toBeInTheDocument();
  });

  it('renders Current Needs with RESCUE (critical), MEDICAL (critical), and WATER (medium)', () => {
    render(<NeedsPanel needs={demoIncidents[0].current_needs} />);

    expect(screen.getByText('rescue')).toBeInTheDocument();
    expect(screen.getByText('medical')).toBeInTheDocument();
    expect(screen.getByText('water')).toBeInTheDocument();

    const criticalBadges = screen.getAllByText('Critical');
    expect(criticalBadges.length).toBeGreaterThanOrEqual(2); // Rescue and Medical are Critical
  });

  it('ensures recommendation language uses "Recommend deploying" and never claims dispatch before verification', () => {
    render(
      <RecommendationPanel
        recommendations={[demoRecommendation]}
        onVerify={vi.fn()}
        onReject={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Verify status is PENDING VERIFICATION
    expect(screen.getByText('PENDING VERIFICATION')).toBeInTheDocument();

    // Verify rationale does NOT claim "Dispatched"
    expect(screen.queryByText(/Dispatched Water Rescue Boat/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Recommend deploying Water Rescue Boat Unit Alpha/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Recommend deploying Rapid Medical Emergency Unit 03/i)).toBeInTheDocument();

    // Verify resource details from data
    expect(screen.getAllByText(/Water Rescue Boat Unit Alpha/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/capacity: 6/i)).toBeInTheDocument();
    expect(screen.getByText(/ETA: 12 min/i)).toBeInTheDocument();

    expect(screen.getAllByText(/Rapid Medical Emergency Unit 03/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/capacity: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/ETA: 8 min/i)).toBeInTheDocument();
  });

  it('renders verified recommendation state without falsely claiming dispatch', () => {
    const verifiedRec = {
      ...demoRecommendation,
      verification_status: 'approved' as const,
      verified_by: 'COMMANDER-01',
    };

    render(
      <RecommendationPanel
        recommendations={[verifiedRec]}
        onVerify={vi.fn()}
        onReject={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('RECOMMENDATION VERIFIED')).toBeInTheDocument();
    expect(screen.getByText(/Recommendation verified by human responder \(COMMANDER-01\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rescue team dispatched/i)).not.toBeInTheDocument();
  });

  it('keeps secondary incident INC-002 isolated with its own priority and needs, not leaking INC-001 reasons', () => {
    const inc2 = demoIncidents[1];
    expect(inc2.incident_id).toBe('INC-002');
    expect(inc2.priority_score).toBe(52.0);
    expect(inc2.priority_level).toBe('medium');

    render(
      <PriorityDisplay
        score={inc2.priority_score}
        level={inc2.priority_level}
        reasons={inc2.snapshots?.[0]?.delta_summary || []}
      />
    );

    expect(screen.getByText('52.0')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText(/Initial overflow detected at West Industrial canal gate/i)).toBeInTheDocument();
    expect(screen.queryByText(/Severity escalated to CRITICAL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dynamic priority recalculated to 88.5/i)).not.toBeInTheDocument();
  });
});
