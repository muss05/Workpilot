"use client";

import React, { useState } from "react";
import {
  Sliders,
  Cpu,
  Clock,
  RefreshCw,
  CheckCircle2,
  Key,
  Database
} from "lucide-react";

export default function SettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState("mock");
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleResetWorkspace = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        setNotification("Workspace reset to initial demo state successfully.");
        setTimeout(() => {
          setNotification(null);
          window.location.reload();
        }, 1200);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sliders className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            WorkPilot Agent Settings
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Configure AI provider abstractions, scheduled crons, and demo workspace persistence.
        </p>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* AI Provider Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              AI Provider Abstraction
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Active: Deterministic Mock
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          WorkPilot implements a decoupled AI provider interface (<code className="font-mono text-blue-300">AIProvider</code>). If no external API keys are configured, WorkPilot uses the <code className="font-mono text-blue-300">DeterministicMockProvider</code>, ensuring instant, zero-failure demonstrations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div
            onClick={() => setSelectedProvider("mock")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedProvider === "mock"
                ? "bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-500/10"
                : "bg-slate-950/50 border-white/[0.06] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Deterministic Mock</span>
              {selectedProvider === "mock" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero latency · No API keys required</p>
          </div>

          <div
            onClick={() => setSelectedProvider("openai")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedProvider === "openai"
                ? "bg-blue-950/40 border-blue-500/50"
                : "bg-slate-950/50 border-white/[0.06] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">OpenAI (GPT-4o)</span>
              {selectedProvider === "openai" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Set OPENAI_API_KEY</p>
          </div>

          <div
            onClick={() => setSelectedProvider("anthropic")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedProvider === "anthropic"
                ? "bg-blue-950/40 border-blue-500/50"
                : "bg-slate-950/50 border-white/[0.06] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Anthropic (Claude 3.5)</span>
              {selectedProvider === "anthropic" && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Set ANTHROPIC_API_KEY</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.04] text-[11px] font-mono text-slate-400">
          <Key className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
          Security Guarantee: API keys are strictly evaluated server-side and never exposed to the client bundle.
        </div>
      </div>

      {/* Scheduled Execution Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Autonomous Scheduled Agent (Vercel Cron)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            08:30 AM Mon-Fri
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The autonomous agent loop is configured to run each weekday morning via Vercel Crons (<code className="font-mono text-blue-300">vercel.json</code>). It observes overnight pull request changes, runs commitment detection, and stages action approvals before team standup.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] text-xs font-mono text-slate-300 space-y-1">
          <div className="text-slate-500">Cron Target Endpoint:</div>
          <div className="text-blue-300">GET /api/cron/morning-brief</div>
          <div className="text-slate-500 pt-1">Schedule Expression:</div>
          <div className="text-emerald-400">30 8 * * 1-5 (At 08:30 on every day-of-week from Monday through Friday)</div>
        </div>
      </div>

      {/* Reset Demo Data Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Reset Demo Workspace
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Restore initial pre-seeded Jira tickets, GitHub PRs, pending approvals, and detected commitments. Useful for resetting after demonstrating approvals and dismissals.
        </p>

        <button
          onClick={handleResetWorkspace}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
          <span>{resetting ? "Resetting State..." : "Reset Workspace State"}</span>
        </button>
      </div>
    </div>
  );
}
