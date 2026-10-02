"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Sun,
  AlertCircle,
  PackageCheck,
  CheckSquare,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Database,
  Clock
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(3);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [runNotification, setRunNotification] = useState<string | null>(null);

  useEffect(() => {
    // Poll or fetch pending count
    fetch("/api/agent/actions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const pending = data.filter((a) => a.status === "pending").length;
          setPendingApprovalsCount(pending);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleRunMorningAnalysis = async () => {
    setIsRunningAgent(true);
    setRunNotification("WorkPilot agent observing GitHub, Jira, and Calendar...");
    try {
      const res = await fetch("/api/agent/morning-brief", { method: "POST" });
      if (res.ok) {
        setRunNotification("Morning analysis completed. Intelligence updated!");
        setTimeout(() => {
          setRunNotification(null);
          window.location.reload();
        }, 1200);
      }
    } catch {
      setRunNotification("Analysis failed. Please try again.");
      setTimeout(() => setRunNotification(null), 2000);
    } finally {
      setIsRunningAgent(false);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Overview", icon: Compass },
    { href: "/dashboard/morning-brief", label: "Morning Brief", icon: Sun },
    { href: "/dashboard/time-logs", label: "Jira Time Logs", icon: Clock },
    { href: "/dashboard/releases", label: "Releases", icon: PackageCheck },
    {
      href: "/dashboard/actions",
      label: "Action Center",
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { href: "/dashboard/activity", label: "Timeline", icon: Activity },
    { href: "/dashboard/integrations", label: "Integrations", icon: Layers },
    { href: "/dashboard/memory", label: "Memory", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                WorkPilot
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-400/20">
                  Agent
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Run Agent Trigger */}
          <button
            onClick={handleRunMorningAnalysis}
            disabled={isRunningAgent}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            title="Trigger agent to analyze all connected work signals"
          >
            {isRunningAgent ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Analyzing Work Streams...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Run Morning Analysis</span>
                <span className="sm:hidden">Run</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
              MG
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-medium text-slate-200 leading-none">Muskan Gupta</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lead Engineer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Notification Toast */}
      {runNotification && (
        <div className="bg-blue-600/90 text-white text-xs py-1.5 px-4 text-center font-medium transition-all flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{runNotification}</span>
        </div>
      )}
    </header>
  );
}
