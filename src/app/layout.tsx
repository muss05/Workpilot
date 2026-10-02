import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkPilot — Autonomous AI Work Operations Agent",
  description:
    "Single AI work-operations agent that helps developers understand their daily work routine, automate Jira time logging, and evaluate release readiness with human-in-the-loop approvals.",
  keywords: [
    "AI Agent",
    "Work Operations",
    "Developer Tools",
    "Release Readiness",
    "GitHub",
    "Jira",
    "Autonomous Agent",
  ],
  authors: [{ name: "Muskan Gupta" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100">
        {children}
      </body>
    </html>
  );
}
