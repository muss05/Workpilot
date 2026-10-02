"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  MessageSquare,
  Kanban,
  PackageCheck,
  Save
} from "lucide-react";
import { ActionApprovalRequest } from "@/types";

interface ActionApprovalModalProps {
  isOpen: boolean;
  action: ActionApprovalRequest | null;
  onClose: () => void;
  onDecision: (actionId: string, decision: "approve" | "reject", notes?: string) => Promise<void>;
  onUpdateDraft?: (actionId: string, updatedDraft: string) => Promise<void>;
}

export function ActionApprovalModal({
  isOpen,
  action,
  onClose,
  onDecision,
  onUpdateDraft,
}: ActionApprovalModalProps) {
  if (!isOpen || !action) return null;

  return (
    <ActionApprovalModalDialog
      key={action.id}
      action={action}
      onClose={onClose}
      onDecision={onDecision}
      onUpdateDraft={onUpdateDraft}
    />
  );
}

function ActionApprovalModalDialog({
  action,
  onClose,
  onDecision,
  onUpdateDraft,
}: {
  action: ActionApprovalRequest;
  onClose: () => void;
  onDecision: (actionId: string, decision: "approve" | "reject", notes?: string) => Promise<void>;
  onUpdateDraft?: (actionId: string, updatedDraft: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(action.draftContent || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleSaveDraft = async () => {
    if (onUpdateDraft) {
      await onUpdateDraft(action.id, draftContent);
      setIsEditing(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (isEditing && onUpdateDraft) {
        await onUpdateDraft(action.id, draftContent);
      }
      await onDecision(action.id, "approve");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onDecision(action.id, "reject", rejectReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "jira":
        return <Kanban className="w-5 h-5 text-emerald-400" />;
      case "release":
        return <PackageCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <Send className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              {getTypeIcon(action.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-400/20">
                  {action.type}
                </span>
                <span className="text-[11px] text-slate-400">Target: {action.targetDestination}</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">{action.title}</h3>
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>

          {/* Draft Preview / Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Agent Prepared Draft Payload</span>
              </label>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Draft</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-blue-500/40 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                {draftContent || "(No draft preview content)"}
              </div>
            )}
          </div>

          {/* Supporting Evidence */}
          {action.evidence && action.evidence.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Evidence Rationale
              </span>
              <div className="space-y-2">
                {action.evidence.map((ev, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-950/50 border border-white/[0.04] text-xs">
                    <span className="text-blue-300 font-medium mr-2">[{ev.source}]</span>
                    <span className="text-slate-300">{ev.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection input if triggered */}
          {showRejectInput && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
              <label className="text-xs text-rose-300 font-medium">Rejection Reason (Optional):</label>
              <input
                type="text"
                placeholder="e.g., Ticket already handled or waiting on design signoff..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-900 border border-rose-500/40 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-slate-950/80 flex items-center justify-between gap-3">
          {!showRejectInput ? (
            <button
              onClick={() => setShowRejectInput(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          ) : (
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Confirm Reject</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Dispatching..." : "Approve & Dispatch"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
