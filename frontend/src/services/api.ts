import {
  Incident,
  IncidentSnapshot,
  EvidenceLink,
  ActionPlan,
  VerificationStatus,
  Report,
  ReportSubmissionResponse,
} from '../types';
import {
  demoIncidents,
  demoSnapshots,
  demoEvidenceList,
  demoRecommendation,
} from '../features/demo/demoData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory demo state for interactive mock usage
let localDemoIncidents = [...demoIncidents];
let localDemoRecommendation = { ...demoRecommendation };

export const crisisLensApi = {
  // Mode flag: toggle between live backend API and local mock scenario
  isMockMode: false,

  setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  },

  // Submit raw report
  async submitReport(report: Report): Promise<ReportSubmissionResponse> {
    if (!this.isMockMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/reports/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Live API unavailable for report submission, engaging deterministic offline fallback:', err);
      }
    }

    // Offline / Demo Fallback: Deterministic report processing matching backend rules
    const textLower = report.text.toLowerCase();
    const hasRescue = textLower.includes('trap') || textLower.includes('rescue') || textLower.includes('boat');
    const hasMedical = textLower.includes('medical') || textLower.includes('injur') || textLower.includes('doctor');
    const isBlocked = textLower.includes('block') || textLower.includes('submerged') || textLower.includes('pass');
    const isCritical = hasMedical || textLower.includes('critical') || textLower.includes('emergency');

    const evId = `EV-${report.report_id.replace(/^R-/, '') || Date.now().toString().slice(-4)}`;
    const extractedNeeds: any[] = [];
    if (hasRescue) extractedNeeds.push('rescue');
    if (hasMedical) extractedNeeds.push('medical');
    if (extractedNeeds.length === 0) extractedNeeds.push('rescue', 'water');

    const fallbackEvidence: any = {
      evidence_id: evId,
      report_id: report.report_id,
      disaster_type: 'flood',
      severity: isCritical ? 'critical' : 'high',
      people_affected: textLower.includes('12') ? 12 : (textLower.includes('32') ? 32 : 8),
      needs: extractedNeeds,
      access_status: isBlocked ? 'blocked' : 'partially_blocked',
      location: report.location || { lat: 12.935, lng: 77.624, address: 'Bridge Road' },
      urgency: isCritical ? 'critical' : 'high',
      extracted_entities: {
        text_length: report.text.length,
        has_media: report.media.length > 0,
      },
      confidence: {
        disaster_type: 0.95,
        severity: 0.88,
        people_affected: 0.82,
        needs: 0.90,
        access_status: 0.85,
        location: 0.92,
        urgency: 0.88,
      },
      raw_report: report,
      extracted_at: new Date().toISOString(),
    };

    const link: any = {
      link_id: `EL-NEW-${Date.now().toString().slice(-3)}`,
      incident_id: 'INC-001',
      evidence_id: evId,
      linked_at: new Date().toISOString(),
      similarity_score: 0.92,
      link_rationale: 'Proximity within 200m and shared flood context',
      evidence: fallbackEvidence,
    };

    // Update local demo incident state if present
    const inc = localDemoIncidents.find((i) => i.incident_id === 'INC-001') || localDemoIncidents[0];
    if (inc) {
      if (isCritical) inc.severity = 'critical';
      if (isBlocked) inc.access_status = 'blocked';
      if (fallbackEvidence.people_affected) {
        inc.people_affected = Math.max(inc.people_affected, fallbackEvidence.people_affected);
      }
      inc.evidence_links = [link, ...inc.evidence_links];
      
      const deltas = [
        `New evidence attached from ${report.source}`,
        isBlocked ? 'Road access confirmed BLOCKED' : 'Corroborated water logging',
      ];
      if (hasMedical) deltas.push('Medical attention required');

      const newSnap: any = {
        snapshot_id: `SNAP-${Date.now().toString().slice(-4)}`,
        incident_id: inc.incident_id,
        timestamp: new Date().toISOString(),
        severity: inc.severity,
        people_affected: inc.people_affected,
        access_status: inc.access_status,
        active_needs: extractedNeeds,
        priority_score: isCritical ? 98.0 : 85.0,
        summary: `Update from Evidence ${evId}: ${deltas.join(', ')}`,
        delta_summary: deltas,
      };
      inc.snapshots = [...inc.snapshots, newSnap];
      inc.updated_at = new Date().toISOString();
    }

    return {
      status: 'success',
      report_id: report.report_id,
      evidence: fallbackEvidence,
      evidence_link: link,
      incident_id: 'INC-001',
      active_recommendation: localDemoRecommendation,
    };
  },

  // List all incidents
  async getIncidents(): Promise<Incident[]> {
    if (this.isMockMode) {
      return localDemoIncidents;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return localDemoIncidents;
    } catch (err) {
      console.warn('Backend unavailable, using demo incidents:', err);
      return localDemoIncidents;
    }
  },

  // Get incident detail
  async getIncident(incidentId: string): Promise<Incident> {
    if (this.isMockMode) {
      const found = localDemoIncidents.find((i) => i.incident_id === incidentId);
      if (found) return found;
      return localDemoIncidents[0];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    } catch (err) {
      console.warn(`Backend unavailable for incident ${incidentId}, using demo incident:`, err);
      const found = localDemoIncidents.find((i) => i.incident_id === incidentId);
      return found || localDemoIncidents[0];
    }
  },

  // Get incident timeline snapshots ("What changed?")
  async getIncidentTimeline(incidentId: string): Promise<IncidentSnapshot[]> {
    if (this.isMockMode) {
      return demoSnapshots.filter((s) => s.incident_id === incidentId);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/timeline`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return demoSnapshots.filter((s) => s.incident_id === incidentId);
    } catch (err) {
      console.warn('Backend unavailable, using demo snapshots:', err);
      return demoSnapshots.filter((s) => s.incident_id === incidentId);
    }
  },
  // Backward compatibility alias
  async getTimeline(incidentId: string): Promise<IncidentSnapshot[]> {
    return this.getIncidentTimeline(incidentId);
  },

  // Get contributing evidence links
  async getIncidentEvidence(incidentId: string): Promise<EvidenceLink[]> {
    if (this.isMockMode) {
      return demoEvidenceList.filter((e) => e.incident_id === incidentId);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/evidence`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return demoEvidenceList.filter((e) => e.incident_id === incidentId);
    } catch (err) {
      console.warn('Backend unavailable, using demo evidence list:', err);
      return demoEvidenceList.filter((e) => e.incident_id === incidentId);
    }
  },
  // Backward compatibility alias
  async getEvidence(incidentId: string): Promise<EvidenceLink[]> {
    return this.getIncidentEvidence(incidentId);
  },

  // Get recommendations
  async getIncidentRecommendations(incidentId: string): Promise<ActionPlan | null> {
    if (this.isMockMode) {
      if (localDemoRecommendation.incident_id === incidentId) {
        return localDemoRecommendation;
      }
      return null;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/${incidentId}`);
      if (!res.ok) return localDemoRecommendation;
      return res.json();
    } catch (err) {
      console.warn('Backend unavailable, using demo recommendations:', err);
      return localDemoRecommendation;
    }
  },
  // Backward compatibility alias
  async getRecommendations(incidentId: string): Promise<ActionPlan | null> {
    return this.getIncidentRecommendations(incidentId);
  },

  // Verify recommendation (approve / reject / edit)
  async verifyRecommendation(
    actionId: string,
    status: VerificationStatus,
    responderId: string,
    notes?: string
  ): Promise<ActionPlan> {
    if (this.isMockMode) {
      localDemoRecommendation = {
        ...localDemoRecommendation,
        verification_status: status,
        verified_by: responderId,
        verified_at: new Date().toISOString(),
        responder_notes: notes,
      };
      return localDemoRecommendation;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/${actionId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responder_id: responderId, status, notes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    } catch (err) {
      console.warn('Backend unavailable for verification, updating locally:', err);
      localDemoRecommendation = {
        ...localDemoRecommendation,
        verification_status: status,
        verified_by: responderId,
        verified_at: new Date().toISOString(),
        responder_notes: notes,
      };
      return localDemoRecommendation;
    }
  },

  // Convenience helper to reject a recommendation
  async rejectRecommendation(
    actionId: string,
    responderId: string,
    notes?: string
  ): Promise<ActionPlan> {
    return this.verifyRecommendation(actionId, 'rejected', responderId, notes);
  },
};

export const api = crisisLensApi;
