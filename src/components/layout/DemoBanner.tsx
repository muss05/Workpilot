"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle2, Zap } from "lucide-react";

interface DemoBannerProps {
  onReset?: () => void;
}

interface LiveStatus {
  isLive: boolean;
  github: { connected: boolean; username: string | null };
  jira: { connected: boolean; domain: string | null; displayName: string | null };
}

export function DemoBanner({ onReset }: DemoBannerProps) {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    fetch("/api/integrations/config")
      .then((res) => res.json())
      .then((data) => setLiveStatus(data))
      .catch(() => {});
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setResetSuccess(true);
      if (onReset) onReset();
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error("Reset failed", err);
    } finally {
      setResetting(false);
    }
  };

  const isLive = liveStatus?.isLive;

  return (
    <div
      className={`w-full border-b px-4 py-2.5 text-xs transition-colors ${
        isLive
          ? "bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-blue-950/80 border-emerald-500/30 text-emerald-200"
          : "bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 border-blue-500/20 text-slate-300"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isLive ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE WORKSPACE
              </span>
              <p className="text-slate-200">
                Connected to real-time streams:{" "}
                {liveStatus?.github.connected && (
                  <span className="text-white font-semibold mr-2">
                    GitHub (@{liveStatus.github.username || "connected"})
                  </span>
                )}
                {liveStatus?.jira.connected && (
                  <span className="text-white font-semibold">
                    Jira ({liveStatus.jira.domain})
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 font-semibold uppercase tracking-wider text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                DEMO WORKSPACE
              </span>
              <p className="text-slate-300">
                Workspace signals for <span className="text-white font-medium">Muskan Gupta</span> (Amla / MRRSoft). Real Jira sprint tickets, GitHub PRs, Time Logs, and Calendar active.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLive ? (
            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 hover:text-white transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manage Live Connections</span>
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard/integrations"
                className="hidden sm:inline-flex items-center gap-1.5 text-blue-300 hover:text-white text-[11px] font-medium"
              >
                <Zap className="w-3 h-3 text-blue-400" />
                <span>Connect Live GitHub / Jira</span>
              </Link>

              <div className="h-3 w-px bg-slate-700 hidden sm:block" />

              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Reset demo data to initial pristine state"
              >
                {resetSuccess ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Reset Complete</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className={`w-3 h-3 ${resetting ? "animate-spin text-blue-400" : "text-slate-400"}`} />
                    <span>{resetting ? "Resetting..." : "Reset Demo Data"}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
