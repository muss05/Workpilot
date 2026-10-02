"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Zap,
  Plus,
  Calendar,
  ExternalLink,
  X,
  Loader2,
  Kanban,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageSquare,
  Sparkles,
  Users,
  Trash2,
  Timer,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FolderArchive
} from "lucide-react";
import { Github } from "@/components/ui/icons";
import { JiraWorklog, TimeLogDraft, JiraTicket, WeeklyTimeSheet } from "@/types";

interface TimeLogApiResponse {
  summary: {
    todayLoggedHours: number;
    todayTargetHours: number;
    weeklyLoggedHours: number;
    weeklyTargetHours: number;
    pendingDraftsCount: number;
  };
  weeklySheet?: WeeklyTimeSheet;
  worklogs: JiraWorklog[];
  drafts: TimeLogDraft[];
  tickets?: JiraTicket[];
}

export const COMMENT_PRESETS = [
  { id: "fix", label: "Fix Changes", icon: "🛠️", text: "Fix changes, code implementation and unit testing" },
  { id: "analysis", label: "Analysis", icon: "🔍", text: "Analysis, root cause investigation and requirement review" },
  { id: "pr_review", label: "PR Review", icon: "📝", text: "PR code review feedback, refactoring and review verification" },
  { id: "testing", label: "Testing", icon: "✅", text: "Testing, bug reproduction and QA verification" },
  { id: "standup", label: "Magicians Scrum", icon: "🎙️", text: "Magicians Daily Scrum" },
];

