"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/admin/users/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ?? "Failed to load user."
          );
        }

        setUser(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [params.id, router]);

  if (loading) {
    return <p>Loading user...</p>;
  }

  if (!user) {
    return <p>User not found.</p>;
  }

  return (
    <main>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1>User Details</h1>
          <p>
            View platform and organization user
            information.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              `/admin/users/${user.id}/edit`
            )
          }
          style={{
            padding: "10px 16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Edit User
        </button>
      </div>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "24px",
          backgroundColor: "#fff",
        }}
      >
        <p>
          <strong>Name:</strong>{" "}
          {user.full_name}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {user.email}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {user.role}
        </p>

        <p>
          <strong>Organization:</strong>{" "}
          {user.organization_id === null
            ? "Platform"
            : `Organization ${user.organization_id}`}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {user.is_active
            ? "Active"
            : "Inactive"}
        </p>

        <p>
          <strong>Created:</strong>{" "}
          {new Date(
            user.created_at
          ).toLocaleString()}
        </p>
      </div>
    </main>
  );
}