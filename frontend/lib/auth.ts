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

/*
 * Authentication is intentionally stored in sessionStorage.
 *
 * Unlike localStorage, sessionStorage does not persist indefinitely
 * across browser sessions.
 *
 * IMPORTANT:
 * Browser storage is only a convenience for the frontend.
 * It must never be treated as the authoritative source for
 * permissions. The backend remains responsible for validating
 * authentication and authorization.
 */

export function saveAuthentication(
  token: string,
  user: AuthUser
) {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * Remove legacy persistent authentication.
   * This prevents an older localStorage token from continuing
   * to authenticate an administrator after this migration.
   */
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  sessionStorage.setItem(
    TOKEN_KEY,
    token
  );

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(
    TOKEN_KEY
  );
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser =
    sessionStorage.getItem(
      USER_KEY
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    ) as AuthUser;
  } catch {
    clearAuthentication();
    return null;
  }
}

export function clearAuthentication() {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * Clear both stores during the migration period.
   */
  sessionStorage.removeItem(
    TOKEN_KEY
  );

  sessionStorage.removeItem(
    USER_KEY
  );

  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

export function isPlatformRole(
  role: string
) {
  return [
    "super_admin",
    "platform_admin",
  ].includes(role);
}

export function isCompanyRole(
  role: string
) {
  return [
    "organization_admin",
    "compliance_officer",
    "ai_governance_officer",
    "auditor",
    "executive_viewer",
  ].includes(role);
}