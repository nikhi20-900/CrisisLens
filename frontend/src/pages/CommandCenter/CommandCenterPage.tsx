import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, Evidence, IncidentSnapshot, ActionPlan, NeedType } from '@/types/domain';
import { api } from '@/services/api';
import {
  DEMO_INCIDENTS,
  DEMO_TIMELINE_SNAPSHOTS,
  DEMO_EVIDENCE,
  DEMO_RECOMMENDATIONS,
} from '@/features/demo/demoData';
import { Header } from '@/components/dashboard/Header';
import { IncidentList, IncidentDetailPanel, NeedsPanel, PriorityDisplay } from '@/components/incidents';
import { EvidencePanel } from '@/components/evidence';
import { WhatChangedBanner, SituationTimeline } from '@/components/timeline';
import { RecommendationPanel } from '@/components/recommendations';
import { IncidentMap } from '@/components/map';

export const CommandCenterPage: React.FC = () => {
  // Source State: Live API vs Demo Simulation
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [autoSync] = useState<boolean>(true);

  // Demo simulation step (1 to 6)
  const [simulationStep, setSimulationStep] = useState<number>(4); // start at step 4 (Medical emergency) for rich initial view

  // Main Domain State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [timeline, setTimeline] = useState<IncidentSnapshot[]>([]);
  const [recommendations, setRecommendations] = useState<ActionPlan[]>([]);

  // Individual Panel Loading & Error States (Fails independently)
  const [incidentsLoading, setIncidentsLoading] = useState<boolean>(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [evidenceLoading, setEvidenceLoading] = useState<boolean>(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute simulated state when in Demo Mode
  const getSimulatedState = useCallback((step: number) => {
    const visibleSnapshots = DEMO_TIMELINE_SNAPSHOTS.slice(0, step);
    const latestSnapshot = visibleSnapshots[visibleSnapshots.length - 1];

    // Build evolving simulated incident based on current snapshot
    const simulatedIncident: Incident = {
      ...DEMO_INCIDENTS[0],
      severity: latestSnapshot.severity,
      priority_level: latestSnapshot.severity,
      priority_score: latestSnapshot.priority_score,
      people_affected: latestSnapshot.people_affected,
      access_status: latestSnapshot.access_status,
      current_needs: latestSnapshot.active_needs.map((needType: NeedType, idx: number) => ({
        need_id: `SIM-NEED-${idx + 1}`,
        type: needType,
        urgency: latestSnapshot.severity === 'critical' ? 'critical' : 'high',
        confidence: 0.94,
        status: 'unmet' as const,
        identified_at: latestSnapshot.timestamp,
      })),
      snapshots: visibleSnapshots,
      updated_at: latestSnapshot.timestamp,
    };

    const simulatedIncidents: Incident[] = [
      simulatedIncident,
      DEMO_INCIDENTS[1], // secondary background incident
    ];

    // Filter evidence based on timestamps
    const maxTime = new Date(latestSnapshot.timestamp).getTime();
    const visibleEvidence = DEMO_EVIDENCE.filter(
      (e: Evidence) => new Date(e.raw_report?.timestamp || e.extracted_at).getTime() <= maxTime
    );

    return {
      incidents: simulatedIncidents,
      selectedIncident: simulatedIncident,
      snapshots: visibleSnapshots,
      evidence: visibleEvidence,
      recommendations: DEMO_RECOMMENDATIONS,
    };
  }, []);

  // Fetch list of incidents
  const fetchIncidents = useCallback(async () => {
    if (isDemoMode) {
      const state = getSimulatedState(simulationStep);
      setIncidents(state.incidents);
      if (!selectedIncidentId && state.incidents.length > 0) {
        setSelectedIncidentId(state.incidents[0].incident_id);
      }
      setIncidentsLoading(false);
      return;
    }

    try {
      setIncidentsError(null);
      const data = await api.getIncidents();
      if (!isMountedRef.current) return;

      setIncidents(data);
      setIsLiveApi(true);

      if (!selectedIncidentId && data.length > 0) {
        setSelectedIncidentId(data[0].incident_id);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.warn('Backend unavailable, engaging offline demo simulation mode', err);
      setIsDemoMode(true);
      setIsLiveApi(false);
      const state = getSimulatedState(simulationStep);
      setIncidents(state.incidents);
      if (!selectedIncidentId && state.incidents.length > 0) {
        setSelectedIncidentId(state.incidents[0].incident_id);
      }
    } finally {
      if (isMountedRef.current) {
        setIncidentsLoading(false);
      }
    }
  }, [isDemoMode, simulationStep, selectedIncidentId, getSimulatedState]);

  // Load details for selected incident
  const loadIncidentData = useCallback(async (id: string) => {
    if (isDemoMode) {
      const state = getSimulatedState(simulationStep);
      const inc = state.incidents.find((i: Incident) => i.incident_id === id) || state.incidents[0];
      setSelectedIncident(inc);
      setEvidence(state.evidence);
      setTimeline(state.snapshots);
      setRecommendations(state.recommendations);
      setDetailLoading(false);
      setEvidenceLoading(false);
      setTimelineLoading(false);
      setRecommendationsLoading(false);
      return;
    }

    setDetailLoading(true);
    setEvidenceLoading(true);
    setTimelineLoading(true);
    setRecommendationsLoading(true);

    setDetailError(null);
    setEvidenceError(null);
    setTimelineError(null);
    setRecommendationsError(null);

    // 1. Fetch Incident Detail
    api.getIncident(id)
      .then((inc: Incident) => isMountedRef.current && setSelectedIncident(inc))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load incident detail';
        if (isMountedRef.current) setDetailError(msg);
      })
      .finally(() => isMountedRef.current && setDetailLoading(false));

    // 2. Fetch Evidence
    api.getIncidentEvidence(id)
      .then((evLinks) => {
        if (!isMountedRef.current) return;
        const evList = evLinks.map((l) => l.evidence).filter((e): e is Evidence => Boolean(e));
        setEvidence(evList.length > 0 ? evList : DEMO_EVIDENCE);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load evidence';
        if (isMountedRef.current) setEvidenceError(msg);
      })
      .finally(() => isMountedRef.current && setEvidenceLoading(false));

    // 3. Fetch Timeline Snapshots
    api.getIncidentTimeline(id)
      .then((snaps: IncidentSnapshot[]) => isMountedRef.current && setTimeline(snaps))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load timeline';
        if (isMountedRef.current) setTimelineError(msg);
      })
      .finally(() => isMountedRef.current && setTimelineLoading(false));

    // 4. Fetch AI Recommendations
    api.getIncidentRecommendations(id)
      .then((recOrList: ActionPlan | ActionPlan[] | null) => {
        if (!isMountedRef.current) return;
        if (Array.isArray(recOrList)) {
          setRecommendations(recOrList);
        } else if (recOrList) {
          setRecommendations([recOrList]);
        } else {
          setRecommendations([]);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load recommendations';
        if (isMountedRef.current) setRecommendationsError(msg);
      })
      .finally(() => isMountedRef.current && setRecommendationsLoading(false));
  }, [isDemoMode, simulationStep, getSimulatedState]);

  // Initial load
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Trigger data load when selected incident changes
  useEffect(() => {
    if (selectedIncidentId) {
      loadIncidentData(selectedIncidentId);
    }
  }, [selectedIncidentId, loadIncidentData]);

  // Auto-sync polling every 3 seconds
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchIncidents();
      if (selectedIncidentId && !isDemoMode) {
        api.getIncidentRecommendations(selectedIncidentId)
          .then((recOrList) => {
            if (!isMountedRef.current) return;
            if (Array.isArray(recOrList)) setRecommendations(recOrList);
            else if (recOrList) setRecommendations([recOrList]);
          })
          .catch(() => {});
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoSync, fetchIncidents, selectedIncidentId, isDemoMode]);

  // Verification actions
  const handleVerify = async (actionId: string, notes?: string) => {
    if (isDemoMode) {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.action_id === actionId
            ? { ...r, verification_status: 'approved' as const, verified_by: 'COMMANDER-01', responder_notes: notes }
            : r
        )
      );
      return;
    }

    await api.verifyRecommendation(actionId, 'approved', 'COMMANDER-01', notes);
    if (selectedIncidentId) {
      const rec = await api.getIncidentRecommendations(selectedIncidentId);
      if (rec) setRecommendations(Array.isArray(rec) ? rec : [rec]);
    }
  };

  const handleReject = async (actionId: string, reason?: string) => {
    if (isDemoMode) {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.action_id === actionId
            ? { ...r, verification_status: 'rejected' as const, verified_by: 'COMMANDER-01', responder_notes: reason }
            : r
        )
      );
      return;
    }

    await api.rejectRecommendation(actionId, 'COMMANDER-01', reason);
    if (selectedIncidentId) {
      const rec = await api.getIncidentRecommendations(selectedIncidentId);
      if (rec) setRecommendations(Array.isArray(rec) ? rec : [rec]);
    }
  };

  const handleEdit = async (actionId: string, notes: string) => {
    if (isDemoMode) {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.action_id === actionId
            ? { ...r, verification_status: 'edited' as const, verified_by: 'COMMANDER-01', responder_notes: notes }
            : r
        )
      );
      return;
    }

    await api.verifyRecommendation(actionId, 'edited', 'COMMANDER-01', notes);
    if (selectedIncidentId) {
      const rec = await api.getIncidentRecommendations(selectedIncidentId);
      if (rec) setRecommendations(Array.isArray(rec) ? rec : [rec]);
    }
  };

  // Demo step advance
  const handleAdvanceSimulation = () => {
    if (simulationStep < DEMO_TIMELINE_SNAPSHOTS.length) {
      const nextStep = simulationStep + 1;
      setSimulationStep(nextStep);
      const state = getSimulatedState(nextStep);
      setIncidents(state.incidents);
      setSelectedIncident(state.selectedIncident);
      setEvidence(state.evidence);
      setTimeline(state.snapshots);
      setRecommendations(state.recommendations);
    }
  };

  const handleResetSimulation = () => {
    setSimulationStep(1);
    const state = getSimulatedState(1);
    setIncidents(state.incidents);
    setSelectedIncident(state.selectedIncident);
    setEvidence(state.evidence);
    setTimeline(state.snapshots);
    setRecommendations(state.recommendations);
  };

  const toggleSource = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setIncidentsLoading(true);
      fetchIncidents();
    } else {
      setIsDemoMode(true);
      setIsLiveApi(false);
      handleResetSimulation();
    }
  };

  // Find latest snapshot for "What Changed?"
  const latestSnapshot = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Top Operations Header */}
      <Header
        isLiveApi={isLiveApi}
        onToggleSource={toggleSource}
        attentionCount={incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length || 1}
        isDemoMode={isDemoMode}
        simulationStep={simulationStep}
        totalSteps={DEMO_TIMELINE_SNAPSHOTS.length}
        onAdvanceSimulation={handleAdvanceSimulation}
        onResetSimulation={handleResetSimulation}
        nextStepLabel={
          simulationStep < DEMO_TIMELINE_SNAPSHOTS.length
            ? `Next: ${DEMO_TIMELINE_SNAPSHOTS[simulationStep].timestamp.slice(11, 16)}`
            : undefined
        }
      />

      {/* Main Command Center Workspace */}
      <main
        style={{
          flex: 1,
          padding: '16px 20px',
          maxWidth: '1720px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ROW 1: Active Incidents Queue (Left) + Spatial Map (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '16px', minHeight: '340px' }}>
          <div>
            <IncidentList
              incidents={incidents}
              selectedIncidentId={selectedIncidentId || undefined}
              onSelectIncident={(id: string) => setSelectedIncidentId(id)}
              loading={incidentsLoading}
              error={incidentsError}
              onRetry={fetchIncidents}
            />
          </div>

          <div>
            <IncidentMap
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(id: string) => setSelectedIncidentId(id)}
            />
          </div>
        </div>

        {/* Selected Incident Situation Area */}
        {selectedIncident && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ROW 2: Selected Incident Header & NOW Briefing */}
            <IncidentDetailPanel
              incident={selectedIncident}
              loading={detailLoading}
              error={detailError}
              onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
            />

            {/* ROW 3: What Changed? */}
            <WhatChangedBanner
              snapshot={latestSnapshot}
              previousSeverity={timeline.length > 1 ? timeline[timeline.length - 2].severity : undefined}
            />

            {/* ROW 4: Evidence & Timeline (Left) + Needs, Priority & Recommendations (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
              {/* Column 1: Evidence & Evolution Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SituationTimeline
                  snapshots={timeline}
                  loading={timelineLoading}
                  error={timelineError}
                  onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                />

                <EvidencePanel
                  evidenceList={evidence}
                  evidenceLinks={selectedIncident.evidence_links}
                  loading={evidenceLoading}
                  error={evidenceError}
                  onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                />
              </div>

              {/* Column 2: Current Needs, Priority Assessment & Action Recommendations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <NeedsPanel needs={selectedIncident.current_needs} />

                <PriorityDisplay
                  priorityScore={selectedIncident.priority_score}
                  priorityLevel={selectedIncident.priority_level}
                  reasons={selectedIncident.active_recommendation?.priority_rationale || latestSnapshot?.delta_summary || []}
                />

                <RecommendationPanel
                  recommendations={recommendations}
                  loading={recommendationsLoading}
                  error={recommendationsError}
                  onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedIncident && !incidentsLoading && (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            Select an active incident from the queue above to inspect the situation.
          </div>
        )}
      </main>
    </div>
  );
};
