import React, { useState, useEffect } from 'react';
import type { Report, ReportSubmissionResponse } from '@/types/domain';
import { api } from '@/services/api';
import {
  Camera,
  Video,
  FileText,
  MapPin,
  Clock,
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';

export interface AddReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedIncidentId?: string | null;
  prefillLocation?: string;
  onReportSubmitted: (response: ReportSubmissionResponse) => void;
}

type Step = 'input' | 'analyzing' | 'matched' | 'confirmed';
type ContentType = 'image' | 'video' | 'text';

export const AddReportModal: React.FC<AddReportModalProps> = ({
  isOpen,
  onClose,
  preselectedIncidentId,
  prefillLocation,
  onReportSubmitted,
}) => {
  const [step, setStep] = useState<Step>('input');
  const [contentType, setContentType] = useState<ContentType>('image');
  const [text, setText] = useState<string>('');
  const [locationStr, setLocationStr] = useState<string>('');
  const [source, setSource] = useState<string>('citizen');
  const [timestampStr, setTimestampStr] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Analysis simulation progress
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmissionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setContentType('image');
      setText('Water level rising over Bridge Road. Vehicles cannot cross and multiple people stranded.');
      setLocationStr(prefillLocation || 'Bridge Road, Sector 4');
      setSource('citizen');
      setFileName('flood_bridge_road.jpg');
      setAnalysisStepIndex(0);
      setSubmissionResult(null);
      setErrorMsg(null);

      const now = new Date();
      setTimestampStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    }
  }, [isOpen, prefillLocation]);

  if (!isOpen) return null;

  // Preset demo helpers
  const applyPreset = (preset: 'preset_photo' | 'preset_trapped' | 'preset_video') => {
    if (preset === 'preset_photo') {
      setContentType('image');
      setText('Water overflowing onto Bridge Road. High current and water rising near shops.');
      setFileName('bridge_flood_photo.jpg');
      setLocationStr('Bridge Road, Sector 4');
      setSource('citizen');
    } else if (preset === 'preset_trapped') {
      setContentType('text');
      setText('People are trapped near the bridge. Water entered ground floors. 12 people stranded without safe access.');
      setFileName(null);
      setLocationStr('Bridge Road, Sector 4');
      setSource('citizen');
    } else if (preset === 'preset_video') {
      setContentType('video');
      setText('Footage confirms road completely blocked. Medical emergency inside sector, ambulance cannot pass.');
      setFileName('road_submerged_blocked.mp4');
      setLocationStr('Bridge Road, Sector 4');
      setSource('responder');
    }
  };

  const handleStartAnalysis = async () => {
    if (!text.trim() && !fileName) {
      setErrorMsg('Please provide a report description or select a file to ingest.');
      return;
    }

    setErrorMsg(null);
    setStep('analyzing');
    setAnalysisStepIndex(0);

    const generatedId = `R-${Date.now().toString().slice(-4)}`;
    const mediaItems = [];
    if (contentType === 'image') {
      mediaItems.push({
        media_id: `M-${Date.now().toString().slice(-3)}`,
        media_type: 'image/jpeg',
        url: fileName ? `/uploads/${fileName}` : '/images/flood1.jpg',
        caption: text.slice(0, 40),
      });
    } else if (contentType === 'video') {
      mediaItems.push({
        media_id: `M-${Date.now().toString().slice(-3)}`,
        media_type: 'video/mp4',
        url: fileName ? `/uploads/${fileName}` : '/videos/flood_blockage.mp4',
        caption: text.slice(0, 40),
      });
    }

    const reportPayload: Report = {
      report_id: generatedId,
      text: text.trim(),
      media: mediaItems,
      location: {
        lat: 12.935,
        lng: 77.624,
        address: locationStr.trim() || 'Bridge Road, Sector 4',
      },
      source: source,
      timestamp: new Date().toISOString(),
    };

    // Staged progression indicators matching operational specification
    const t1 = setTimeout(() => setAnalysisStepIndex(1), 350);
    const t2 = setTimeout(() => setAnalysisStepIndex(2), 700);
    const t3 = setTimeout(() => setAnalysisStepIndex(3), 1100);

    try {
      const response = await api.submitReport(reportPayload);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setSubmissionResult(response);
      setStep('matched');
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      const msg = err instanceof Error ? err.message : 'Failed to analyze report';
      setErrorMsg(msg);
      setStep('input');
    }
  };

  const handleConfirmAddToIncident = () => {
    setStep('confirmed');
  };

  const handleFinish = () => {
    if (submissionResult) {
      onReportSubmitted(submissionResult);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-report-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#0284c7',
                }}
              >
                Information Ingestion
              </span>
              {preselectedIncidentId && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  Targeting {preselectedIncidentId}
                </span>
              )}
            </div>
            <h2
              id="add-report-title"
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: '2px 0 0 0',
              }}
            >
              {step === 'input' && 'Add Disaster Information'}
              {step === 'analyzing' && 'Analyzing Fragmented Evidence'}
              {step === 'matched' && 'Evidence Analyzed & Incident Matched'}
              {step === 'confirmed' && 'Evidence Connected to Incident'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: COLLECT FRAGMENTED INFORMATION */}
          {step === 'input' && (
            <>
              {/* Quick Demo Presets Banner */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    Quick Demo Presets:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => applyPreset('preset_photo')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    📷 Flooded Road Photo (10:14)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('preset_trapped')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    📝 Trapped Residents (10:21)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('preset_video')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    🎥 Road Blocked Video (10:25)
                  </button>
                </div>
              </div>

              {/* What did you receive? Type tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  What did you receive?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setContentType('image')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: contentType === 'image' ? '#0284c7' : '#cbd5e1',
                      backgroundColor: contentType === 'image' ? '#f0f9ff' : '#ffffff',
                      color: contentType === 'image' ? '#0369a1' : '#475569',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <Camera size={16} />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('video')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: contentType === 'video' ? '#0284c7' : '#cbd5e1',
                      backgroundColor: contentType === 'video' ? '#f0f9ff' : '#ffffff',
                      color: contentType === 'video' ? '#0369a1' : '#475569',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <Video size={16} />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: contentType === 'text' ? '#0284c7' : '#cbd5e1',
                      backgroundColor: contentType === 'text' ? '#f0f9ff' : '#ffffff',
                      color: contentType === 'text' ? '#0369a1' : '#475569',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={16} />
                    <span>Text Report</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone (When image or video) */}
              {contentType !== 'text' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Upload Media
                  </label>
                  <div
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '6px',
                      padding: '18px 16px',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Upload size={22} color="#64748b" />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                      {fileName ? (
                        <span style={{ color: '#0369a1', fontFamily: 'var(--font-mono)' }}>{fileName}</span>
                      ) : (
                        `Drop ${contentType} file here, or click to browse`
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Supports JPG, PNG, MP4, MOV (up to 50MB)
                    </span>
                  </div>
                </div>
              )}

              {/* Report Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Report Description / Citizen Note
                </label>
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe what was observed or reported in the field..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Metadata row: Location, Source, Timestamp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Location Landmark / Road
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} color="#0284c7" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      placeholder="e.g. Bridge Road"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Information Source
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="citizen">Citizen Report</option>
                      <option value="responder">First Responder</option>
                      <option value="official">Official Authority</option>
                      <option value="other">Social / Media</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Timestamp
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={timestampStr}
                      onChange={(e) => setTimestampStr(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: CLEAR PROCESSING / ANALYSIS CHECKLIST */}
          {step === 'analyzing' && (
            <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Multimodal Evidence Pipeline
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  Analyzing New Evidence
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Extracting hazards, entities, and spatial coordinates from raw input.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                    Evidence received & logged
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {analysisStepIndex >= 1 ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #0284c7', display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: analysisStepIndex >= 1 ? '#0f172a' : '#64748b' }}>
                    Extracting disaster features & relief needs...
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {analysisStepIndex >= 2 ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: analysisStepIndex >= 2 ? '#0f172a' : '#64748b' }}>
                    Checking spatial coordinates & access status...
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {analysisStepIndex >= 3 ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: analysisStepIndex >= 3 ? '#0f172a' : '#64748b' }}>
                    Comparing with active evolving incidents...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STRUCTURED EVIDENCE & INCIDENT MATCH */}
          {step === 'matched' && submissionResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Evidence Found Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                    Evidence Found
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '4px' }}>
                    High confidence
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Disaster Type:</span>
                    <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                      {submissionResult.evidence.disaster_type} Hazard
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Location:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {submissionResult.evidence.location?.address || 'Bridge Road'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Source:</span>
                    <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                      {submissionResult.evidence.raw_report?.source || 'Citizen Report'}
                    </strong>
                  </div>
                </div>

                {submissionResult.evidence.needs && submissionResult.evidence.needs.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Extracted Operational Needs: </span>
                    <strong style={{ color: '#b91c1c' }}>
                      {submissionResult.evidence.needs.map(n => n.toUpperCase()).join(' · ')}
                    </strong>
                  </div>
                )}
              </div>

              {/* Related Incident Match Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #94a3b8',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7' }}>
                    Related Incident Found
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                    {submissionResult.incident_id}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Flooding — Bridge Road
                  </h4>
                </div>

                {/* Match Reasons */}
                <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Why this appears related:</span>
                  <span>✓ Same location: Bridge Road (within 200m spatial buffer)</span>
                  <span>✓ Similar temporal window</span>
                  <span>✓ Corroborated flood context & blocked access</span>
                </div>

                {/* Visual Architecture Representation (Requirement 6) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#475569',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>📷 Photo + 📝 Citizen report + 🎥 Video</span>
                  <ArrowRight size={13} color="#0284c7" />
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>INC-001 Flooding</span>
                  <ArrowRight size={13} color="#0284c7" />
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>One Evolving Incident</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'confirmed' && submissionResult && (
            <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#14532d', margin: 0 }}>
                    Evidence Added to {submissionResult.incident_id}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#166534', margin: '2px 0 0 0' }}>
                    Report attached to Flooding — Bridge Road. The incident situation has evolved.
                  </p>
                </div>
              </div>

              {/* What Changed Highlight */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309' }}>
                  What Changed in Incident State:
                </span>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: '#0f172a', lineHeight: 1.5 }}>
                  <li>New evidence confirms road blockage at bridge crossing</li>
                  <li>Incident situation corroborated by multiple independent field reports</li>
                  <li>Relief needs and response recommendation updated</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          {step === 'input' && (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartAnalysis}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 18px',
                  borderRadius: '4px',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Analyze Evidence</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 'analyzing' && (
            <div style={{ width: '100%', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              Processing report...
            </div>
          )}

          {step === 'matched' && (
            <>
              <button
                type="button"
                onClick={handleConfirmAddToIncident}
                style={{
                  padding: '7px 14px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create New Incident Instead
              </button>

              <button
                type="button"
                onClick={handleConfirmAddToIncident}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 18px',
                  borderRadius: '4px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Add to Incident ({submissionResult?.incident_id || 'INC-001'})</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 'confirmed' && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleFinish}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 20px',
                  borderRadius: '4px',
                  backgroundColor: '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>View Updated Incident</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
