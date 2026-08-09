import Link from "next/link";
import Navbar from "./components/Navbar";

const capabilities = [
  {
    title: "AI Governance",
    description:
      "Maintain a structured inventory of AI systems, ownership, deployment status, risk classification and governance responsibilities.",
    icon: "◎",
  },
  {
    title: "Regulatory Intelligence",
    description:
      "Connect AI systems to applicable regulations, articles, obligations and controls across multiple jurisdictions.",
    icon: "◈",
  },
  {
    title: "Risk Management",
    description:
      "Identify, assess and manage AI, privacy, cybersecurity and operational risks throughout the AI lifecycle.",
    icon: "△",
  },
  {
    title: "Privacy Compliance",
    description:
      "Evaluate data-processing activities against privacy requirements including GDPR, HIPAA and global privacy laws.",
    icon: "◇",
  },
  {
    title: "Audit Readiness",
    description:
      "Connect obligations to controls, evidence and findings to build a defensible compliance and assurance trail.",
    icon: "✓",
  },
  {
    title: "AI Security & Resilience",
    description:
      "Bring governance, cybersecurity readiness, robustness and AI-specific risk oversight into one operating model.",
    icon: "⬡",
  },
];

const steps = [
  "Discover",
  "Classify",
  "Assess",
  "Govern",
  "Evidence",
  "Remediate",
  "Report",
];

