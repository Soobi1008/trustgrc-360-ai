"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    null
  );

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
            maxWidth:
              "1100px",
            margin:
              "0 auto",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "24px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color:
                  "#0f172a",
                fontSize:
                  "14px",
                fontWeight:
                  700,
              }}
            >
              {user.full_name}
            </p>

            <p
              style={{
                margin:
                  "4px 0 0",
                color:
                  "#64748b",
                fontSize:
                  "12px",
              }}
            >
              {user.email}
            </p>
          </div>

          <div
            style={{
              width:
                "120px",
            }}
          >
            <LogoutButton />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}