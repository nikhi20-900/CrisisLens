import {
  Incident,
  IncidentSnapshot,
  EvidenceLink,
  ActionPlan,
  VerificationStatus,
  Report,
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
  async submitReport(report: Report): Promise<any> {
    if (this.isMockMode) {
      return { status: 'success', report_id: report.report_id, mock: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error(`Failed to submit report: ${res.statusText}`);
      return res.json();
    } catch (err) {
      console.warn('API unavailable, falling back to mock response:', err);
      return { status: 'success', report_id: report.report_id, mock: true };
    }
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
