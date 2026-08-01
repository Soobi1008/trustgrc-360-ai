import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          padding: "48px",
          borderRadius: "20px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 30px 70px rgba(15, 23, 42, 0.35)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#2563eb",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          TrustGRC AI 360
        </p>

        <h1
          style={{
            marginTop: "14px",
            marginBottom: "18px",
            fontSize: "46px",
            lineHeight: 1.12,
            color: "#0f172a",
          }}
        >
          Unified AI Governance, Risk and Compliance
        </h1>

        <p
          style={{
            maxWidth: "700px",
            marginBottom: "30px",
            color: "#475569",
            fontSize: "18px",
            lineHeight: 1.7,
          }}
        >
          Register AI systems, conduct governance
          assessments, identify risks, map regulatory
          obligations and monitor compliance controls from
          one secure platform.
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "13px 22px",
            borderRadius: "9px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Sign in to TrustGRC AI 360
        </Link>
      </section>
    </main>
  );
}
