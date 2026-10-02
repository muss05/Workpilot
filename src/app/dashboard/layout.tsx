import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DemoBanner } from "@/components/layout/DemoBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Demo Workspace Banner */}
      <DemoBanner />

      {/* Primary Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            WorkPilot — Autonomous AI Work Operations Agent · Built for modern engineering teams
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            DEMO WORKSPACE · Zero External API Keys Required
          </p>
        </div>
      </footer>
    </div>
  );
}
