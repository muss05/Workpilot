"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Kanban,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { Github } from "@/components/ui/icons";
import { ActivityTimelineItem } from "@/types";

export default function ActivityTimelinePage() {
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTimeline = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleTriggerAnalysis = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/agent/morning-brief", { method: "POST" });
      await fetchTimeline();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCategoryIcon = (category: string, _tool?: string) => {
    switch (category) {
      case "github":
        return <Github className="w-4 h-4 text-slate-200" />;
      case "jira":
        return <Kanban className="w-4 h-4 text-blue-400" />;
      case "calendar":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "approval":
        return <CheckSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filter === "all") return true;
    return act.category === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Agent Activity Timeline
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time chronological execution trace of WorkPilot autonomous tool calls, reasoning steps, and human approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerAnalysis}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Agent Executing Tools..." : "Trigger Agent Run"}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "all" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          All Activity ({activities.length})
        </button>
        <button
          onClick={() => setFilter("agent")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "agent" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Agent Operations
        </button>
        <button
          onClick={() => setFilter("github")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "github" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          GitHub
        </button>
        <button
          onClick={() => setFilter("jira")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "jira" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Jira
        </button>
        <button
          onClick={() => setFilter("calendar")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "calendar" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setFilter("approval")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === "approval" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Human Approvals
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l border-white/[0.08] ml-4 md:ml-6 space-y-8 pl-6 md:pl-8 py-2">
        {filteredActivities.map((act) => (
          <div key={act.id} className="relative group">
            {/* Timeline Pin */}
            <div className="absolute -left-[35px] md:-left-[43px] top-1.5 h-6 w-6 rounded-full bg-slate-950 border border-white/[0.15] flex items-center justify-center group-hover:border-blue-400 transition-colors shadow-sm">
              {getCategoryIcon(act.category, act.toolUsed)}
            </div>

            {/* Content Card */}
            <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-blue-500/30 transition-all space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {act.timeFormatted}
                  </span>
                  <h3 className="text-sm font-bold text-white">{act.title}</h3>
                  {act.toolUsed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.06]">
                      tool: {act.toolUsed}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {act.status === "warning" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Attention Flag</span>
                    </span>
                  )}
                  {act.status === "success" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/50 p-2.5 rounded-lg border border-white/[0.04]">
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
