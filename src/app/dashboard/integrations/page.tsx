"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Kanban,
  Calendar,
  Activity,
  Mail,
  Clock,
  ShieldCheck,
  Key,
  CheckCircle2,
  Zap,
  ExternalLink,
  Trash2,
  Loader2,
  Lock
} from "lucide-react";
import { Github } from "@/components/ui/icons";
import { Integration } from "@/types";

interface LiveConfigResponse {
  isLive: boolean;
  github: { connected: boolean; username: string | null; hasToken: boolean };
  jira: { connected: boolean; domain: string | null; email: string | null; displayName: string | null; hasToken: boolean };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [liveConfig, setLiveConfig] = useState<LiveConfigResponse | null>(null);
  const [activeModalType, setActiveModalType] = useState<"github" | "jira" | null>(null);

  // Form states
  const [githubToken, setGithubToken] = useState("");
  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");

  // Test & submit states
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      const [intRes, configRes] = await Promise.all([
        fetch("/api/integrations"),
        fetch("/api/integrations/config"),
      ]);

      if (intRes.ok) {
        const data = await intRes.json();
        setIntegrations(data.integrations);
      }
      if (configRes.ok) {
        const confData = await configRes.json();
        setLiveConfig(confData);
        if (confData.jira?.domain) setJiraDomain(confData.jira.domain);
        if (confData.jira?.email) setJiraEmail(confData.jira.email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async () => {
    if (!activeModalType) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload =
        activeModalType === "github"
          ? { type: "github", githubToken }
          : { type: "jira", jiraDomain, jiraEmail, jiraApiToken };

      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || "Connection test failed." });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network error: ${String(err)}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!activeModalType) return;
    setIsSaving(true);
    setTestResult(null);

