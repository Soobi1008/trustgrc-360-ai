export default function PlatformPage() {
  return (
    <main className="page-container">
      <div className="page-hero">
        <span className="section-label">PLATFORM</span>

        <h1>TrustGRC AI 360 Platform</h1>

        <p>
          One unified platform for AI Governance,
          Risk Management, Privacy Compliance,
          Regulatory Intelligence and Audit Readiness.
        </p>
      </div>

      <div className="feature-grid">

        <div className="feature-card">
          <h3>AI Governance</h3>
          <p>Maintain inventory and ownership of AI systems.</p>
        </div>

        <div className="feature-card">
          <h3>Risk Register</h3>
          <p>Manage AI, privacy and cybersecurity risks.</p>
        </div>

        <div className="feature-card">
          <h3>Regulatory Library</h3>
          <p>Browse GDPR, EU AI Act and ISO requirements.</p>
        </div>

        <div className="feature-card">
          <h3>Applicability Engine</h3>
          <p>Determine applicable regulations automatically.</p>
        </div>

      </div>
    </main>
  );
}