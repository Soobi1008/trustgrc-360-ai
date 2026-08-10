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

const frameworks = [
  "GDPR",
  "EU AI Act",
  "ISO/IEC 42001",
  "NIST AI RMF",
  "ISO/IEC 27001",
  "HIPAA",
  "Global Privacy",
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <Navbar />

      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        {/* HERO MESSAGE */}
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
          </div>

          <div className="hero-trust-row">
            <div className="trust-metric">
              <strong>360°</strong>
              <span>Governance View</span>
            </div>

            <div className="trust-metric">
              <strong>Multi-Regulation</strong>
              <span>Compliance Intelligence</span>
            </div>

            <div className="trust-metric">
              <strong>Evidence-Led</strong>
              <span>Audit Readiness</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            HERO PRODUCT SHOWCASE
            ===================================================== */}
        <div className="hero-product-showcase">

          {/* AI GOVERNANCE CARD */}
          <article className="hero-side-card governance-card">
            <div className="side-card-title-row">
              <div className="side-card-icon governance-icon">
                ◎
              </div>

              <div>
                <span className="side-card-kicker">
                  GOVERN
                </span>

                <h3>AI Governance</h3>
              </div>
            </div>

            <p className="side-card-description">
              Establish governance. Manage risk.
              Demonstrate control.
            </p>

            <div className="side-card-divider" />

            <ul className="side-card-list">
              <li>
                <span className="check-icon">✓</span>
                <span>AI Inventory</span>
              </li>

              <li>
                <span className="check-icon">✓</span>
                <span>Risk Register</span>
              </li>

              <li>
                <span className="check-icon">✓</span>
                <span>Assessments</span>
              </li>

              <li>
                <span className="check-icon">✓</span>
                <span>Controls</span>
              </li>

              <li>
                <span className="check-icon">✓</span>
                <span>Evidence</span>
              </li>
            </ul>

            <div className="governance-score">
              <div className="governance-footer">
                  <strong>5 Core Areas</strong>
                <span>Governance Coverage</span>
              </div>

              <div className="score-track">
                <div className="score-progress" />
              </div>
            </div>
          </article>

          {/* AI SYSTEM ANIMATION */}
          <article className="intelligence-panel">
            <div className="panel-header">
              <div>
                <span className="status-dot" />
                <strong>AI System</strong>
              </div>

              <span className="live-label">
                LIVE
              </span>
            </div>

            <div className="network">
              <div className="network-orbit orbit-one" />
              <div className="network-orbit orbit-two" />
              <div className="network-orbit orbit-three" />

              <div className="centre-node">
                <span>AI</span>
                <strong>SYSTEM</strong>
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
              <div className="engine-icon">
                ◎
              </div>

              <div className="engine-copy">
                <strong>
                  Applicability Engine
                </strong>

                <span>
                  Regulatory context identified
                </span>
              </div>

              <span className="result-check">
                ✓
              </span>
            </div>
          </article>

          {/* REGULATORY INTELLIGENCE CARD */}
          <article className="hero-side-card regulatory-card">
            <div className="side-card-title-row">
              <div className="side-card-icon regulatory-icon">
                ◇
              </div>

              <div>
                <span className="side-card-kicker">
                  COMPLY
                </span>

                <h3>
                  Regulatory Intelligence
                </h3>
              </div>
            </div>

            <p className="side-card-description">
              Identify obligations. Map controls.
              Stay audit ready.
            </p>

            <div className="side-card-divider" />

            <ul className="side-card-list">
              <li>
                <span className="check-icon purple-check">
                  ✓
                </span>
                <span>GDPR</span>
              </li>

              <li>
                <span className="check-icon purple-check">
                  ✓
                </span>
                <span>EU AI Act</span>
              </li>

              <li>
                <span className="check-icon purple-check">
                  ✓
                </span>
                <span>ISO/IEC 42001</span>
              </li>

              <li>
                <span className="check-icon purple-check">
                  ✓
                </span>
                <span>NIST AI RMF</span>
              </li>
            </ul>

            <div className="controls-summary">
              <div className="controls-summary-icon">
                ≡
              </div>

              <div>
                <strong>
                  12 Controls Identified
                </strong>

                <span>
                  Across 4 frameworks
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* =====================================================
          FRAMEWORKS
          ===================================================== */}
      <section className="framework-strip">
        <p>
          Designed for modern AI governance frameworks
        </p>

        <div className="framework-row">
          {frameworks.map((framework) => (
            <span key={framework}>
              {framework}
            </span>
          ))}
        </div>
      </section>

      {/* =====================================================
          PLATFORM
          ===================================================== */}
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
            Replace fragmented governance processes with a
            connected system for understanding AI risk,
            regulatory applicability and compliance
            obligations.
          </p>
        </div>

        <div
          className="capability-grid"
          id="services"
        >
          {capabilities.map((capability) => (
            <article
              className="capability-card"
              key={capability.title}
            >
              <div className="capability-icon">
                {capability.icon}
              </div>

              <h3>
                {capability.title}
              </h3>

              <p>
                {capability.description}
              </p>

              <span className="card-link">
                Explore capability →
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          REGULATORY INTELLIGENCE
          ===================================================== */}
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
            TrustGRC AI 360 connects legal requirements to
            operational governance so teams can understand
            not only which regulation applies, but why it
            applies and what they need to do next.
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

              <strong>
                Customer Decision AI
              </strong>
            </div>

            <span className="risk-badge">
              High Risk
            </span>
          </div>

          <div className="compliance-item">
            <div className="compliance-icon">
              ✓
            </div>

            <div>
              <strong>GDPR</strong>

              <p>
                Applicable through jurisdiction and
                personal-data processing.
              </p>
            </div>
          </div>

          <div className="compliance-item">
            <div className="compliance-icon">
              ✓
            </div>

            <div>
              <strong>EU AI Act</strong>

              <p>
                AI governance obligations identified
                for the system context.
              </p>
            </div>
          </div>

          <div className="compliance-item muted-item">
            <div className="compliance-icon">
              →
            </div>

            <div>
              <strong>
                Required evidence
              </strong>

              <p>
                Risk assessment, technical documentation,
                oversight records and control evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ABOUT
          ===================================================== */}
      <section
        className="about-section"
        id="about"
      >
        <div>
          <span className="section-label">
            BUILT FOR TRUSTWORTHY AI
          </span>

          <h2>
            Governance that evolves with your AI.
          </h2>
        </div>

        <p>
          TrustGRC AI 360 is designed to connect
          governance, privacy, risk, security and
          regulatory intelligence across the AI
          lifecycle — helping organisations turn
          complex obligations into practical,
          auditable actions.
        </p>
      </section>

      {/* =====================================================
          CTA
          ===================================================== */}
      <section
        className="cta-section"
        id="demo"
      >
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
            Discover applicable requirements, assess
            risk, manage controls and build evidence
            for trustworthy AI.
          </p>
        </div>

        <div className="cta-actions">
          <Link
            href="/login"
            className="light-button"
          >
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

      {/* =====================================================
          FOOTER
          ===================================================== */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">
                T
              </span>

              <span>
                <strong>
                  TrustGRC AI 360
                </strong>

                <small>
                  Governance • Risk • Compliance
                </small>
              </span>
            </div>

            <p>
              Building trust in AI through connected
              governance, regulatory intelligence and
              risk management.
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

              <Link href="/platform/regulatory-library">
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
            © 2026 TrustGRC AI 360.
            All rights reserved.
          </span>

          <span>
            AI Governance • Privacy • Risk • Compliance
          </span>
        </div>
      </footer>
    </main>
  );
}