const frameworks = [
  "GDPR",
  "EU AI Act",
  "ISO/IEC 42001",
  "NIST AI RMF",
  "ISO 27001",
  "HIPAA",
  "Global Privacy",
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Unified AI Governance Intelligence
          </div>

          <h1>
            Govern AI.
            <br />
            Manage Risk.
            <br />
            <span>Prove Compliance.</span>
          </h1>

          <p className="hero-description">
            TrustGRC AI 360 brings AI governance, regulatory
            intelligence, risk management, privacy compliance and
            audit readiness together in one intelligent platform.
          </p>

          <div className="hero-actions">
            <Link href="/platform" className="primary-button">
              Explore the Platform
              <span>→</span>
            </Link>

            <Link href="/contact" className="secondary-button">
              Request a Demo
            </Link>
          </div>

          <div className="hero-trust-row">
            <div>
              <strong>360°</strong>
              <span>Governance View</span>
            </div>

            <div>
              <strong>Multi-Regulation</strong>
              <span>Compliance Intelligence</span>
            </div>

            <div>
              <strong>Evidence-Led</strong>
              <span>Audit Readiness</span>
            </div>
          </div>
        </div>

        {/* REGULATORY INTELLIGENCE VISUAL */}
        <div className="hero-visual">
          <div className="intelligence-panel">
            <div className="panel-header">
              <div>
                <span className="status-dot" />
                Regulatory Intelligence
              </div>

              <span className="live-label">LIVE</span>
            </div>

            <div className="network">
              <div className="centre-node">
                <span>AI</span>
                <strong>System</strong>
              </div>

              <div className="orbit-node node-gdpr">
                GDPR
              </div>

              <div className="orbit-node node-aia">
                EU AI Act
              </div>

              <div className="orbit-node node-risk">
                Risk
              </div>

              <div className="orbit-node node-privacy">
                Privacy
              </div>

              <div className="orbit-node node-controls">
                Controls
              </div>

              <div className="orbit-node node-evidence">
                Evidence
              </div>
            </div>

            <div className="panel-result">
              <div>
                <span>Applicability Engine</span>
                <strong>Regulatory context identified</strong>
              </div>

              <span className="result-check">✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section className="framework-strip">
        <p>Designed for modern AI governance frameworks</p>

        <div className="framework-row">
          {frameworks.map((framework) => (
            <span key={framework}>{framework}</span>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section
        className="section platform-section"
        id="platform"
      >
        <div className="section-heading">
          <span>THE PLATFORM</span>

          <h2>
            One control plane for
            <br />
            trustworthy AI.
          </h2>

          <p>
            Replace fragmented governance processes with a connected
            system for understanding AI risk, regulatory applicability
            and compliance obligations.
          </p>
        </div>

        <div className="capability-grid" id="services">
          {capabilities.map((capability) => (
            <article
              className="capability-card"
              key={capability.title}
            >
              <div className="capability-icon">
                {capability.icon}
              </div>

              <h3>{capability.title}</h3>

              <p>{capability.description}</p>

              <span className="card-link">
                Explore capability →
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* REGULATORY INTELLIGENCE CONTENT */}
      <section className="intelligence-section">
        <div className="intelligence-copy">
          <span className="section-label">
            REGULATORY INTELLIGENCE
          </span>

          <h2>
            From regulation
            <br />
            to actionable control.
          </h2>

          <p>
            TrustGRC AI 360 connects legal requirements to operational
            governance so teams can understand not only which
            regulation applies, but why it applies and what they need
            to do next.
          </p>

          <div className="knowledge-path">
            <span>Regulation</span>
            <b>→</b>
            <span>Article</span>
            <b>→</b>
            <span>Obligation</span>
            <b>→</b>
            <span>Control</span>
          </div>
        </div>

        <div className="compliance-card">
          <div className="compliance-card-top">
            <div>
              <small>AI SYSTEM</small>
              <strong>Customer Decision AI</strong>
            </div>

            <span className="risk-badge">
              High Risk
            </span>
          </div>

          <div className="compliance-item">
            <div className="compliance-icon">✓</div>

            <div>
              <strong>GDPR</strong>

              <p>
                Applicable through jurisdiction and personal-data
                processing.
              </p>
            </div>
          </div>

          <div className="compliance-item">
            <div className="compliance-icon">✓</div>

            <div>
              <strong>EU AI Act</strong>

              <p>
                AI governance obligations identified for the system
                context.
              </p>
            </div>
          </div>

          <div className="compliance-item muted-item">
            <div className="compliance-icon">→</div>

            <div>
              <strong>Required evidence</strong>

              <p>
                Risk assessment, technical documentation, oversight
                records and control evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      

      {/* ABOUT */}
      <section className="about-section" id="about">
        <div>
          <span className="section-label">
            BUILT FOR TRUSTWORTHY AI
          </span>

          <h2>
            Governance that evolves with your AI.
          </h2>
        </div>

        <p>
          TrustGRC AI 360 is designed to connect governance, privacy,
          risk, security and regulatory intelligence across the AI
          lifecycle — helping organisations turn complex obligations
          into practical, auditable actions.
        </p>
      </section>

      {/* CTA */}
      <section className="cta-section" id="demo">
        <div className="cta-content">
          <span className="section-label">
            TRUSTGRC AI 360
          </span>

          <h2>
            Turn AI compliance into
            <br />
            continuous governance.
          </h2>

          <p>
            Discover applicable requirements, assess risk, manage
            controls and build evidence for trustworthy AI.
          </p>
        </div>

        <div className="cta-actions">
          <Link href="/login" className="light-button">
            Access Platform
          </Link>

          <Link
            href="/contact"
            className="outline-light-button"
          >
            Request Demo
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">T</span>

              <span>
                <strong>TrustGRC AI 360</strong>
                <small>
                  Governance • Risk • Compliance
                </small>
              </span>
            </div>

            <p>
              Building trust in AI through connected governance,
              regulatory intelligence and risk management.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <strong>Platform</strong>

              <Link href="/platform/ai-governance">
                AI Governance
              </Link>

              <Link href="/platform/risk-register">
                Risk Management
              </Link>

              <Link href="/platform/assessments">
                Assessments
              </Link>
            </div>

            <div>
              <strong>Regulations</strong>

              <Link href="/regulations/gdpr">
                GDPR
              </Link>

              <Link href="/regulations/eu-ai-act">
                EU AI Act
              </Link>

              <Link href="/regulations/iso-42001">
                ISO/IEC 42001
              </Link>
            </div>

            <div>
              <strong>Resources</strong>

              <Link href="/documentation">
                Documentation
              </Link>

              <Link href="/resources/api-reference">
                API Reference
              </Link>

              <Link href="/resources/regulatory-library">
                Regulatory Library
              </Link>
            </div>

            <div>
              <strong>Company</strong>

              <Link href="/company/about">
                About
              </Link>

              <Link href="/contact">
                Contact
              </Link>

              <Link href="/login">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 TrustGRC AI 360. All rights reserved.
          </span>

          <span>
            AI Governance • Privacy • Risk • Compliance
          </span>
        </div>
      </footer>
    </main>
  );
}