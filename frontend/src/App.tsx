export default function App() {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
            }}
          >
            CL
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              CrisisLens AI <span style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500 }}>Command Center</span>
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Flooding Intelligence & Dynamic Response Orchestrator</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              color: 'var(--severity-low)',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--severity-low)' }} />
            Pipeline Online (Flood MVP)
          </span>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--color-primary)',
              color: '#000',
              fontWeight: 600,
              fontSize: '13px',
            }}
            onClick={() => alert('Demo Simulation Trigger')}
          >
            Simulate Incoming Evidence
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 380px', gap: '1px', background: 'var(--border-subtle)' }}>
        {/* Left Column: Live Incidents */}
        <section style={{ background: 'var(--bg-secondary)', padding: '20px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Active Incidents (1)
          </h2>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-active)',
              borderRadius: '10px',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INC-001</span>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--severity-critical)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                CRITICAL
              </span>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Sector 4 Flash Flood & Bridge Collapse</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Rapid water level surge. 5 trapped residents, medical emergency reported.
            </p>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
              <span style={{ background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                📍 Central Bridge
              </span>
              <span style={{ background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                🚨 2 Unmet Needs
              </span>
            </div>
          </div>
        </section>

        {/* Center Column: Situation Evolution & Map */}
        <section style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
          {/* Situation Evolution / "What Changed?" Banner */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                Situation Evolution (Latest Snapshot)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>10:21 AM</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--severity-critical)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                + 5 people affected
              </span>
              <span style={{ fontSize: '13px', color: 'var(--severity-high)', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                + Rescue boat need identified
              </span>
              <span style={{ fontSize: '13px', color: 'var(--severity-critical)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                + Medical emergency detected
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                Road status: BLOCKED
              </span>
            </div>
          </div>

          {/* Interactive Map & Timeline Placeholder Area */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            <div
              style={{
                height: '240px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Geospatial Incident Perimeter</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lat: 12.935, Lng: 77.624 • Flood Inundation Zone</p>
              </div>
            </div>

            {/* Situation Timeline */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Incident Evolution Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { time: '10:02', title: 'Flash flood reported at bridge', tag: 'INITIAL EVIDENCE' },
                  { time: '10:08', title: '5 residents stranded on rooftop, water depth 1.5m', tag: 'EVOLUTION' },
                  { time: '10:14', title: 'East approach road completely blocked by water flow', tag: 'ACCESS STATUS' },
                  { time: '10:21', title: 'Trapped senior citizen in need of cardiac medication', tag: 'CRITICAL NEED' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      background: 'var(--bg-card)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)' }}>{item.time}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: AI Decision Support & Verification */}
        <section style={{ background: 'var(--bg-secondary)', padding: '20px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Decision & Response Intelligence
          </h2>

          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Calculated Priority</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--severity-critical)' }}>88.5 / 100</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Scoring Rationale:</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>5 people trapped with rising water</li>
              <li>Roadway blocked preventing standard vehicular access</li>
              <li>Critical medical emergency identified</li>
            </ul>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>RECOMMENDED ACTION PLAN</span>
              <span style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.2)', color: 'var(--severity-medium)', padding: '2px 6px', borderRadius: '4px' }}>
                PENDING VERIFICATION
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Dispatched units based on water rescue and emergency medical requirements:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <strong>Water Rescue Boat Alpha</strong> (Capacity: 6 • ETA: 12 min)
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <strong>Rapid Medical Unit 03</strong> (Paramedics • ETA: 8 min)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'var(--severity-low)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
                onClick={() => alert('Recommendation Approved by Responder!')}
              >
                Approve & Deploy
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
                onClick={() => alert('Edit or Reject Dialog')}
              >
                Modify / Reject
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
