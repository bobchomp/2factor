import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "2FA Authenticator",
  description: "Personal two-factor authentication code vault.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  );
}
