"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Kanban,
  Activity,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Github } from "@/components/ui/icons";
import { ActionApprovalRequest, ReleaseAudit } from "@/types";
import { ReleaseInvestigationModal } from "@/components/investigation/ReleaseInvestigationModal";
import { ActionApprovalModal } from "@/components/actions/ActionApprovalModal";

export default function ReleasesPage() {
  const [releases, setReleases] = useState<ReleaseAudit[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("10.14.0.6");
  const [isInvestigateOpen, setIsInvestigateOpen] = useState(false);
  const [selectedApprovalAction] = useState<ActionApprovalRequest | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadRelease() {
      try {
        const res = await fetch(`/api/agent/release-analysis?version=${selectedVersion}`);
        if (res.ok) {
          const data = await res.json();
          setReleases([data]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRelease();
  }, [selectedVersion]);

  const release = releases[0];

  const handleDecision = async (
    actionId: string,
    decision: "approve" | "reject",
    notes?: string
  ) => {
    await fetch("/api/agent/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: actionId, decision, notes }),
    });
    setNotification(`Action ${decision === "approve" ? "approved" : "rejected"} successfully.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (status: ReleaseAudit["overallStatus"]) => {
    switch (status) {
      case "READY":
        return {
          label: "READY FOR PRODUCTION",
          classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "READY_WITH_REVIEW":
        return {
          label: "READY WITH REVIEW ITEMS",
          classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: AlertTriangle,
        };
      case "BLOCKED":
        return {
          label: "RELEASE BLOCKED",
          classes: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          icon: XCircle,
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PackageCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Release Readiness Gate
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated multi-source release verification combining Jira sprint tickets, GitHub pull requests, security audits, and blast radius risk analysis.
          </p>
        </div>

        {/* Release Version Selector & Investigate Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <span className="text-slate-400">Target:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-transparent font-mono font-bold text-blue-300 focus:outline-none cursor-pointer"
            >
              <option value="10.14.0.6" className="bg-slate-900 text-white">Release 10.14.0.6 (Candidate)</option>
              <option value="10.14.0.5" className="bg-slate-900 text-white">Release 10.14.0.5 (Shipped)</option>
            </select>
          </div>

          <button
            onClick={() => setIsInvestigateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Investigate Release</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {release && (
        <>
          {/* Overall Status Banner */}
          {(() => {
            const badge = getStatusBadge(release.overallStatus);
            const Icon = badge.icon;
            return (
              <div className={`p-6 rounded-2xl border ${badge.classes} space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                        Release Evaluation Status
                      </div>
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {badge.label}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-white/[0.08] sm:pl-4">
                    <span className="text-[11px] text-slate-400">Target Production Window</span>
                    <p className="text-xs font-mono font-semibold text-white">{release.targetDate}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed pt-1">
                  {release.statusSummary}
                </p>
              </div>
            );
          })()}

          {/* 3 Multi-Source Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Jira Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Kanban className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Jira Sprint</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {release.jiraStatus.completedTickets}/{release.jiraStatus.totalTickets} Done
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Open Tickets:</span>
                  <span className="font-mono text-white">{release.jiraStatus.openTickets}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Blocked Tickets:</span>
                  <span className="font-mono text-white">{release.jiraStatus.blockedTickets}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>High-Priority Bugs:</span>
                  <span className="font-mono text-emerald-400">{release.jiraStatus.highPriorityBugs}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono pt-2 border-t border-white/[0.04]">
                {release.jiraStatus.details}
              </p>
            </div>

            {/* GitHub Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-slate-200" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">GitHub PRs</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {release.githubStatus.mergedPRs}/{release.githubStatus.totalPRs} Merged
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Open PRs:</span>
                  <span className="font-mono text-white">{release.githubStatus.openPRs}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Pending Reviews:</span>
                  <span className="font-mono text-white">{release.githubStatus.reviewPendingPRs}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Branch Integrity:</span>
                  <span className="font-mono text-emerald-400">100% Verified</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono pt-2 border-t border-white/[0.04]">
                {release.githubStatus.details}
              </p>
            </div>

            {/* Security Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Security</h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {release.securityStatus.dependencyWarnings} Warnings
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Critical CVEs:</span>
                  <span className="font-mono text-emerald-400">{release.securityStatus.criticalVulnerabilities}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Dependency Advisories:</span>
                  <span className="font-mono text-amber-300">{release.securityStatus.dependencyWarnings} (Low)</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Static Analysis:</span>
                  <span className="font-mono text-emerald-400">Passed</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono pt-2 border-t border-white/[0.04]">
                {release.securityStatus.details}
              </p>
            </div>
          </div>

          {/* Potential Risks & Blast Radius Analysis */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  Potential Risks & Blast Radius Analysis ({release.potentialRisks.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Component regression detection
              </span>
            </div>

            <div className="space-y-3">
              {release.potentialRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{risk.title}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                      {risk.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    {risk.blastRadius}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Staged Release Actions */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Recommended Release Actions</h3>
                <p className="text-xs text-slate-400">
                  Agent-prepared release steps queued for human approval.
                </p>
              </div>

              <Link
                href="/dashboard/actions"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Authorize in Action Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {release.recommendedActions.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.06] flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{act.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/actions"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Investigation Modal */}
      {release && (
        <ReleaseInvestigationModal
          isOpen={isInvestigateOpen}
          version={release.version}
          steps={release.investigationSteps}
          onClose={() => setIsInvestigateOpen(false)}
        />
      )}

      {/* Approval Modal */}
      <ActionApprovalModal
        isOpen={isApprovalOpen}
        action={selectedApprovalAction}
        onClose={() => setIsApprovalOpen(false)}
        onDecision={handleDecision}
      />
    </div>
  );
}
