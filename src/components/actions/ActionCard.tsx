"use client";

import React from "react";
import {
  MessageSquare,
  Kanban,
  PackageCheck,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { ActionApprovalRequest } from "@/types";

interface ActionCardProps {
  action: ActionApprovalRequest;
  onReview: (action: ActionApprovalRequest) => void;
}

export function ActionCard({ action, onReview }: ActionCardProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "message":
        return {
          label: "Message / Slack",
          icon: MessageSquare,
          color: "bg-blue-500/15 text-blue-300 border-blue-400/20",
        };
      case "jira":
        return {
          label: "Jira Task",
          icon: Kanban,
          color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
        };
      case "release":
        return {
          label: "Release Notes",
          icon: PackageCheck,
          color: "bg-purple-500/15 text-purple-300 border-purple-400/20",
        };
      default:
        return {
          label: "Action",
          icon: Send,
          color: "bg-amber-500/15 text-amber-300 border-amber-400/20",
        };
    }
  };

  const badge = getTypeBadge(action.type);
  const Icon = badge.icon;

  const isPending = action.status === "pending";
  const isApproved = action.status === "approved";
  const isRejected = action.status === "rejected";

  return (
    <div className="p-4.5 rounded-xl bg-slate-900/70 border border-white/[0.08] hover:border-blue-500/30 transition-all duration-200 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}
          >
            <Icon className="w-3 h-3" />
            <span>{badge.label}</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Target: {action.targetDestination}</span>
        </div>

        <div>
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3" />
              <span>Waiting for approval</span>
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Approved & Executed</span>
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <XCircle className="w-3 h-3" />
              <span>Rejected</span>
            </span>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white leading-snug">{action.title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{action.description}</p>
      </div>

      {action.draftContent && (
        <div className="p-3 rounded-lg bg-slate-950/80 border border-white/[0.04] text-xs font-mono text-slate-300 line-clamp-2">
          {action.draftContent}
        </div>
      )}

      <div className="pt-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Requires Human Sign-off</span>
        </div>

        <button
          onClick={() => onReview(action)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPending
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/25"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
        >
          <span>{isPending ? "Review & Approve" : "View Record"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
