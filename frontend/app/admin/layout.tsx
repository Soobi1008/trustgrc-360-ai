"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LogoutButton from "../components/LogoutButton";
import {
  type AuthUser,
  getStoredUser,
  isPlatformRole,
} from "../../lib/auth";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
  },
  {
    label: "Organizations",
    href: "/admin/organizations",
  },
  {
    label: "Users",
    href: "/admin/users",
  },
  {
    label: "AI Inventory",
    href: "/admin/ai-systems",
  },
  {
    label: "Risk Register",
    href: "/admin/risks",
  },
  {
    label: "Assessments",
    href: "/admin/assessments",
  },
  {
    label: "Frameworks",
    href: "/admin/frameworks",
  },
  {
    label: "Risk Library",
    href: "/admin/risk-library",
  },
  {
    label: "System Health",
    href: "/admin/system-health",
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] =
    useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser || !isPlatformRole(storedUser.role)) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setIsCheckingAccess(false);
  }, [router]);

  if (isCheckingAccess || !user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#475569",
        }}
      >
        Checking administrator access...
      </main>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "260px minmax(0, 1fr)",
        backgroundColor: "#f8fafc",
      }}
    >
      <aside
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "26px 18px",
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            padding: "0 10px 24px",
            borderBottom: "1px solid #334155",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            TrustGRC AI 360
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            Platform Administration
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            marginTop: "24px",
          }}
        >
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "11px 12px",
                  borderRadius: "8px",
                  backgroundColor: isActive
                    ? "#2563eb"
                    : "transparent",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "24px",
            borderTop: "1px solid #334155",
          }}
        >
          <p
            style={{
              marginTop: 0,
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {user.full_name}
          </p>

          <p
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: "#94a3b8",
              fontSize: "12px",
              wordBreak: "break-word",
            }}
          >
            {user.email}
          </p>

          <LogoutButton />
        </div>
      </aside>

      <section
        style={{
          minWidth: 0,
          padding: "32px",
        }}
      >
        {children}
      </section>
    </div>
  );
}