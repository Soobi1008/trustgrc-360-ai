import Link from "next/link";
import Navbar from "../components/Navbar";

const plans = [
  {
    name: "Starter",
    description:
      "For small teams beginning to establish structured AI governance.",
    price: "€49",
    period: "/ month",
    highlight: false,
    badge: "",
    cta: "Start with Starter",
    href: "/contact",
    features: [
      "Up to 10 AI systems",
      "AI inventory",
      "Basic AI risk register",
      "Governance assessments",
      "Basic regulatory mapping",
      "GDPR coverage",
      "EU AI Act coverage",
      "Standard reports",
      "Evidence tracking",
      "Email support",
    ],
  },
  {
    name: "Professional",
    description:
      "For organisations managing multiple AI systems, regulations and compliance obligations.",
    price: "€199",
    period: "/ month",
    highlight: true,
    badge: "MOST POPULAR",
    cta: "Choose Professional",
    href: "/contact",
    features: [
      "Up to 50 AI systems",
      "Everything in Starter",
      "Applicability Engine",
      "Advanced risk assessments",
      "Regulatory Intelligence",
      "ISO/IEC 42001 mapping",
      "NIST AI RMF mapping",
      "Control management",
      "Audit evidence management",
      "Compliance findings",
      "Advanced reporting",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    description:
      "For regulated, multi-entity and complex organisations requiring enterprise governance.",
    price: "Custom",
    period: "",
    highlight: false,
    badge: "",
    cta: "Contact Sales",
    href: "/contact",
    features: [
      "Unlimited or custom AI systems",
      "Everything in Professional",
      "Multi-organisation governance",
      "Custom regulatory frameworks",
      "Enterprise risk management",
      "Advanced controls and evidence",
      "Role-based governance",
      "Executive dashboards",
      "API access",
      "SSO / enterprise authentication",
      "Custom integrations",
      "Dedicated support",
    ],
  },
];

const comparisonRows = [
  {
    feature: "AI Inventory",
    starter: "Up to 10",
    professional: "Up to 50",
    enterprise: "Custom",
  },
  {
    feature: "Risk Register",
    starter: "✓",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "Assessments",
    starter: "Basic",
    professional: "Advanced",
    enterprise: "Advanced",
  },
  {
    feature: "Applicability Engine",
    starter: "—",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "GDPR",
    starter: "✓",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "EU AI Act",
    starter: "✓",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "ISO/IEC 42001",
    starter: "—",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "NIST AI RMF",
    starter: "—",
    professional: "✓",
    enterprise: "✓",
  },
  {
    feature: "Evidence Management",
    starter: "Basic",
    professional: "Advanced",
    enterprise: "Advanced",
  },
  {
    feature: "API Access",
    starter: "—",
    professional: "—",
    enterprise: "✓",
  },
  {
    feature: "Multi-Organisation",
    starter: "—",
    professional: "—",
    enterprise: "✓",
  },
];

const faqItems = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes. Organisations can move to a higher plan as their AI inventory, regulatory scope and governance requirements grow.",
  },
  {
    question: "Is the Applicability Engine included?",
    answer:
      "The Applicability Engine is included in the Professional and Enterprise plans.",
  },
  {
    question: "Do you support additional regulations?",
    answer:
      "Yes. TrustGRC AI 360 is designed to support an expanding regulatory library. Enterprise customers can also discuss custom regulatory requirements.",
  },
  {
    question: "Is Enterprise pricing fixed?",
    answer:
      "No. Enterprise pricing depends on organisational size, number of AI systems, integrations, governance complexity and support requirements.",
  },
];