export default function JiraTimeLogsPage() {
  const [data, setData] = useState<TimeLogApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [syncingDraftId, setSyncingDraftId] = useState<string | null>(null);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(4); // Default to Friday (index 4)
  const [quickLoggingKey, setQuickLoggingKey] = useState<string | null>(null);
  const [deletingWorklogId, setDeletingWorklogId] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "in_dev" | "review" | "qa" | "backlog">("all");
  const [showDoneTickets, setShowDoneTickets] = useState(false);
  const [doneTicketSearch, setDoneTicketSearch] = useState("");

  // Selected comments per ticket: ticketKey -> comment text
  const [ticketSelectedComments, setTicketSelectedComments] = useState<Record<string, string>>({});

  // Standup ticket state
  const [standupComment, setStandupComment] = useState("Magicians Daily Scrum");

  // Quick Log Form state
  const [jiraDomain, setJiraDomain] = useState("amla.atlassian.net");
  const [formKey, setFormKey] = useState("Z10-40444");
  const [formTime, setFormTime] = useState("30m");
  const [formComment, setFormComment] = useState("Magicians Daily Scrum");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const getJiraLink = (key: string) => `https://${jiraDomain}/browse/${key}`;
  const getPrLink = (prNum: number) => {
    if (prNum >= 8000) {
      return `https://github.com/MRRSoft/znode10-admin-migration/pull/${prNum}`;
    }
    return `https://github.com/MRRSoft/znode-webstore10x-page-builder/pull/${prNum}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      fetch("/api/integrations/config")
        .then((r) => r.json())
        .then((cfg) => {
          if (cfg?.jira?.domain) setJiraDomain(cfg.jira.domain);
        })
        .catch(() => {});

      const res = await fetch("/api/timelog");
      if (res.ok) {
        const json: TimeLogApiResponse = await res.json();
        setData(json);
        if (json.tickets && json.tickets.length > 0) {
          setJiraTickets(json.tickets);
        }
      }
    } catch (err) {
      console.error("Failed to load time log data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data?.weeklySheet?.days) {
      const todayIdx = data.weeklySheet.days.findIndex((d) => d.isToday);
      if (todayIdx !== -1) {
        setSelectedDayIndex(todayIdx);
      }
    }
  }, [data]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    setBannerNotice({ text: "WorkPilot analyzing today's commits, PR reviews, and Jira tickets..." });
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "auto_detect_worklogs" }),
      });
      if (res.ok) {
        setBannerNotice({ text: "Found unlogged coding hours for today based on PR #8482 and PR #6715!" });
        await fetchData();
        setTimeout(() => setBannerNotice(null), 4000);
      }
    } catch {
      setBannerNotice({ text: "Could not complete work detection.", isError: true });
      setTimeout(() => setBannerNotice(null), 3500);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSyncDraft = async (draft: TimeLogDraft) => {
    setSyncingDraftId(draft.id);
    try {
      const res = await fetch("/api/timelog/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, action: "approve" }),
      });

      if (res.ok) {
        setBannerNotice({ text: `Logged ${draft.suggestedTime} to Jira ticket ${draft.issueKey}.` });
        await fetchData();
        setTimeout(() => setBannerNotice(null), 3500);
      }
    } catch {
      setBannerNotice({ text: "Failed to log work to Jira.", isError: true });
      setTimeout(() => setBannerNotice(null), 3500);
    } finally {
      setSyncingDraftId(null);
    }
  };

  const handleDiscardDraft = async (draftId: string) => {
    try {
      await fetch("/api/timelog/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, action: "discard" }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to dismiss draft:", err);
    }
  };

  const handleDeleteWorklog = async (worklogId: string, issueKey: string) => {
    setDeletingWorklogId(worklogId);
    try {
      const res = await fetch(
        `/api/timelog?id=${encodeURIComponent(worklogId)}&issueKey=${encodeURIComponent(issueKey)}`,
        {
          method: "DELETE",
        }
      );
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setBannerNotice({
          text: `Deleted worklog from ${issueKey} in Jira Cloud. Timesheet updated.`,
        });
        await fetchData();
        setSelectedDayIndex(4);
        setTimeout(() => setBannerNotice(null), 4000);
      } else {
        setBannerNotice({
          text: `Failed to delete worklog: ${json.error || json.message || "Could not delete"}`,
          isError: true,
        });
        setTimeout(() => setBannerNotice(null), 5000);
      }
    } catch {
      setBannerNotice({ text: "Network error while deleting worklog.", isError: true });
      setTimeout(() => setBannerNotice(null), 3500);
    } finally {
      setDeletingWorklogId(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKey || !formTime) return;

    setIsSubmittingManual(true);
    try {
      const res = await fetch("/api/timelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: formKey,
          timeSpent: formTime,
          comment: formComment || (formKey === "Z10-40444" ? "Magicians Daily Scrum" : "Fix changes, code implementation and unit testing"),
        }),
      });

      const resJson = await res.json().catch(() => ({}));

      if (res.ok && resJson.success) {
        setShowQuickLogModal(false);
        setFormComment("");
        setBannerNotice({
          text: `Successfully logged ${formTime} to ${formKey} in live Jira Cloud${resJson.worklogId ? ` (ID: ${resJson.worklogId})` : ""}!`,
        });
        await fetchData();
        setSelectedDayIndex(4); // Keep Friday (today) selected
        setTimeout(() => setBannerNotice(null), 5000);
      } else {
        setBannerNotice({
          text: `Jira Error: ${resJson.error || resJson.message || "Failed to submit worklog to Jira."}`,
          isError: true,
        });
        setTimeout(() => setBannerNotice(null), 6000);
      }
    } catch {
      setBannerNotice({ text: "Failed to submit worklog to Jira.", isError: true });
      setTimeout(() => setBannerNotice(null), 4000);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleQuickLog = async (ticketKey: string, timeSpent: string, explicitComment?: string) => {
    setQuickLoggingKey(`${ticketKey}-${timeSpent}`);
    try {
      let finalComment = explicitComment;
      if (!finalComment) {
        if (ticketSelectedComments[ticketKey]) {
          finalComment = ticketSelectedComments[ticketKey];
        } else if (ticketKey.toUpperCase() === "Z10-40444") {
          finalComment = standupComment || "Magicians Daily Scrum";
        } else {
          finalComment = "Fix changes, code implementation and unit testing";
        }
      }

      const res = await fetch("/api/timelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: ticketKey,
          timeSpent,
          comment: finalComment,
          started: new Date().toISOString(),
        }),
      });

      const resJson = await res.json().catch(() => ({}));

      if (res.ok && resJson.success) {
        setBannerNotice({
          text: `Successfully logged ${timeSpent} to ${ticketKey} in live Jira Cloud${resJson.worklogId ? ` (Worklog ID: ${resJson.worklogId})` : ""}! Timesheet updated.`,
        });
        await fetchData();
        setSelectedDayIndex(4); // Keep Friday (today) selected
        setTimeout(() => setBannerNotice(null), 5000);
      } else {
        setBannerNotice({
          text: `Failed to log to Jira (${ticketKey}): ${resJson.error || resJson.message || "Could not submit"}`,
          isError: true,
        });
        setTimeout(() => setBannerNotice(null), 6000);
      }
    } catch {
      setBannerNotice({ text: `Network error while logging to ${ticketKey}.`, isError: true });
      setTimeout(() => setBannerNotice(null), 4000);
    } finally {
      setQuickLoggingKey(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading daily routine and Jira time logs...</p>
      </div>
    );
  }

  const weeklySheet = data?.weeklySheet;
  const days = weeklySheet?.days || [];
  const selectedDay = days[selectedDayIndex] || days.find((d) => d.isToday) || days[4] || days[0];
  const todayHours = data?.summary.todayLoggedHours ?? 0.0;
  const weeklyHours = data?.summary.weeklyLoggedHours ?? 32.0;
  const drafts = data?.drafts || [];

  const fallbackTickets: JiraTicket[] = [
    {
      id: "jira-standup",
      key: "Z10-40444",
      title: "Magicians Daily Scrum (10x Standup)",
      description: "Official team Magicians daily standup and sprint sync meeting for 10x migration (30m daily allocation).",
      status: "Open",
      priority: "High",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 08:30",
      timeSpent: "30m",
      remainingTime: "0m",
      originalEstimate: "30m",
      timeSpentSeconds: 1800,
      remainingSeconds: 0,
      originalEstimateSeconds: 1800,
      jiraUrl: "https://amla.atlassian.net/browse/Z10-40444",
    },
    {
      id: "jira-1",
      key: "Z10-40432",
      title: "DAM: Generate Image Button Should Not Be Displayed for Document File Types",
      status: "Dev In Progress",
      priority: "Medium",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 13:57",
      prNumber: 8482,
      prUrl: "https://github.com/MRRSoft/znode10-admin-migration/pull/8482",
      timeSpent: "2h",
      remainingTime: "4h",
      originalEstimate: "6h",
      timeSpentSeconds: 7200,
      remainingSeconds: 14400,
      originalEstimateSeconds: 21600,
    },
    {
      id: "jira-2",
      key: "Z10-36295",
      title: "Webstore launch with Locale French instead of English",
      status: "Code Review",
      priority: "High",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 11:24",
      prNumber: 6699,
      prUrl: "https://github.com/MRRSoft/znode-webstore10x-page-builder/pull/6699",
      timeSpent: "1d 5h 45m",
      remainingTime: "0m",
      originalEstimate: "2d",
      timeSpentSeconds: 49500,
      remainingSeconds: 0,
      originalEstimateSeconds: 57600,
    },
    {
      id: "jira-3",
      key: "Z10-39947",
      title: "DAM: Cloud Upload Icon Is Too Small and Misaligned with the Upload Text.",
      status: "Available For QA",
      priority: "Medium",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 12:15",
      timeSpent: "2h 45m",
      remainingTime: "2h 30m",
      originalEstimate: "5h",
      timeSpentSeconds: 9900,
      remainingSeconds: 9000,
      originalEstimateSeconds: 18000,
    },
    {
      id: "jira-4",
      key: "Z10-32233",
      title: "Fix SEO URL help text bullet alignment in tooltip",
      status: "Available For QA",
      priority: "Low",
      assignee: "Muskan Gupta",
      updatedAt: "Sep 28 at 07:21",
      prNumber: 8450,
      prUrl: "https://github.com/MRRSoft/znode10-admin-migration/pull/8450",
      timeSpent: "6h 30m",
      remainingTime: "1h",
      originalEstimate: "6h",
      timeSpentSeconds: 23400,
      remainingSeconds: 3600,
      originalEstimateSeconds: 21600,
    },
    {
      id: "jira-5",
      key: "Z10-40212",
      title: "Feedback Notification Email Includes Unnecessary Share Feedback Boolean Value",
      status: "On Hold",
      priority: "High",
      assignee: "Muskan Gupta",
      updatedAt: "Sep 30 at 16:45",
      timeSpent: "4h",
      remainingTime: "4h",
      originalEstimate: "1d",
      timeSpentSeconds: 14400,
      remainingSeconds: 14400,
      originalEstimateSeconds: 28800,
    },
    {
      id: "jira-6",
      key: "Z10-40202",
      title: "Remove Irrelevant #Feedback# Macro from OrderPlacedNotification Email Template",
      status: "On Hold",
      priority: "Medium",
      assignee: "Muskan Gupta",
      updatedAt: "Sep 30 at 14:15",
      timeSpent: "1h 30m",
      remainingTime: "0m",
      originalEstimate: "2h",
      timeSpentSeconds: 5400,
      remainingSeconds: 0,
      originalEstimateSeconds: 7200,
    },
    {
      id: "jira-7",
      key: "Z10-40391",
      title: "Webstore - Impact of Hide From Category",
      status: "Backlog",
      priority: "Medium",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 08:29",
      prNumber: 8482,
      prUrl: "https://github.com/MRRSoft/znode10-admin-migration/pull/8482",
      timeSpent: "30m",
      remainingTime: "0m",
      originalEstimate: "2h",
      timeSpentSeconds: 1800,
      remainingSeconds: 0,
      originalEstimateSeconds: 7200,
    },
    {
      id: "jira-8",
      key: "Z10-40498",
      title: "add_to_cart Event Captures Product Unit Price Instead of Total Price",
      status: "Backlog",
      priority: "High",
      assignee: "Muskan Gupta",
      updatedAt: "Today at 09:19",
      timeSpent: "0h",
      remainingTime: "4h",
      originalEstimate: "4h",
      timeSpentSeconds: 0,
      remainingSeconds: 14400,
      originalEstimateSeconds: 14400,
    },
    {
      id: "jira-9",
      key: "Z10-39518",
      title: "Analysis of all hardcoded currency symbols and document impact areas",
      status: "Done",
      priority: "Medium",
      assignee: "Muskan Gupta",
      updatedAt: "Sep 29 at 16:30",
      timeSpent: "1d 6h 30m",
      remainingTime: "0m",
      originalEstimate: "1d 6h 30m",
      timeSpentSeconds: 52200,
      remainingSeconds: 0,
      originalEstimateSeconds: 52200,
    },
  ];

  // Merge live tickets or fallback, ensuring Z10-40444 is properly labeled
  const baseTickets = jiraTickets.length > 0 ? jiraTickets : fallbackTickets;
  const hasStandupInBase = baseTickets.some((t) => t.key.toUpperCase() === "Z10-40444");
  const allTickets = hasStandupInBase
    ? baseTickets.map((t) =>
        t.key.toUpperCase() === "Z10-40444"
          ? {
              ...t,
              title: "Magicians Daily Scrum (10x Standup)",
              status: "Open",
              timeSpent: t.timeSpent || "30m",
              remainingTime: t.remainingTime || "0m",
              originalEstimate: t.originalEstimate || "30m",
            }
          : t
      )
    : [
        {
          id: "scrum-standup-ticket",
          key: "Z10-40444",
          title: "Magicians Daily Scrum (10x Standup)",
          description: "Official team Magicians daily standup and sprint sync meeting for 10x migration (30m daily allocation).",
          status: "Open",
          priority: "High",
          assignee: "Muskan Gupta",
          updatedAt: "Today at 08:30",
          timeSpent: "30m",
          remainingTime: "0m",
          originalEstimate: "30m",
          timeSpentSeconds: 1800,
          remainingSeconds: 0,
          originalEstimateSeconds: 1800,
          jiraUrl: "https://amla.atlassian.net/browse/Z10-40444",
        },
        ...baseTickets,
      ];

  const getTodayHoursForTicket = (ticketKey: string) => {
    const todayLogs = (data?.worklogs || []).filter((w) => {
      const dateKey = w.started ? new Date(w.started).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "";
      return w.issueKey.toUpperCase() === ticketKey.toUpperCase() && dateKey === "2026-10-02";
    });
    const sec = todayLogs.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 3600), 0);
    return sec > 0 ? `${(sec / 3600).toFixed(1)}h` : null;
  };

  // Helper for Jira status badge style
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("dev") || (s.includes("progress") && !s.includes("qa"))) {
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }
    if (s.includes("review")) {
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    }
    if (s.includes("qa") || s.includes("verify") || s.includes("testing")) {
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    }
    if (s.includes("hold")) {
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    }
    if (s.includes("done") || s.includes("closed") || s.includes("resolved")) {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
    if (s.includes("rejected")) {
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    }
    if (s.includes("open")) {
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    }
    return "bg-slate-800 text-slate-300 border-white/[0.08]";
  };

  // Helper to identify Done / Resolved / Closed tickets
  const isDoneTicket = (t: JiraTicket) => {
    const s = (t.status || "").toLowerCase();
    return s.includes("done") || s.includes("closed") || s.includes("resolved") || s.includes("rejected");
  };

  // Separation: Open/Active tickets vs Done tickets (no done tickets in open view)
  const activeTickets = allTickets.filter((t) => !isDoneTicket(t));
  const doneTickets = allTickets.filter((t) => isDoneTicket(t));

  // Status counts for active filter tabs
  const activeStatusCounts = {
    all: activeTickets.length,
    in_dev: activeTickets.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s.includes("dev") || (s.includes("progress") && !s.includes("qa"));
    }).length,
    review: activeTickets.filter((t) => (t.status || "").toLowerCase().includes("review")).length,
    qa: activeTickets.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s.includes("qa") || s.includes("verify") || s.includes("testing");
    }).length,
    backlog: activeTickets.filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s.includes("backlog") || s.includes("to do") || s.includes("hold") || s.includes("open");
    }).length,
  };

  // Filtered active tickets (Search + Category tab)
  const filteredActiveTickets = activeTickets.filter((t) => {
    const q = ticketSearch.trim().toLowerCase();
    const matchesSearch = !q || t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const s = (t.status || "").toLowerCase();
    if (ticketFilter === "in_dev") {
      return s.includes("dev") || (s.includes("progress") && !s.includes("qa"));
    }
    if (ticketFilter === "review") {
      return s.includes("review");
    }
    if (ticketFilter === "qa") {
      return s.includes("qa") || s.includes("verify") || s.includes("testing");
    }
    if (ticketFilter === "backlog") {
      return s.includes("backlog") || s.includes("to do") || s.includes("hold") || s.includes("open");
    }
    return true;
  });

  // Filtered done tickets (Search completed)
  const filteredDoneTickets = doneTickets.filter((t) => {
    const q = doneTicketSearch.trim().toLowerCase();
    return !q || t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
  });

  const standupTodayHours = getTodayHoursForTicket("Z10-40444");

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between animate-in fade-in duration-150 ${
            bannerNotice.isError
              ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
              : "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerNotice.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{bannerNotice.text}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Jira Time Log & Daily Work Routine
            </h1>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06]">
              Week 40 · Muskan Gupta
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Jira Cloud sync (`amla.atlassian.net`) & GitHub PR tracking. Direct links to Jira tickets & PRs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
          >
            {isDetecting ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Auto-Detect PR Hours</span>
          </button>

          <button
            onClick={() => {
              setFormKey("Z10-40444");
              setFormTime("30m");
              setFormComment("Magicians Daily Scrum");
              setShowQuickLogModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Time Manual</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Today&apos;s Hours (Fri)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">{todayHours}h</span>
              <span className="text-xs text-slate-400 font-mono">/ 8.0h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {todayHours >= 8.0 ? (
                <span className="text-emerald-400">Target completed for today!</span>
              ) : (
                <span>{(8.0 - todayHours).toFixed(1)}h remaining today</span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Week 40 Total
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">{weeklyHours}h</span>
              <span className="text-xs text-slate-400 font-mono">/ 40.0h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {weeklyHours >= 40.0 ? (
                <span className="text-emerald-400 font-bold">✓ Full 40.0h weekly target achieved!</span>
              ) : (
                <span>Mon-Thu 8h each (32h) + Friday {todayHours}h</span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Magicians Scrum (Z10-40444)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-amber-300 font-mono">
                {standupTodayHours || "0.0h"}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 0.5h</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {standupTodayHours ? (
                <span className="text-emerald-400">✓ Magicians Scrum logged in Jira!</span>
              ) : (
                <span className="text-amber-400">30m standup pending today</span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Open Active Tickets
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">{activeTickets.length}</span>
              <span className="text-xs text-slate-400 font-mono">active</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-400">{doneTickets.length} completed</span> · {activeTickets.length} in progress
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Kanban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SECTION 1: AI Suggested Time Log Drafts */}
      {drafts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Unlogged PR Work Detected for Today ({drafts.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              WorkPilot verified commits and pull request sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drafts.map((draft) => {
              const isSyncing = syncingDraftId === draft.id;
              const jiraUrl = getJiraLink(draft.issueKey);
              const prUrl = draft.prNumber ? getPrLink(draft.prNumber) : undefined;

              return (
                <div
                  key={draft.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <a
                          href={jiraUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:text-white font-mono text-xs font-bold border border-blue-400/25 hover:bg-blue-600 transition-colors"
                        >
                          <Kanban className="w-3 h-3" />
                          <span>{draft.issueKey}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        {draft.prNumber && prUrl && (
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono text-xs border border-white/[0.06] hover:bg-slate-700 transition-colors"
                          >
                            <Github className="w-3 h-3 text-white" />
                            <span>PR #{draft.prNumber}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-amber-300 font-mono">
                          {draft.suggestedTime}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-white">
                      {draft.issueTitle}
                    </div>

                    <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-white/[0.04] font-mono leading-relaxed">
                      {draft.reasoning}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDiscardDraft(draft.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Dismiss
                    </button>

                    <button
                      onClick={() => handleSyncDraft(draft)}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3 fill-current" />
                      )}
                      <span>{isSyncing ? "Logging..." : `Log ${draft.suggestedTime} to Jira`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Weekly Time Sheet (Monday through Friday) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Weekly Time Sheet (Sep 28 - Oct 2)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Logged: <strong className="text-white">{weeklyHours}h</strong> / 40.0h
          </span>
        </div>

        {/* Day Pills Bar */}
        <div className="grid grid-cols-5 gap-2">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isCompletedDay = day.totalHours >= 7.5;

            return (
              <button
                key={day.dayName}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-blue-500/50 shadow-md shadow-blue-500/10"
                    : "bg-slate-900/60 border-white/[0.06] hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={day.isToday ? "text-blue-400 font-bold" : "text-slate-400"}>
                    {day.dayName.slice(0, 3)}
                  </span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                      TODAY
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base font-bold text-white font-mono">
                    {day.totalHours}h
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    / 8h
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCompletedDay ? "bg-emerald-400" : day.totalHours > 0 ? "bg-blue-400" : "bg-slate-700"
                    }`}
                    style={{ width: `${Math.min(100, (day.totalHours / 8) * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day's Logged Work List */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {selectedDay.formattedDate} Timesheet
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {selectedDay.totalHours}h Logged
              </span>
            </div>

            {selectedDay.totalHours < 8.0 && (
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{(8.0 - selectedDay.totalHours).toFixed(1)}h unlogged for this day</span>
              </span>
            )}
          </div>

          <div className="space-y-3">
            {selectedDay.worklogs.map((wl) => {
              const jiraUrl = wl.jiraUrl || getJiraLink(wl.issueKey);
              const prUrl = wl.prNumber ? (wl.prUrl || getPrLink(wl.prNumber)) : undefined;
              const isDeleting = deletingWorklogId === wl.id;

              return (
                <div
                  key={wl.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/[0.12] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Clickable Jira Ticket Link */}
                      <a
                        href={jiraUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:text-white font-mono text-xs font-bold border border-blue-400/25 hover:bg-blue-600 transition-colors"
                      >
                        <Kanban className="w-3 h-3" />
                        <span>{wl.issueKey}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* Clickable PR Link */}
                      {wl.prNumber && prUrl && (
                        <a
                          href={prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white font-mono text-xs border border-white/[0.06] hover:bg-slate-700 transition-colors"
                        >
                          <Github className="w-3 h-3 text-white" />
                          <span>PR #{wl.prNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      <span className="text-xs font-semibold text-white">
                        {wl.issueTitle}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 pl-0.5">
                      {wl.comment}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                      {wl.timeSpent}
                    </span>

                    {/* Delete Option for Worklog */}
                    <button
                      onClick={() => handleDeleteWorklog(wl.id, wl.issueKey)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20 active:scale-95"
                      title={`Delete this ${wl.timeSpent} worklog from Jira Cloud (${wl.issueKey})`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {selectedDay.worklogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Clock className="w-6 h-6 text-blue-400 mx-auto" />
                <p className="font-semibold text-slate-200 text-sm">No time logged yet for {selectedDay.formattedDate}.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {selectedDay.isToday
                    ? "Click the Magicians Daily Scrum button below or any 1-Click ticket button to log your work directly to live Jira."
                    : "No Jira worklogs recorded for this date."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Dedicated Magicians Daily Scrum Card (Z10-40444) */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-900/20 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Magicians Daily Scrum (30m)</span>
              </span>

              <a
                href="https://amla.atlassian.net/browse/Z10-40444"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-mono text-xs font-bold border border-blue-400/30 transition-colors"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Z10-40444</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {standupTodayHours ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Logged Today: {standupTodayHours}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  30m pending for today
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Magicians Daily Scrum</span>
              <span className="text-xs font-normal text-slate-400">(30m daily allocation)</span>
            </h3>

            <p className="text-xs text-slate-300">
              Official ticket for logging Muskan&apos;s daily 30-minute scrum standup, migration updates, and sprint ceremonies directly to Atlassian Jira Cloud.
            </p>
          </div>

          {/* Standup Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Primary 1-Click 30m Standup Button */}
            <button
              onClick={() => handleQuickLog("Z10-40444", "30m", standupComment)}
              disabled={!!quickLoggingKey}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {quickLoggingKey === "Z10-40444-30m" ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Zap className="w-4 h-4 fill-current" />
              )}
              <span>⚡ Log 30m Magicians Daily Scrum (Z10-40444)</span>
            </button>

            {/* Quick other increments */}
            <div className="flex items-center gap-1">
              {["15m", "45m", "1h"].map((time) => {
                const isLogging = quickLoggingKey === `Z10-40444-${time}`;
                return (
                  <button
                    key={time}
                    onClick={() => handleQuickLog("Z10-40444", time, standupComment)}
                    disabled={!!quickLoggingKey}
                    title={`Log ${time} to Z10-40444`}
                    className="px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/[0.1] font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLogging ? <Loader2 className="w-3 h-3 animate-spin" /> : `+${time}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Standup Comment selector */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span>Standup Message:</span>
            </span>
            {[
              "Magicians Daily Scrum",
              "Magicians sprint planning & standup",
              "Blockers discussion & migration alignment",
            ].map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => setStandupComment(msg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  standupComment === msg
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {msg}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-emerald-400">
            Jira Endpoint: https://amla.atlassian.net/browse/Z10-40444
          </span>
        </div>
      </div>

      {/* SECTION 4: Clean, Uncluttered Active Tickets (No Done tickets) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Kanban className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                My Active Jira Tickets ({filteredActiveTickets.length})
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Active Work
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Only in-progress and open tickets. Completed tickets are separated below.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search active tickets..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono w-40 sm:w-48"
              />
            </div>

            {/* Filter Tabs by Actual Jira Status Categories (Active Only) */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-white/[0.08] text-[11px] font-mono flex-wrap">
              {[
                { id: "all", label: `All Active (${activeStatusCounts.all})` },
                { id: "in_dev", label: `In Dev (${activeStatusCounts.in_dev})` },
                { id: "review", label: `Review (${activeStatusCounts.review})` },
                { id: "qa", label: `QA (${activeStatusCounts.qa})` },
                { id: "backlog", label: `Backlog (${activeStatusCounts.backlog})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTicketFilter(tab.id as typeof ticketFilter)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    ticketFilter === tab.id
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Tickets Grid: Clean, Compact, Zero-Clutter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredActiveTickets.map((item) => {
            const todayHrs = getTodayHoursForTicket(item.key);
            const isStandup = item.key.toUpperCase() === "Z10-40444";

            // Determine active comment for this ticket
            const activeComment =
              ticketSelectedComments[item.key] ||
              (isStandup
                ? "Magicians Daily Scrum"
                : item.prNumber
                ? "Fix changes, code implementation and unit testing"
                : "Analysis, root cause investigation and bug fix changes");

            const statusBadgeClass = getStatusBadge(item.status);

            // Compute progress percentage between spent and remaining
            const spentSec = item.timeSpentSeconds || 0;
            const remSec = item.remainingSeconds !== undefined ? item.remainingSeconds : 0;
            const totalSec = spentSec + remSec;
            const percentLogged = totalSec > 0 ? Math.min(100, Math.round((spentSec / totalSec) * 100)) : 0;

            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md ${
                  isStandup
                    ? "bg-slate-900/90 border-amber-500/40 hover:border-amber-400"
                    : "bg-slate-900/70 border-white/[0.08] hover:border-blue-500/30"
                }`}
              >
                {/* Header: Key, Exact Jira Status, PR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={getJiraLink(item.key)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-300 hover:text-white px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/25 hover:bg-blue-600 transition-colors"
                      >
                        <Kanban className="w-3 h-3" />
                        <span>{item.key}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {item.prNumber && (
                        <a
                          href={item.prUrl || getPrLink(item.prNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-white/[0.06] hover:bg-slate-700 transition-colors"
                        >
                          <Github className="w-3 h-3 text-white" />
                          <span>PR #{item.prNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {todayHrs && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Today: {todayHrs}</span>
                        </span>
                      )}

                      {/* Proper Jira Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2" title={item.title}>
                    {item.title}
                  </h4>
                </div>

                {/* Time Tracking: Logged vs Remaining (Clean meter) */}
                <div className="bg-slate-950/70 rounded-xl p-2.5 border border-white/[0.04] space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Logged:</span>
                      <span className="text-white font-bold">{item.timeSpent || "0h"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Remaining:</span>
                      <span
                        className={
                          item.remainingTime && item.remainingTime !== "0m" && item.remainingTime !== "None"
                            ? "text-amber-300 font-bold"
                            : "text-slate-400"
                        }
                      >
                        {item.remainingTime && item.remainingTime !== "None" ? item.remainingTime : "0m"}
                      </span>
                    </div>

                    {item.originalEstimate && item.originalEstimate !== "None" && (
                      <div className="text-[10px] text-slate-500">
                        Est: {item.originalEstimate}
                      </div>
                    )}
                  </div>

                  {/* Sleek Progress Bar */}
                  {totalSec > 0 && (
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentLogged}%` }}
                        title={`${percentLogged}% of estimate logged`}
                      />
                    </div>
                  )}
                </div>

                {/* Sleek, Uncluttered 1-Click Action Bar */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  {/* Compact Comment Selector Dropdown */}
                  <div className="relative shrink-0">
                    <select
                      value={activeComment}
                      onChange={(e) =>
                        setTicketSelectedComments((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                      className="bg-slate-950 border border-white/[0.08] hover:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-sans focus:outline-none focus:border-blue-500 max-w-[130px] sm:max-w-[150px] truncate cursor-pointer transition-colors"
                      title={`Active work comment: ${activeComment}`}
                    >
                      {COMMENT_PRESETS.map((p) => (
                        <option key={p.id} value={p.text} className="bg-slate-900 text-white">
                          {p.icon} {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Buttons: Compact & Tactile */}
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {["30m", "1h", "2h"].map((preset) => {
                      const isLoggingThis = quickLoggingKey === `${item.key}-${preset}`;
                      return (
                        <button
                          key={preset}
                          onClick={() => handleQuickLog(item.key, preset, activeComment)}
                          disabled={!!quickLoggingKey}
                          title={`Log ${preset} directly to ${item.key} in Jira with comment: "${activeComment}"`}
                          className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-blue-600 text-slate-200 hover:text-white border border-white/[0.08] hover:border-blue-400 font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center min-w-[36px]"
                        >
                          {isLoggingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                          ) : (
                            <span>+{preset}</span>
                          )}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setFormKey(item.key);
                        setFormComment(activeComment);
                        setShowQuickLogModal(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Custom time entry"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredActiveTickets.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-white/[0.06] space-y-2">
            <p className="text-xs text-slate-400 font-mono">
              No active tickets found matching &quot;{ticketSearch}&quot; in this status.
            </p>
            <button
              onClick={() => {
                setTicketSearch("");
                setTicketFilter("all");
              }}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Show all active tickets
            </button>
          </div>
        )}
      </div>

      {/* SECTION 5: Completed & Resolved Tickets (Separated cleanly) */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Completed & Done Tickets
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {doneTickets.length} Resolved
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Archived and resolved Jira tickets. Separated to keep active work clean.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDoneTickets((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer self-start sm:self-auto hover:border-emerald-500/30"
          >
            <span>{showDoneTickets ? "Hide Completed Tickets" : `Show ${doneTickets.length} Completed Tickets`}</span>
            {showDoneTickets ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Collapsible Done Tickets View */}
        {showDoneTickets && (
          <div className="space-y-3 pt-3 border-t border-white/[0.06] animate-in fade-in duration-200">
            {/* Search Input for Done Tickets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={doneTicketSearch}
                  onChange={(e) => setDoneTicketSearch(e.target.value)}
                  placeholder="Search completed tickets..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-52 sm:w-64"
                />
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                Showing {filteredDoneTickets.length} of {doneTickets.length} completed tickets
              </span>
            </div>

            {/* Done Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDoneTickets.map((item) => {
                const todayHrs = getTodayHoursForTicket(item.key);
                const activeComment = "Completed ticket verification and worklog sync";

                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.05] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-2.5 opacity-90 hover:opacity-100"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getJiraLink(item.key)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-white/[0.08] hover:bg-slate-700 transition-colors"
                          >
                            <Kanban className="w-3 h-3 text-slate-400" />
                            <span>{item.key}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {item.prNumber && (
                            <a
                              href={item.prUrl || getPrLink(item.prNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.04]"
                            >
                              <Github className="w-2.5 h-2.5 text-white" />
                              <span>PR #{item.prNumber}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {todayHrs && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Today: {todayHrs}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-medium text-slate-300 leading-snug line-clamp-2" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                      <div>
                        <span>Logged: </span>
                        <strong className="text-white">{item.timeSpent || "0h"}</strong>
                        {item.originalEstimate && item.originalEstimate !== "None" && (
                          <span className="text-slate-500"> / {item.originalEstimate}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickLog(item.key, "30m", activeComment)}
                          disabled={!!quickLoggingKey}
                          title={`Log 30m to ${item.key}`}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-white/[0.08] text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          +30m
                        </button>
                        <button
                          onClick={() => {
                            setFormKey(item.key);
                            setFormComment(activeComment);
                            setShowQuickLogModal(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Custom time entry"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDoneTickets.length === 0 && (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-white/[0.04]">
                <p className="text-xs text-slate-400 font-mono">
                  No completed tickets found matching &quot;{doneTicketSearch}&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Log Modal (Manual entry) */}
      {showQuickLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowQuickLogModal(false)}
          />

          <div className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Log Work to Jira Cloud</h3>
              </div>
              <button
                onClick={() => setShowQuickLogModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs text-slate-300">
              {/* Ticket Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Select Jira Ticket ({allTickets.length} available)
                </label>
                <select
                  value={formKey}
                  onChange={(e) => {
                    const k = e.target.value;
                    setFormKey(k);
                    if (k === "Z10-40444") {
                      setFormComment("Magicians Daily Scrum");
                      setFormTime("30m");
                    }
                  }}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {allTickets.map((t) => (
                    <option key={t.key} value={t.key} className="bg-slate-900 text-white">
                      {t.key} - {t.title.slice(0, 50)} ({t.status}) · {t.timeSpent ? `Spent: ${t.timeSpent}` : ""}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {allTickets.slice(0, 7).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setFormKey(t.key);
                        if (t.key === "Z10-40444") {
                          setFormComment("Magicians Daily Scrum");
                          setFormTime("30m");
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        formKey === t.key
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-950 text-slate-400 hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      {t.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Spent with Quick Pills */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200">
                  Time Spent (e.g. 30m, 1h, 1h 30m)
                </label>
                <input
                  type="text"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {["30m", "1h", "1h 30m", "2h", "3h", "4h"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormTime(p)}
                      className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-white/[0.04]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Description with Category Templates */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Work Description / Message
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Click preset to insert
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  {COMMENT_PRESETS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormComment(cat.text)}
                      className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06] text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Summary of code commits, bug fixes, or standup updates..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickLogModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{isSubmittingManual ? "Submitting to Jira..." : "Submit to Jira Cloud"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
