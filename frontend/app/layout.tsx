import type { Metadata } from "next";
import "./globals.css";

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
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#f4f6f8",
        }}
      >
        {children}
      </body>
    </html>
  );
}