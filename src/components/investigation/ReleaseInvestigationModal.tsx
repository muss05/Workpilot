"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { AgentInvestigationStep } from "@/types";

interface ReleaseInvestigationModalProps {
  isOpen: boolean;
  version: string;
  steps: AgentInvestigationStep[];
  onClose: () => void;
}

export function ReleaseInvestigationModal({
  isOpen,
  version,
  steps,
  onClose,
}: ReleaseInvestigationModalProps) {
  if (!isOpen) return null;

  return (
    <ReleaseInvestigationModalDialog
      key={`${version}-${isOpen}`}
      version={version}
      steps={steps}
      onClose={onClose}
    />
  );
}

function ReleaseInvestigationModalDialog({
  version,
  steps,
  onClose,
}: {
  version: string;
  steps: AgentInvestigationStep[];
  onClose: () => void;
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(1);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsRunning(false);
          return prev;
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Agent Release Investigation
                </h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-400/20">
                  v{version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executing multi-source verification and blast-radius risk audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Tracker */}
        <div className="px-6 py-2.5 bg-blue-950/40 border-b border-blue-500/10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="text-blue-300 font-medium">
                  Autonomous agent investigating tool outputs... ({Math.min(activeStepIndex, steps.length)}/{steps.length})
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  Investigation Complete · Evidence Verified
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {steps.length} checks performed
          </span>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {steps.map((step, idx) => {
            const isVisible = idx <= activeStepIndex;
            const isCurrentlyProcessing = idx === activeStepIndex && isRunning;
            const isFinished = idx < activeStepIndex || !isRunning;

            if (!isVisible) return null;

            return (
              <div
                key={step.step}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isCurrentlyProcessing
                    ? "bg-blue-950/30 border-blue-500/40 shadow-lg shadow-blue-500/10"
                    : step.status === "warning"
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-slate-950/50 border-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isCurrentlyProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      ) : step.status === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          Step {step.step}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-white/[0.08]">
                          tool: {step.tool}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 font-medium">
                        {step.purpose}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observation / Result */}
                {isFinished && (
                  <div className="mt-3 pl-7">
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-white/[0.04] text-xs font-mono text-slate-300 leading-relaxed">
                      <span className="text-slate-500 mr-2">Result:</span>
                      {step.result}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Policy verified against Production Gate thresholds</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
