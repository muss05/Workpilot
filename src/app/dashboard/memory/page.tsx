"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Brain,
  Clock,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AgentMemoryItem } from "@/types";

export default function MemoryPage() {
  const [memoryItems, setMemoryItems] = useState<AgentMemoryItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const fetchMemory = async () => {
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const data = await res.json();
        setMemoryItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "commitment":
        return {
          label: "Commitment Record",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        };
      case "dismissed_pattern":
        return {
          label: "Dismissal Pattern",
          color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        };
      case "completed_action":
        return {
          label: "Completed Action",
          color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
      case "release_record":
        return {
          label: "Release History",
          color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        };
      case "user_preference":
        return {
          label: "User Preference",
          color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        };
      default:
        return {
          label: "Memory Item",
          color: "bg-slate-800 text-slate-300 border-white/[0.08]",
        };
    }
  };

  const filteredItems = memoryItems.filter((item) => {
    const matchesFilter = filter === "all" || item.category === filter;
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Agent Persistent Memory
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            WorkPilot maintains contextual memory of past commitments, user dismissals, approved actions, and release audits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-white/[0.08] px-3.5 py-2 rounded-xl">
          <Brain className="w-4 h-4 text-purple-400" />
          <span>{memoryItems.length} Memory Records Indexed</span>
        </div>
      </div>

      {/* Explanatory architecture card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Clean Memory Layer: Separates durable state from transient reasoning. Records false positives to prevent duplicate alerts and remembers past release benchmarks.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            All Memory ({memoryItems.length})
          </button>
          <button
            onClick={() => setFilter("commitment")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "commitment" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Commitments
          </button>
          <button
            onClick={() => setFilter("dismissed_pattern")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "dismissed_pattern" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Dismissal Patterns
          </button>
          <button
            onClick={() => setFilter("completed_action")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "completed_action" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Completed Actions
          </button>
          <button
            onClick={() => setFilter("release_record")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "release_record" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Release Records
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search memory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Memory Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const badge = getCategoryBadge(item.category);
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.color}`}
                >
                  {badge.label}
                </span>

                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.recordedAt}</span>
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 font-mono mt-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-white/[0.04]">
                  {item.detail}
                </p>
              </div>

              {item.status && (
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <span>State:</span>
                  <span className="font-mono text-slate-300 capitalize">{item.status}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
