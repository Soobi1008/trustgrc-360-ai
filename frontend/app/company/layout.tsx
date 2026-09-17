"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import LogoutButton from "../components/LogoutButton";
import {
  type AuthUser,
  getStoredUser,
  isCompanyRole,
} from "../../lib/auth";

export default function CompanyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [
    isCheckingAccess,
    setIsCheckingAccess,
  ] = useState(true);

  useEffect(() => {
    const storedUser =
      getStoredUser();

    if (
      !storedUser ||
      !isCompanyRole(
        storedUser.role
      )
    ) {
      router.replace(
        "/login"
      );

      return;
    }

    setUser(
      storedUser
    );

    setIsCheckingAccess(
      false
    );
  }, [router]);

  if (
    isCheckingAccess ||
    !user
  ) {
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
        Checking organisation access...
      </main>
    );
  }

  const isOrganisationAdmin =
    user.role ===
    "organization_admin";

  const linkStyle = (
    active: boolean
  ): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    minHeight: "40px",
    padding: "0 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    color: active
      ? "#ffffff"
      : "#334155",
    backgroundColor: active
      ? "#0f172a"
      : "transparent",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <header
        style={{
          padding: "16px 32px",
          borderBottom:
            "1px solid #e2e8f0",
          backgroundColor:
            "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "24px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {user.full_name}
            </p>

            <p
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              {user.email}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Link
              href="/company/dashboard"
              style={linkStyle(
                pathname ===
                  "/company/dashboard"
              )}
            >
              Dashboard
            </Link>

            {isOrganisationAdmin && (
              <Link
                href="/company/organization-access"
                style={linkStyle(
                  pathname ===
                    "/company/organization-access"
                )}
              >
                Access Requests
              </Link>
            )}

            <div
              style={{
                width: "120px",
              }}
            >
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}