export default function PricingPage() {
  return (
    <main className="landing-page pricing-page">
      <Navbar />

      {/* =====================================================
          PRICING HERO
          ===================================================== */}
      <section className="pricing-hero">
        <div className="pricing-hero-glow pricing-glow-one" />
        <div className="pricing-hero-glow pricing-glow-two" />

        <div className="pricing-hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Flexible AI Governance
          </div>

          <h1>
            Governance that scales
            <br />
            <span>with your AI.</span>
          </h1>

          <p>
            Start with the governance capabilities you need today
            and expand as your AI inventory, regulatory exposure
            and compliance requirements grow.
          </p>

          <div className="pricing-note">
            <span className="pricing-note-dot" />
            Simple plans. No fragmented governance modules.
          </div>
        </div>
      </section>

      {/* =====================================================
          PRICING CARDS
          ===================================================== */}
      <section className="pricing-section">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card ${
                plan.highlight ? "pricing-card-featured" : ""
              }`}
            >
              {plan.badge && (
                <div className="pricing-badge">
                  {plan.badge}
                </div>
              )}

              <div className="pricing-card-top">
                <h2>{plan.name}</h2>

                <p>{plan.description}</p>

                <div className="price-row">
                  <strong>{plan.price}</strong>

                  {plan.period && (
                    <span>{plan.period}</span>
                  )}
                </div>
              </div>

              <Link
                href={plan.href}
                className={
                  plan.highlight
                    ? "pricing-button pricing-button-primary"
                    : "pricing-button pricing-button-secondary"
                }
              >
                {plan.cta}
                <span>→</span>
              </Link>

              <div className="pricing-divider" />

              <div className="pricing-includes">
                <span>INCLUDES</span>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span className="pricing-check">
                        ✓
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          VALUE STRIP
          ===================================================== */}
      <section className="pricing-value-strip">
        <div>
          <strong>360°</strong>
          <span>AI Governance View</span>
        </div>

        <div>
          <strong>Multi-Regulation</strong>
          <span>Compliance Intelligence</span>
        </div>

        <div>
          <strong>Evidence-Led</strong>
          <span>Audit Readiness</span>
        </div>

        <div>
          <strong>Lifecycle</strong>
          <span>Continuous Governance</span>
        </div>
      </section>

      {/* =====================================================
          COMPARISON
          ===================================================== */}
      <section className="pricing-comparison-section">
        <div className="pricing-section-heading">
          <span>COMPARE PLANS</span>

          <h2>
            Choose the level of governance
            <br />
            your organisation needs.
          </h2>

          <p>
            All plans are designed around the same connected
            governance model, with additional regulatory,
            automation and enterprise capabilities as you scale.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Starter</th>
                <th className="comparison-featured">
                  Professional
                </th>
                <th>Enterprise</th>
              </tr>
            </thead>

            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>{row.starter}</td>
                  <td className="comparison-featured-cell">
                    {row.professional}
                  </td>
                  <td>{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          ENTERPRISE
          ===================================================== */}
      <section className="enterprise-pricing-section">
        <div className="enterprise-pricing-copy">
          <span className="section-label">
            ENTERPRISE AI GOVERNANCE
          </span>

          <h2>
            Complex AI environment?
            <br />
            Build the right governance model.
          </h2>

          <p>
            Enterprise organisations may require custom
            regulatory libraries, integrations, governance
            workflows, access controls and reporting.
            TrustGRC AI 360 can be configured around those
            requirements.
          </p>
        </div>

        <div className="enterprise-pricing-panel">
          <div className="enterprise-panel-row">
            <span>Multi-Entity Governance</span>
            <strong>✓</strong>
          </div>

          <div className="enterprise-panel-row">
            <span>Custom Regulations</span>
            <strong>✓</strong>
          </div>

          <div className="enterprise-panel-row">
            <span>API & Integrations</span>
            <strong>✓</strong>
          </div>

          <div className="enterprise-panel-row">
            <span>Enterprise Authentication</span>
            <strong>✓</strong>
          </div>

          <div className="enterprise-panel-row">
            <span>Dedicated Support</span>
            <strong>✓</strong>
          </div>

          <Link
            href="/contact"
            className="enterprise-contact-button"
          >
            Talk to Us
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* =====================================================
          FAQ
          ===================================================== */}
      <section className="pricing-faq-section">
        <div className="pricing-section-heading">
          <span>PRICING FAQ</span>

          <h2>
            Questions before choosing a plan?
          </h2>
        </div>

        <div className="pricing-faq-grid">
          {faqItems.map((item) => (
            <article
              key={item.question}
              className="pricing-faq-card"
            >
              <h3>{item.question}</h3>

              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          CTA
          ===================================================== */}
      <section className="pricing-final-cta">
        <div>
          <span className="section-label">
            TRUSTGRC AI 360
          </span>

          <h2>
            Ready to govern AI
            <br />
            with confidence?
          </h2>

          <p>
            Build a connected view of AI governance,
            regulatory applicability, risk, controls and
            evidence.
          </p>
        </div>

        <div className="pricing-final-actions">
          <Link
            href="/contact"
            className="pricing-final-primary"
          >
            Request Demo
          </Link>

          <Link
            href="/platform"
            className="pricing-final-secondary"
          >
            Explore Platform
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