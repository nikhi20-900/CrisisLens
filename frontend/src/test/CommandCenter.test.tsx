import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel';
import { NeedsPanel } from '@/components/incidents/NeedsPanel';
import { PriorityDisplay } from '@/components/incidents/PriorityDisplay';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { WhatChangedBanner } from '@/components/timeline/WhatChangedBanner';
import { SituationTimeline } from '@/components/timeline/SituationTimeline';
import { RecommendationPanel } from '@/components/recommendations/RecommendationPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorAlert } from '@/components/common/ErrorAlert';
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
    await fireEvent.click(confirmBtn);

    expect(onVerify).toHaveBeenCalledWith('ACT-001', '');
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
});
