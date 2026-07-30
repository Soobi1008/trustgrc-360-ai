import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "TrustGRC AI 360",
  description: "AI Governance, Risk and Compliance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            gridTemplateColumns: "235px 1fr",
            background: "#f4f6f8",
          }}
        >
          <Sidebar />

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}