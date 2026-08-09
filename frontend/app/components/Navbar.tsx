"use client";

import Link from "next/link";
import { useState } from "react";

const platformItems = [
  { label: "AI Governance", href: "/platform/ai-governance" },
  { label: "AI Inventory", href: "/platform/ai-inventory" },
  { label: "Risk Register", href: "/platform/risk-register" },
  { label: "Assessments", href: "/platform/assessments" },
  {
    label: "Applicability Engine",
    href: "/platform/applicability-engine",
  },
  { label: "Reporting", href: "/platform/reporting" },
];

const regulationItems = [
  { label: "GDPR", href: "/regulations/gdpr" },
  { label: "EU AI Act", href: "/regulations/eu-ai-act" },
  { label: "ISO/IEC 42001", href: "/regulations/iso-42001" },
  { label: "NIST AI RMF", href: "/regulations/nist-ai-rmf" },
  { label: "ISO 27001", href: "/regulations/iso-27001" },
  { label: "HIPAA", href: "/regulations/hipaa" },
];

const resourceItems = [
  { label: "Documentation", href: "/documentation" },
  { label: "API Reference", href: "/resources/api-reference" },
  {
    label: "Regulatory Library",
    href: "/resources/regulatory-library",
  },
  { label: "Roadmap", href: "/resources/roadmap" },
];

const companyItems = [
  { label: "About", href: "/company/about" },
  { label: "Vision", href: "/company/vision" },
  { label: "Founder", href: "/company/founder" },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark">T</span>

        <span>
          <strong>TrustGRC AI 360</strong>
          <small>Governance • Risk • Compliance</small>
        </span>
      </Link>

      <nav className="nav-links">
        <Link href="/">Home</Link>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setOpenMenu("platform")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            className="nav-dropdown-trigger"
            onClick={() => toggleMenu("platform")}
          >
            Platform
            <span>▾</span>
          </button>

          {openMenu === "platform" && (
            <div className="dropdown-menu">
              {platformItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setOpenMenu("regulations")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            className="nav-dropdown-trigger"
            onClick={() => toggleMenu("regulations")}
          >
            Regulations
            <span>▾</span>
          </button>

          {openMenu === "regulations" && (
            <div className="dropdown-menu">
              {regulationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setOpenMenu("resources")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            className="nav-dropdown-trigger"
            onClick={() => toggleMenu("resources")}
          >
            Resources
            <span>▾</span>
          </button>

          {openMenu === "resources" && (
            <div className="dropdown-menu">
              {resourceItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setOpenMenu("company")}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <button
            className="nav-dropdown-trigger"
            onClick={() => toggleMenu("company")}
          >
            Company
            <span>▾</span>
          </button>

          {openMenu === "company" && (
            <div className="dropdown-menu">
              {companyItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/contact">Contact</Link>
      </nav>

      <div className="nav-actions">
        <Link href="/login" className="signin-link">
          Sign in
        </Link>

        <Link href="/contact" className="nav-button">
          Request Demo
        </Link>
      </div>
    </header>
  );
}