import type { Metadata } from "next";

import "./globals.css";
import "./homepage.css";

export const metadata: Metadata = {
  title: "TrustGRC AI 360",
  description:
    "AI Governance, Risk and Compliance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}