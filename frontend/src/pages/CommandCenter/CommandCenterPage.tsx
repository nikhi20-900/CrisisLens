import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, Evidence, IncidentSnapshot, ActionPlan, NeedType, ReportSubmissionResponse } from '@/types/domain';
import { api } from '@/services/api';
import {
  DEMO_INCIDENTS,
  DEMO_TIMELINE_SNAPSHOTS,
  DEMO_EVIDENCE,
  DEMO_RECOMMENDATIONS,
} from '@/features/demo/demoData';
import { Header } from '@/components/dashboard/Header';
import {
  IncidentList,
  IncidentDetailPanel,
  NeedsPanel,
  PriorityDisplay,
  ContradictionAlert,
} from '@/components/incidents';
import { EvidencePanel } from '@/components/evidence';
import { WhatChangedBanner } from '@/components/timeline';
import { RecommendationPanel } from '@/components/recommendations';
import { IncidentMap } from '@/components/map';
import { AddReportModal } from '@/components/ingestion';

export const CommandCenterPage: React.FC = () => {
  // Source State: Live API vs Demo Simulation
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [autoSync] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'live' | 'incidents' | 'map'>('live');

  // Demo simulation step (1 to 6)
  const [simulationStep, setSimulationStep] = useState<number>(4);

  // Main Domain State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [timeline, setTimeline] = useState<IncidentSnapshot[]>([]);
  const [recommendations, setRecommendations] = useState<ActionPlan[]>([]);

  // Panel Loading & Error States
  const [incidentsLoading, setIncidentsLoading] = useState<boolean>(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [evidenceLoading, setEvidenceLoading] = useState<boolean>(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Fragmented Information Ingestion State
  const [isAddReportOpen, setIsAddReportOpen] = useState<boolean>(false);
  const [targetIncidentId, setTargetIncidentId] = useState<string | null>(null);
  const [newReportHighlight, setNewReportHighlight] = useState<boolean>(false);

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
      DEMO_INCIDENTS[1],
    ];

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
      setRecommendationsLoading(false);
      return;
    }

    setDetailLoading(true);
    setEvidenceLoading(true);
    setRecommendationsLoading(true);

    setDetailError(null);
    setEvidenceError(null);
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
      .catch(() => {});

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
  const attentionCount = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length || 1;

  const handleOpenAddReport = (incidentId?: string) => {
    setTargetIncidentId(incidentId || null);
    setIsAddReportOpen(true);
  };

  const handleReportSubmitted = async (response: ReportSubmissionResponse) => {
    setIsAddReportOpen(false);

    const targetId = response.incident_id || selectedIncidentId || 'INC-001';
    setSelectedIncidentId(targetId);

    if (isDemoMode) {
      if (simulationStep < DEMO_TIMELINE_SNAPSHOTS.length) {
        handleAdvanceSimulation();
      } else {
        const state = getSimulatedState(simulationStep);
        setIncidents(state.incidents);
        setSelectedIncident(state.selectedIncident);
        setEvidence([response.evidence, ...state.evidence]);
      }
    } else {
      await fetchIncidents();
      await loadIncidentData(targetId);
    }

    setNewReportHighlight(true);
    setTimeout(() => setNewReportHighlight(false), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar: CRISISLENS, LIVE, INCIDENTS, MAP, + ADD REPORT */}
      <Header
        isLiveApi={isLiveApi}
        onToggleSource={toggleSource}
        onAddReport={() => handleOpenAddReport()}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        attentionCount={attentionCount}
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

      {/* Section 2: "Needs Attention" Operational Summary at Top */}
      <div
        style={{
          maxWidth: '1800px',
          width: '100%',
          margin: '12px auto 0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: attentionCount > 0 ? '#dc2626' : '#16a34a',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#0f172a',
            }}
          >
            {attentionCount} {attentionCount === 1 ? 'INCIDENT NEEDS ATTENTION' : 'INCIDENTS NEED ATTENTION'}
          </span>
        </div>
      </div>

      {/* Notification banner on new evidence ingestion */}
      {newReportHighlight && (
        <div
          style={{
            maxWidth: '1800px',
            width: '100%',
            margin: '8px auto 0 auto',
            padding: '8px 20px',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#166534',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ✓ New fragmented evidence analyzed & matched. Incident updated.
          </div>
        </div>
      )}

      {/* Main Command Center Area:
          LEFT: Active incident list
          CENTER: Map
          RIGHT / LOWER: Selected incident information
      */}
      <main
        className="command-center-layout"
        style={{
          flex: 1,
          padding: '12px 20px 20px 20px',
          maxWidth: '1800px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '290px minmax(360px, 1fr) minmax(460px, 1.3fr)',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Active Incident List (Primary Navigation) */}
        <div style={{ position: 'sticky', top: '68px', maxHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column' }}>
          <IncidentList
            incidents={incidents}
            selectedIncidentId={selectedIncidentId || undefined}
            onSelectIncident={(id: string) => setSelectedIncidentId(id)}
            loading={incidentsLoading}
            error={incidentsError}
            onRetry={fetchIncidents}
          />
        </div>

        {/* CENTER: Map (Spatial Context: Where is this happening?) */}
        <div style={{ position: 'sticky', top: '68px', height: 'calc(100vh - 84px)' }}>
          <IncidentMap
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={(id: string) => setSelectedIncidentId(id)}
          />
        </div>

        {/* RIGHT / LOWER: Selected Incident Information (Ordered Hierarchy 1 to 8) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {selectedIncident ? (
            <>
              {/* 1. INCIDENT & 2. NOW */}
              <IncidentDetailPanel
                incident={selectedIncident}
                loading={detailLoading}
                error={detailError}
                onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                onAddEvidence={(id) => handleOpenAddReport(id)}
              />

              {/* Contradictions Flag (Calmly displayed if conflicting reports exist) */}
              {selectedIncident.contradictions && selectedIncident.contradictions.length > 0 && (
                <ContradictionAlert
                  contradictions={selectedIncident.contradictions}
                  onReviewEvidence={() => {
                    const el = document.getElementById('evidence-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}

              {/* 3. WHAT CHANGED (Chronological situation changes) */}
              <WhatChangedBanner
                snapshot={latestSnapshot}
                snapshots={timeline.length > 0 ? timeline : (selectedIncident.snapshots || [])}
                previousSeverity={timeline.length > 1 ? timeline[timeline.length - 2].severity : undefined}
              />

              {/* 4. EVIDENCE (Progressive disclosure, sources breakdown & media) */}
              <div id="evidence-section">
                <EvidencePanel
                  evidenceList={evidence}
                  evidenceLinks={selectedIncident.evidence_links}
                  loading={evidenceLoading}
                  error={evidenceError}
                  onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                  onAddEvidence={() => handleOpenAddReport(selectedIncident.incident_id)}
                />
              </div>

              {/* 5. CURRENT NEEDS (Compact table) */}
              <NeedsPanel needs={selectedIncident.current_needs} />

              {/* 6. PRIORITY (Level & why) */}
              <PriorityDisplay
                priorityScore={selectedIncident.priority_score}
                priorityLevel={selectedIncident.priority_level}
                reasons={selectedIncident.active_recommendation?.priority_rationale || latestSnapshot?.delta_summary || []}
              />

              {/* 7. RECOMMENDED RESPONSE & 8. HUMAN VERIFICATION */}
              <RecommendationPanel
                recommendations={recommendations}
                loading={recommendationsLoading}
                error={recommendationsError}
                onRetry={() => selectedIncidentId && loadIncidentData(selectedIncidentId)}
                onVerify={handleVerify}
                onReject={handleReject}
                onEdit={handleEdit}
              />
            </>
          ) : !incidentsLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              Select an active incident from the list to view situation details.
            </div>
          ) : null}
        </div>
      </main>

      {/* Ingestion Modal: Fragmented Information -> Evidence Analysis -> Incident Match */}
      <AddReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        preselectedIncidentId={targetIncidentId}
        prefillLocation={selectedIncident?.location.address}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
};
