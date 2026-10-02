"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { MorningBrief, SuggestedAction } from "@/types";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { LinkedText } from "@/components/common/LinkedText";

export default function MorningBriefPage() {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Evidence Drawer state
  const [selectedEvidenceAction, setSelectedEvidenceAction] = useState<SuggestedAction | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const fetchBrief = async () => {
    try {
      const briefRes = await fetch("/api/agent/morning-brief");
      if (briefRes.ok) setBrief(await briefRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  const handleRunAnalysis = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/agent/morning-brief", { method: "POST" });
      if (res.ok) {
        await fetchBrief();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenEvidence = (action: SuggestedAction) => {
    setSelectedEvidenceAction(action);
    setIsEvidenceOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sun className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Morning Work Brief
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous daily brief correlating Jira sprint tickets, GitHub PRs, time logs, and Calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Synthesizing Signals..." : "Re-Run Morning Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Agent Reasoning Callout */}
      {brief && (
        <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-blue-500/20 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                WorkPilot Agent Synthesis
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Generated {brief.generatedAt}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <LinkedText text={brief.agentReasoning} />
            </p>
          </div>
        </div>
      )}

      {/* Grid: 3 Pillars (Yesterday, Today, Blockers) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Yesterday */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Yesterday Verified</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {brief?.yesterdayAccomplishments.length || 0} accomplishments
            </span>
          </div>

          <div className="space-y-3">
            {brief?.yesterdayAccomplishments.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04] space-y-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <p className="text-xs font-medium text-slate-200">
                    <LinkedText text={item.text} />
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 font-mono pl-4 leading-relaxed">
                  <LinkedText text={item.evidence} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Today */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Today&apos;s Schedule & Tasks</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {brief?.todayFocus.length || 0} items
            </span>
          </div>

          <div className="space-y-3">
            {brief?.todayFocus.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.04] flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      item.priority === "critical"
                        ? "bg-rose-400 ring-2 ring-rose-400/20"
                        : item.priority === "high"
                        ? "bg-amber-400 ring-2 ring-amber-400/20"
                        : "bg-blue-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      <LinkedText text={item.text} />
                    </p>
                  </div>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.06] shrink-0">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        <div className="rounded-2xl bg-rose-950/10 border border-rose-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-bold">Potential Blockers</h3>
            </div>
            <span className="text-[10px] text-rose-300 font-mono">
              {brief?.potentialBlockers.length || 0} active
            </span>
          </div>

          <div className="space-y-3">
            {brief?.potentialBlockers.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/25 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <h4 className="text-xs font-bold text-white">
                    <LinkedText text={b.title} />
                  </h4>
                </div>
                <p className="text-xs text-slate-300 pl-5 leading-relaxed">
                  <LinkedText text={b.description} />
                </p>
                <div className="pl-5 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-white/[0.04]">
                  <span className="text-rose-400/80 font-semibold mr-1">Evidence:</span>
                  <LinkedText text={b.evidence} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Actions with "Why?" Evidence Panel */}
      <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-white">Suggested Actions</h2>
            <p className="text-xs text-slate-400">
              Every action is backed by verified data signals. Click &ldquo;Why?&rdquo; to inspect the evidence.
            </p>
          </div>

          <Link
            href="/dashboard/actions"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            <span>Go to Action Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {brief?.suggestedActions.map((action, index) => (
            <div
              key={action.id}
              className="p-5 rounded-xl bg-slate-950/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {index + 1}.
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    <LinkedText text={action.title} />
                  </h4>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      action.urgency === "high"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                    }`}
                  >
                    {action.urgency} Urgency
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-400/20">
                    {action.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <LinkedText text={action.description} />
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleOpenEvidence(action)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Why?</span>
                </button>

                <Link
                  href="/dashboard/actions"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>Authorize Action</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        action={selectedEvidenceAction}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </div>
  );
}
