"use client";

import { useRouter } from "next/navigation";

import { clearAuthentication } from "../../lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearAuthentication();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
     style={{
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #334155",
  borderRadius: "8px",
  backgroundColor: "#1e293b",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}}
    >
      Sign out
    </button>
  );
}