import {
  Incident,
  IncidentSnapshot,
  EvidenceLink,
  ActionPlan,
  VerificationStatus,
  Report,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const crisisLensApi = {
  // Submit raw report
  async submitReport(report: Report): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/reports/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error(`Failed to submit report: ${res.statusText}`);
    return res.json();
  },

  // List all incidents
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE_URL}/incidents/`);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    return res.json();
  },

  // Get incident detail
  async getIncident(incidentId: string): Promise<Incident> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${incidentId}: ${res.statusText}`);
    return res.json();
  },

  // Get incident timeline snapshots ("What changed?")
  async getTimeline(incidentId: string): Promise<IncidentSnapshot[]> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/timeline`);
    if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.statusText}`);
    return res.json();
  },

  // Get contributing evidence links
  async getEvidence(incidentId: string): Promise<EvidenceLink[]> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/evidence`);
    if (!res.ok) throw new Error(`Failed to fetch evidence: ${res.statusText}`);
    return res.json();
  },

  // Get recommendations
  async getRecommendations(incidentId: string): Promise<ActionPlan | null> {
    const res = await fetch(`${API_BASE_URL}/recommendations/${incidentId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Verify recommendation (approve / reject / edit)
  async verifyRecommendation(
    actionId: string,
    status: VerificationStatus,
    responderId: string,
    notes?: string
  ): Promise<ActionPlan> {
    const res = await fetch(`${API_BASE_URL}/recommendations/${actionId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responder_id: responderId, status, notes }),
    });
    if (!res.ok) throw new Error(`Failed to verify recommendation: ${res.statusText}`);
    return res.json();
  },
};
