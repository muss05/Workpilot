"use client";

import React from "react";
import {
  X,
  FileText,
  Kanban,
  Calendar,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from "lucide-react";
import { Github } from "@/components/ui/icons";
import { ActionItemEvidence, SuggestedAction } from "@/types";
import { LinkedText } from "@/components/common/LinkedText";

interface EvidenceDrawerProps {
  isOpen: boolean;
  action: SuggestedAction | null;
  onClose: () => void;
  onQueueApproval?: (action: SuggestedAction) => void;
}

export function EvidenceDrawer({
  isOpen,
  action,
  onClose,
  onQueueApproval,
}: EvidenceDrawerProps) {
  if (!isOpen || !action) return null;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github":
        return <Github className="w-4 h-4 text-slate-200" />;
      case "jira":
        return <Kanban className="w-4 h-4 text-blue-400" />;
      case "calendar":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "timelog":
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case "meeting_notes":
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-white/[0.08] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">Agent Evidence Trace</h3>
                <p className="text-[11px] text-slate-400">Why WorkPilot recommended this action</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Action Summary Card */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-400/20">
                  {action.type}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    action.urgency === "high"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  {action.urgency} Urgency
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                <LinkedText text={action.title} />
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LinkedText text={action.description} />
              </p>
            </div>

            {/* Evidence items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Supporting Work Signals ({action.evidence.length})
                </h4>
              </div>

              {action.evidence.map((ev: ActionItemEvidence, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-white/[0.06] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(ev.source)}
                      <span className="text-xs font-semibold text-slate-200">{ev.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{ev.source}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-white/[0.04] leading-relaxed">
                    <LinkedText text={ev.details} />
                  </p>

                  {ev.timestamp && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Captured: {ev.timestamp}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Safety & Human in the loop guarantee */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Human-In-The-Loop Enforced</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                WorkPilot will never autonomously send messages or commit Jira changes without your explicit authorization in the Action Center.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-slate-950/60 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Close Evidence
            </button>

            {onQueueApproval && (
              <button
                onClick={() => {
                  onQueueApproval(action);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Stage for Approval</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
