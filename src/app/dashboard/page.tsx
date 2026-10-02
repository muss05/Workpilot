"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  AlertTriangle,
  PackageCheck,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Kanban,
  Activity,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  ActionApprovalRequest,
  ActivityTimelineItem,
  MorningBrief,
  ReleaseAudit,
  SuggestedAction,
  WeeklyTimeSheet,
} from "@/types";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { ReleaseInvestigationModal } from "@/components/investigation/ReleaseInvestigationModal";
import { ActionApprovalModal } from "@/components/actions/ActionApprovalModal";
import { LinkedText } from "@/components/common/LinkedText";

export default function DashboardOverviewPage() {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [release, setRelease] = useState<ReleaseAudit | null>(null);
  const [actions, setActions] = useState<ActionApprovalRequest[]>([]);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [timeLogData, setTimeLogData] = useState<{
    todayLoggedHours: number;
    weeklyLoggedHours: number;
    pendingDraftsCount: number;
  } | null>(null);
  const [weeklySheet, setWeeklySheet] = useState<WeeklyTimeSheet | null>(null);

  // Modals & Drawers state
  const [selectedEvidenceAction, setSelectedEvidenceAction] = useState<SuggestedAction | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isInvestigateOpen, setIsInvestigateOpen] = useState(false);
  const [selectedApprovalAction, setSelectedApprovalAction] = useState<ActionApprovalRequest | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [briefRes, relRes, actRes, timelineRes, timeLogRes] = await Promise.all([
        fetch("/api/agent/morning-brief"),
        fetch("/api/agent/release-analysis?version=10.14.0.6"),
        fetch("/api/agent/actions"),
        fetch("/api/activity"),
        fetch("/api/timelog"),
      ]);

      if (briefRes.ok) setBrief(await briefRes.json());
      if (relRes.ok) setRelease(await relRes.json());
      if (actRes.ok) setActions(await actRes.json());
      if (timelineRes.ok) setActivities(await timelineRes.json());
      if (timeLogRes.ok) {
        const tJson = await timeLogRes.json();
        if (tJson.summary) setTimeLogData(tJson.summary);
        if (tJson.weeklySheet) setWeeklySheet(tJson.weeklySheet);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEvidence = (action: SuggestedAction) => {
    setSelectedEvidenceAction(action);
    setIsEvidenceOpen(true);
  };

  const handleOpenApproval = (action: ActionApprovalRequest) => {
    setSelectedApprovalAction(action);
    setIsApprovalOpen(true);
  };

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
    fetchData();
  };

  const pendingActions = actions.filter((a) => a.status === "pending");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Good morning, Muskan
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Agent Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            WorkPilot connected 5 work sources and prepared your operational intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/morning-brief"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-200 transition-all hover:border-slate-700"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Full Morning Brief</span>
          </Link>
          <Link
            href="/dashboard/actions"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Approvals ({pendingActions.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sprint Tasks
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Kanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">6</span>
            <span className="text-xs text-slate-400">assigned in Jira</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Z10-40432 · Z10-36295 · Z10-40384
          </p>
        </div>

        {/* Metric 2 */}
        <Link
          href="/dashboard/time-logs"
          className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-500/30 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Time Log (Week 40)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {timeLogData?.weeklyLoggedHours ?? 32.0}h
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 40.0h</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Today (Fri): {timeLogData?.todayLoggedHours ?? 0.0}h logged · 3 PR drafts ready
          </p>
        </Link>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Pull Requests
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-300">3</span>
            <span className="text-xs text-slate-400">open on MRRSoft</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            PR #8482 · PR #6699 · PR #6715
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Staged Approvals
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">{pendingActions.length}</span>
            <span className="text-xs text-purple-400/80">awaiting sign-off</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Review nudge & time log sync queued
          </p>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Morning Brief & Potential Blockers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Brief Box */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Today&apos;s Work Brief</h2>
                  <p className="text-xs text-slate-400">{brief?.date || "Today"}</p>
                </div>
              </div>
              <Link
                href="/dashboard/morning-brief"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>View Deep Brief</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* High priority focus items */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Priority Focus For Today
              </h3>
              <div className="space-y-2.5">
                {brief?.todayFocus.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06] flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full ${
                          item.priority === "critical"
                            ? "bg-rose-400 ring-4 ring-rose-400/20"
                            : item.priority === "high"
                            ? "bg-amber-400 ring-4 ring-amber-400/20"
                            : "bg-blue-400"
                        }`}
                      />
                      <div className="text-xs font-medium text-slate-200 leading-snug">
                        <LinkedText text={item.text} />
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.06] shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Actions with "Why?" Evidence buttons */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Agent Recommendations ({brief?.suggestedActions.length || 0})
                </h3>
                <span className="text-[11px] text-slate-500">Click &apos;Why?&apos; for data trace</span>
              </div>

              <div className="space-y-3">
                {brief?.suggestedActions.map((action, i) => (
                  <div
                    key={action.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-blue-500/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {i + 1}.
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          <LinkedText text={action.title} />
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          action.urgency === "high"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {action.urgency}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      <LinkedText text={action.description} />
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleOpenEvidence(action)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30 transition-all cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3 text-blue-400" />
                        <span>Why?</span>
                      </button>

                      <Link
                        href="/dashboard/actions"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white font-medium"
                      >
                        <span>Review in Action Center</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Yesterday Recap Summary */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/[0.06] p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Yesterday&apos;s Accomplishments Verified
            </h3>
            <div className="space-y-2">
              {brief?.yesterdayAccomplishments.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <LinkedText text={item.text} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Routine & Timesheet, Release Readiness, Commitments & Agent Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Work Routine & Jira Time Sheet Card */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Weekly Jira Timesheet</h2>
                  <p className="text-[11px] text-slate-400 font-mono">Week 40 · Muskan Gupta</p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {timeLogData?.weeklyLoggedHours ?? 32.0}h / 40.0h
              </span>
            </div>

            {/* Day-by-Day Mini Pills */}
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
              {(weeklySheet?.days && weeklySheet.days.length > 0
                ? weeklySheet.days.map((d) => ({
                    day: d.dayName.slice(0, 3),
                    hrs: `${d.totalHours.toFixed(1)}h`,
                    done: d.totalHours >= 7.5,
                    today: d.isToday,
                  }))
                : [
                    { day: "Mon", hrs: "8.0h", done: true, today: false },
                    { day: "Tue", hrs: "8.0h", done: true, today: false },
                    { day: "Wed", hrs: "8.0h", done: true, today: false },
                    { day: "Thu", hrs: "8.0h", done: true, today: false },
                    { day: "Fri", hrs: "0.0h", done: false, today: true },
                  ]
              ).map((d) => (
                <div
                  key={d.day}
                  className={`p-2 rounded-lg border text-xs ${
                    d.today
                      ? "bg-blue-950/60 border-blue-500/40 text-blue-200"
                      : d.done
                      ? "bg-slate-950/60 border-white/[0.06] text-slate-300"
                      : "bg-slate-950/30 border-white/[0.03] text-slate-500"
                  }`}
                >
                  <div className={`text-[10px] ${d.today ? "font-bold text-blue-400" : "text-slate-400"}`}>
                    {d.day}
                  </div>
                  <div className="font-bold text-white text-xs mt-0.5">{d.hrs}</div>
                </div>
              ))}
            </div>

            {/* Unlogged PR Drafts Alert */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>3 PR Sessions Ready to Log</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  PR #8482 (1.5h) · PR #6699 (1.5h) · PR #6715 (2.0h)
                </p>
              </div>
              <Link
                href="/dashboard/time-logs"
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-colors"
              >
                Log to Jira
              </Link>
            </div>

            {/* Active Tickets with Direct Clickable Links */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Sprint Tickets in Routine
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <a
                  href="https://amla.atlassian.net/browse/Z10-40432"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.06] hover:border-blue-400 text-blue-300 hover:text-white flex items-center justify-between group transition-all"
                >
                  <span className="truncate">Z10-40432 (DAM)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                </a>
                <a
                  href="https://amla.atlassian.net/browse/Z10-36295"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.06] hover:border-blue-400 text-blue-300 hover:text-white flex items-center justify-between group transition-all"
                >
                  <span className="truncate">Z10-36295 (Locale)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                </a>
                <a
                  href="https://amla.atlassian.net/browse/Z10-40384"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.06] hover:border-blue-400 text-blue-300 hover:text-white flex items-center justify-between group transition-all"
                >
                  <span className="truncate">Z10-40384 (GA Price)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                </a>
                <a
                  href="https://amla.atlassian.net/browse/Z10-40391"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-950/80 border border-white/[0.06] hover:border-blue-400 text-blue-300 hover:text-white flex items-center justify-between group transition-all"
                >
                  <span className="truncate">Z10-40391 (Webstore)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                </a>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <Link
                href="/dashboard/time-logs"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>Open Full Weekly Timesheet & Routine</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Release Readiness Card */}
          {release && (
            <div className="rounded-2xl bg-slate-900/70 border border-white/[0.08] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Release Readiness</h2>
                    <p className="text-xs text-slate-400 font-mono">v{release.version}</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {release.overallStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Status summary */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {release.statusSummary}
              </p>

              {/* Signals Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">Jira Tickets</div>
                  <div className="font-bold text-white mt-1">
                    {release.jiraStatus.completedTickets} / {release.jiraStatus.totalTickets} Done
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">GitHub PRs</div>
                  <div className="font-bold text-white mt-1">
                    {release.githubStatus.mergedPRs} / {release.githubStatus.totalPRs} Merged
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">Code Reviews</div>
                  <div className="font-bold text-emerald-400 mt-1">
                    100% Approved
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                  <div className="text-slate-400 text-[11px]">Security / Risk</div>
                  <div className="font-bold text-amber-300 mt-1">
                    {release.securityStatus.dependencyWarnings} Warnings
                  </div>
                </div>
              </div>

              {/* Investigate Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setIsInvestigateOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Investigate Release</span>
                </button>

                <Link
                  href="/dashboard/releases"
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  <span>Full Release Gate</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}


          {/* Recent Agent Timeline Teaser */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Agent Operation Feed
                </h3>
              </div>
              <Link
                href="/dashboard/activity"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Full Timeline
              </Link>
            </div>

            <div className="space-y-3">
              {activities.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-[10px] text-slate-500 pt-0.5 shrink-0">
                    {item.timeFormatted}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-200">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceOpen}
        action={selectedEvidenceAction}
        onClose={() => setIsEvidenceOpen(false)}
        onQueueApproval={(act) => {
          // Navigate or open approval
          const match = actions.find((a) => a.title.includes(act.title.substring(0, 10)));
          if (match) handleOpenApproval(match);
        }}
      />

      {/* Release Investigation Modal */}
      {release && (
        <ReleaseInvestigationModal
          isOpen={isInvestigateOpen}
          version={release.version}
          steps={release.investigationSteps}
          onClose={() => setIsInvestigateOpen(false)}
        />
      )}

      {/* Action Approval Modal */}
      <ActionApprovalModal
        isOpen={isApprovalOpen}
        action={selectedApprovalAction}
        onClose={() => setIsApprovalOpen(false)}
        onDecision={handleDecision}
      />
    </div>
  );
}
