"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ActionApprovalRequest } from "@/types";
import { ActionCard } from "@/components/actions/ActionCard";
import { ActionApprovalModal } from "@/components/actions/ActionApprovalModal";

export default function ActionCenterPage() {
  const [actions, setActions] = useState<ActionApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedAction, setSelectedAction] = useState<ActionApprovalRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/agent/actions");
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleReviewAction = (action: ActionApprovalRequest) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleDecision = async (
    actionId: string,
    decision: "approve" | "reject",
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionId, decision, notes }),
      });
      if (res.ok) {
        setNotification(
          decision === "approve"
            ? "Action approved and dispatched to target destination!"
            : "Action rejected by human operator."
        );
        setTimeout(() => setNotification(null), 3000);
        fetchActions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDraft = async (actionId: string, draftContent: string) => {
    try {
      const res = await fetch("/api/agent/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionId, draftContent }),
      });
      if (res.ok) {
        setNotification("Draft updated successfully.");
        setTimeout(() => setNotification(null), 2500);
        fetchActions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAll = async () => {
    const pending = actions.filter((a) => a.status === "pending");
    for (const act of pending) {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: act.id, decision: "approve" }),
      });
    }
    setNotification(`Approved and dispatched ${pending.length} actions.`);
    setTimeout(() => setNotification(null), 3000);
    fetchActions();
  };

  const filteredActions = actions.filter((a) => {
    if (activeTab === "all") return true;
    return a.status === activeTab;
  });

  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const approvedCount = actions.filter((a) => a.status === "approved").length;
  const rejectedCount = actions.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Human Approval & Action Center
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            WorkPilot prepares drafts and execution plans. Consequential actions require explicit human sign-off.
          </p>
        </div>

        {/* Batch Action */}
        {pendingCount > 0 && (
          <button
            onClick={handleApproveAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve All Pending ({pendingCount})</span>
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Safety Policy Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Strict Human-in-the-Loop: The AI agent has zero permissions to autonomously merge pull requests, broadcast Slack messages, or alter Jira tickets without human confirmation.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "pending"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Waiting for Approval</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "approved"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved & Executed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "rejected"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === "all"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>All ({actions.length})</span>
        </button>
      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-white/[0.06]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No actions in this queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "pending"
                ? "All staged recommendations have been reviewed by the human operator."
                : "No matching records found."}
            </p>
          </div>
        ) : (
          filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onReview={handleReviewAction}
            />
          ))
        )}
      </div>

      {/* Approval Modal */}
      <ActionApprovalModal
        isOpen={isModalOpen}
        action={selectedAction}
        onClose={() => setIsModalOpen(false)}
        onDecision={handleDecision}
        onUpdateDraft={handleUpdateDraft}
      />
    </div>
  );
}