    try {
      const payload =
        activeModalType === "github"
          ? { type: "github", githubToken }
          : { type: "jira", jiraDomain, jiraEmail, jiraApiToken };

      const res = await fetch("/api/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(data.message);
        setActiveModalType(null);
        await fetchIntegrations();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setTestResult({ success: false, message: data.error || "Failed to save configuration." });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Save error: ${String(err)}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (type: "github" | "jira") => {
    try {
      const res = await fetch(`/api/integrations/config?type=${type}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification(`Disconnected live ${type.toUpperCase()}. Switched back to demo data.`);
        setActiveModalType(null);
        await fetchIntegrations();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "github":
        return <Github className="w-5 h-5 text-white" />;
      case "jira":
        return <Kanban className="w-5 h-5 text-blue-400" />;
      case "calendar":
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case "timelog":
        return <Clock className="w-5 h-5 text-indigo-400" />;
      case "email":
        return <Mail className="w-5 h-5 text-purple-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Work Stream Integrations
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Connect live GitHub and Atlassian Jira credentials to stream real-time engineering data into WorkPilot.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.08]">
          <span
            className={`h-2 w-2 rounded-full ${
              liveConfig?.isLive ? "bg-emerald-400 animate-pulse" : "bg-blue-400"
            }`}
          />
          <span className="text-slate-300">
            {liveConfig?.isLive ? "Live Mode Active" : "Demo Workspace Active"}
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Architecture Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Pluggable Adapter Architecture (Mock vs Real APIs)</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Direct REST client integration
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          WorkPilot connects to external services through the <code className="font-mono text-blue-300">IntegrationAdapter</code> interface. You can switch between the realistic pre-seeded developer dataset and your live GitHub repositories or Jira projects with zero server restarts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-white" />
              <div>
                <div className="text-xs font-bold text-white">GitHub API</div>
                <div className="text-[11px] text-slate-400">
                  {liveConfig?.github.connected
                    ? `Live Connected (@${liveConfig.github.username})`
                    : "Running Demo Workspace"}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveModalType("github");
                setTestResult(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {liveConfig?.github.connected ? "Manage" : "Connect Live"}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Kanban className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-bold text-white">Atlassian Jira Cloud</div>
                <div className="text-[11px] text-slate-400">
                  {liveConfig?.jira.connected
                    ? `Live Connected (${liveConfig.jira.domain})`
                    : "Running Demo Workspace"}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveModalType("jira");
                setTestResult(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              {liveConfig?.jira.connected ? "Manage" : "Connect Live"}
            </button>
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((int) => {
          const isLiveConnected = int.status === "connected";

          return (
            <div
              key={int.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isLiveConnected
                  ? "bg-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "bg-slate-900/70 border-white/[0.08] hover:border-blue-500/30"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/[0.08]">
                    {getIntegrationIcon(int.type)}
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      isLiveConnected
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                        : "bg-blue-500/15 text-blue-300 border-blue-400/20"
                    }`}
                  >
                    {isLiveConnected ? "LIVE CONNECTED" : "DEMO MODE"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{int.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {int.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Items Monitored:</span>
                  <span className="text-white font-bold">{int.itemCount}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Last Polled:</span>
                  <span>Just now</span>
                </div>

                {int.type === "github" || int.type === "jira" ? (
                  <button
                    onClick={() => {
                      setActiveModalType(int.type as "github" | "jira");
                      setTestResult(null);
                    }}
                    className={`w-full mt-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isLiveConnected
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-white/[0.06]"
                    }`}
                  >
                    {isLiveConnected ? "Configure Live Settings" : "Connect Real Data"}
                  </button>
                ) : (
                  <div className="w-full mt-2 py-1.5 text-center text-[11px] text-slate-500 bg-slate-950/50 rounded-lg border border-white/[0.04]">
                    Demo Workspace Stream Active
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GitHub Connect Modal */}
      {activeModalType === "github" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveModalType(null)}
          />

          <div className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <Github className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">Connect Real GitHub API</h3>
              </div>
              <button
                onClick={() => setActiveModalType(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                Enter your GitHub Personal Access Token (classic or fine-grained) to fetch your live pull requests, branch CI statuses, and review requests.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-slate-950 border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Required scopes: <code className="text-blue-300 font-mono">repo</code> or <code className="text-blue-300 font-mono">public_repo</code></span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Generate token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                    testResult.success
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.04] text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tokens are processed server-side only and never sent to the client browser.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              {liveConfig?.github.connected ? (
                <button
                  onClick={() => handleDisconnect("github")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !githubToken}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? "Testing..." : "Test Connection"}
                </button>

                <button
                  onClick={handleSaveConnection}
                  disabled={isSaving || !githubToken}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isSaving ? "Saving..." : "Save & Sync Live Data"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jira Connect Modal */}
      {activeModalType === "jira" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveModalType(null)}
          />

          <div className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <Kanban className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Connect Live Atlassian Jira Cloud</h3>
              </div>
              <button
                onClick={() => setActiveModalType(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                Connect your Jira Cloud instance to stream active sprint tickets, QA bottlenecks, and release candidate epics directly into WorkPilot.
              </p>

              {/* Domain Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Jira Cloud / Server Domain</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. amla.atlassian.net</span>
                </label>
                <input
                  type="text"
                  placeholder="your-company.atlassian.net"
                  value={jiraDomain}
                  onChange={(e) => setJiraDomain(e.target.value)}
                  onBlur={() => {
                    setJiraDomain((prev) => {
                      let v = prev.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
                      if (v.includes("/")) {
                        v = v.split("/")[0];
                      }
                      return v;
                    });
                  }}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Full URLs or subpaths (like <code className="text-blue-400">/jira/your-work</code>) are automatically cleaned.
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200">
                  Atlassian Account Email
                </label>
                <input
                  type="email"
                  placeholder="developer@company.com"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* API Token Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span>Atlassian API Token</span>
                  <span className="text-[10px] text-amber-400 font-normal">Use API Token, not password</span>
                </label>
                <input
                  type="password"
                  placeholder="ATATT3xFfGF0..."
                  value={jiraApiToken}
                  onChange={(e) => setJiraApiToken(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="text-[11px] text-slate-400 pt-0.5 flex justify-between items-center">
                  <span className="text-slate-500">API token is encrypted and stored locally.</span>
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Generate API token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
                    testResult.success
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              {liveConfig?.jira.connected ? (
                <button
                  onClick={() => handleDisconnect("jira")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !jiraDomain || !jiraEmail || !jiraApiToken}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? "Testing..." : "Test Connection"}
                </button>

                <button
                  onClick={handleSaveConnection}
                  disabled={isSaving || !jiraDomain || !jiraEmail || !jiraApiToken}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isSaving ? "Saving..." : "Save & Sync Live Data"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
