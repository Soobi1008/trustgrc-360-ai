"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Organizations", href: "/organizations" },
  { label: "AI Inventory", href: "/inventory" },
  { label: "Generated Risks", href: "/generated-risks" },
  { label: "Assessments", href: "/assessments" },
  { label: "Risk Register", href: "/risks" },
  { label: "Controls", href: "/controls" },
  { label: "Evidence", href: "/evidence" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "235px",
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "28px 15px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "36px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 600,
          }}
        >
          TrustGRC AI 360
        </h1>

        <p
          style={{
            marginTop: "10px",
            color: "#a7b3c7",
            fontSize: "13px",
          }}
        >
          Governance, Risk & Compliance
        </p>
      </div>

      <nav>
        {navigationItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                marginBottom: "8px",
                padding: "13px 14px",
                borderRadius: "8px",
                background: active ? "#2563eb" : "transparent",
                color: "white",
                textDecoration: "none",
                fontSize: "15px",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}