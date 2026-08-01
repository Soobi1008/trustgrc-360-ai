export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
};

const TOKEN_KEY = "trustgrc_access_token";
const USER_KEY = "trustgrc_user";

export function saveAuthentication(
  token: string,
  user: AuthUser
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    clearAuthentication();
    return null;
  }
}

export function clearAuthentication() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isPlatformRole(role: string) {
  return [
    "super_admin",
    "platform_admin",
  ].includes(role);
}

export function isCompanyRole(role: string) {
  return [
    "organization_admin",
    "compliance_officer",
    "ai_governance_officer",
    "auditor",
    "executive_viewer",
  ].includes(role);
}