import React from "react";
import Link from "next/link";
import {
  Cpu,
  Sun,
  AlertTriangle,
  PackageCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
} from "lucide-react";
import { Github } from "@/components/ui/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              WorkPilot
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-400/20">
                Agent
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#architecture"
              className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Architecture
            </a>
            <a
              href="#capabilities"
              className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Capabilities
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
            >
              <span>Try Demo Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-8">
        {/* Glowing backdrop circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Single Autonomous Work Operations Agent</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Understand your work. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
            Catch what you forgot.
          </span> <br />
          Know when you&apos;re ready to release.
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          WorkPilot connects GitHub, Jira, Time Logs, and team calendars into ONE reasoning agent. It spots invisible blockers, traces unfulfilled verbal commitments, and investigates release gates — always with strict human approval.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Launch Live Demo Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-slate-200 hover:text-white text-sm font-semibold transition-all"
          >
            <Github className="w-4 h-4" />
            <span>View Architecture on GitHub</span>
          </a>
        </div>

        {/* Zero-login assurance */}
        <p className="text-xs text-slate-500 font-mono">
          ✓ No account creation required · Zero external API keys needed · Pre-seeded Demo Workspace
        </p>
      </section>

      {/* Agent Workflow Loop Visualizer */}
      <section id="architecture" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-slate-900/60 border border-white/[0.08] p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-mono uppercase font-bold text-blue-400 tracking-widest">
              Autonomous Agent Loop
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From Multi-Stream Signals to Verified Action
            </h3>
          </div>

          {/* Stepper Flow */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4">
            {[
              { step: "01", name: "Observe", desc: "Poll GitHub, Jira, Time Logs, Calendar, Slack" },
              { step: "02", name: "Analyze", desc: "Correlate tickets, PR review bottlenecks" },
              { step: "03", name: "Remember", desc: "Persistent store of past promises & habits" },
              { step: "04", name: "Decide", desc: "Select tools and synthesize operations brief" },
              { step: "05", name: "Human Sign-off", desc: "Stage consequential actions for approval" },
              { step: "06", name: "Act & Verify", desc: "Dispatch approved message or ticket" },
            ].map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.06] hover:border-blue-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400">{s.step}</span>
                  <h4 className="text-sm font-bold text-white mt-1">{s.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Architecture ASCII block */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/[0.04] text-xs font-mono text-slate-300 overflow-x-auto">
            <pre className="text-blue-300">
{`Goal → Plan → Select Tools (9 Tools) → Execute Tool → Observe → Reason → Re-plan → Verify → Recommendation → Human Approval → Action`}
            </pre>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono uppercase font-bold text-blue-400 tracking-widest">
            Core Capabilities
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            One Central AI Agent. Three Essential Work Powers.
          </h3>
          <p className="text-sm text-slate-400">
            WorkPilot is not a chatbot demo. It is an autonomous operator that runs in the background of your sprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Capability 1 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                <Sun className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Morning Work Brief</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aggregates verified accomplishments, active sprint tickets (e.g. Z10-40432), and review bottlenecks with clickable evidence drawers.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] text-xs font-mono text-slate-400 space-y-1">
              <div className="text-emerald-400">✓ Yesterday: PR #8456 verified</div>
              <div className="text-amber-400">🔴 Today: PR #8482 review pending</div>
              <div className="text-blue-300">📌 Active: Z10-40432 · Z10-36295</div>
            </div>
          </div>

          {/* Capability 2: Jira Time Log Automation */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Jira Time Log Automation</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Auto-correlates coding sessions from GitHub PRs. Tracks daily hours across Mon-Fri and syncs verified worklogs directly into Jira Cloud issues with 1 click.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] text-xs font-mono text-slate-400 space-y-1">
              <div className="text-emerald-400 font-bold">Week 40: 18.5h / 40.0h Logged</div>
              <div className="text-slate-300">Drafts: PR #8482 (1.5h) · PR #6715 (2.0h)</div>
              <div className="text-emerald-400">✓ 1-Click Sync to amla.atlassian.net</div>
            </div>
          </div>

          {/* Capability 3: AI Release Readiness Gate */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">AI Release Readiness Gate</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic release evaluation without arbitrary scores. Cross-audits sprint tickets and merged PRs, flagging architectural blast-radius risks.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] text-xs font-mono text-slate-400 space-y-1">
              <div className="text-amber-300 font-bold">STATUS: READY WITH REVIEW</div>
              <div className="text-slate-300">Jira: 14/14 Done · GitHub: 11/11 Merged</div>
              <div className="text-rose-400/90">⚠️ Blast radius: Shared nav modified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Human in the Loop Callout */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Human-In-The-Loop Enforced</span>
            </div>
            <h3 className="text-xl font-bold text-white">The agent never acts without your permission</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              WorkPilot prepares message drafts, Jira tracking tickets, and release changelogs. You inspect the exact content and click approve before anything is dispatched.
            </p>
          </div>

          <Link
            href="/dashboard/actions"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Explore Action Center
          </Link>
        </div>
      </section>

      {/* Tech Stack & Built With */}
      <section className="py-12 border-t border-white/[0.06] max-w-7xl mx-auto px-4 w-full text-center space-y-6">
        <p className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
          Engineered With
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-300">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">Next.js (App Router)</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">TypeScript (Strict Mode)</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">Tailwind CSS</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">AI Agents & Tool Calling</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">Zod Schema Validation</span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.08]">Vercel Deployable Architecture</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-slate-950/70 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WorkPilot · Autonomous AI Work Operations Agent</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white">
              Demo Workspace
            </Link>
            <Link href="/dashboard/morning-brief" className="text-slate-400 hover:text-white">
              Morning Brief
            </Link>
            <Link href="/dashboard/commitments" className="text-slate-400 hover:text-white">
              Commitments
            </Link>
            <Link href="/dashboard/releases" className="text-slate-400 hover:text-white">
              Release Gate
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
