# WorkPilot — Autonomous AI Work Operations Agent

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Agent-Human--In--The--Loop-emerald)](https://github.com)
[![Deployment](https://img.shields.io/badge/Vercel-Deployable-black?logo=vercel)](https://vercel.com)

**WorkPilot** is a single autonomous AI work operations agent designed for modern software engineering teams. It connects across fragmented developer signals — GitHub, Jira, CI/CD pipelines, calendars, and team communication transcripts — to understand work progress, detect forgotten commitments, and evaluate release readiness with verifiable evidence and strict human-in-the-loop approval.

---

## 1. Problem

Modern developers and engineering leads have their work scattered across disconnected silos:
- **Jira / Linear**: Sprint boards, QA columns, and release epics.
- **GitHub / GitLab**: Pull requests, code reviews, branch statuses, and commit diffs.
- **CI/CD Pipelines**: Automated test suites, transient failures, build durations.
- **Calendars**: Standups, design syncs, and release planning gates.
- **Slack / Email**: Verbal promises ("I will update the API docs", "I will check the test timeouts").

Context switching leads to invisible review bottlenecks, dropped commitments, and uncoordinated release deployments.

---

## 2. Solution: One Central WorkPilot Agent

Rather than building separate, fragmented chatbots, WorkPilot implements **ONE central agent** with 9 specialized tools:

```text
                           WorkPilot Agent
                                 │
     ┌──────────────┬────────────┼────────────┬──────────────┐
     │              │            │            │              │
GitHub Tool    Jira Tool   Calendar Tool   Email Tool    CI/CD Tool
     │              │            │            │              │
Memory Tool    Commitment   Release Analysis  Action Tool
               Detection
```

WorkPilot delivers three core capabilities:

1. **Morning Work Brief**: Daily operational intelligence showing yesterday's verified accomplishments, today's schedule, potential blockers, and suggested actions with a clickable **"Why?"** evidence drawer.
2. **Forgotten Commitment Detection**: Probabilistic cross-referencing of verbal agreements against Git commits and Jira cards, presenting confidence scores (e.g. 87%) and supporting evidence.
3. **AI Release Readiness Gate**: Multi-source release gate checks (Jira completed tickets, merged PRs, CI test suites, security advisories) and architectural blast-radius risk analysis (`READY`, `READY_WITH_REVIEW`, `BLOCKED`).

---

## 3. Autonomous Agent Loop

WorkPilot executes a systematic agent loop:

```text
Goal
 ↓
Plan
 ↓
Select Tools (from 9 modular tools)
 ↓
Execute Tool (with parameters)
 ↓
Observe Result (inspect structured data)
 ↓
Reason & Re-plan (synthesize multi-stream signals)
 ↓
Verify (evaluate against release & quality gates)
 ↓
Recommend (prepare evidence-backed actions)
 ↓
Human Approval (user reviews & edits draft)
 ↓
Action (dispatched to destination)
```

---

## 4. Architecture Diagram

```text
                   ┌───────────────────────────────────────┐
                   │          Work Sources & Signals       │
                   │  GitHub · Jira · Calendar · CI/CD ·   │
                   │           Slack Transcripts           │
                   └──────────────────┬────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    IntegrationAdapter     │
                        │ ┌───────────────┬───────┐ │
                        │ │ MockAdapter   │ Real  │ │
                        │ │ (Demo Active) │ (BYO) │ │
                        │ └───────────────┴───────┘ │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   WorkPilot Agent Loop    │
                        │ ┌───────────────────────┐ │
                        │ │ Plan → Select Tools   │ │
                        │ │ Execute → Observe     │ │
                        │ │ Reason → Verify       │ │
                        │ └───────────────────────┘ │
                        └─────────────┬─────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
  │  Morning Brief   │      │   Commitments    │      │  Release Health  │
  │ • Yesterday done │      │ • 87% Confidence │      │ • 14/14 Tickets  │
  │ • Today focus    │      │ • Meeting Source │      │ • 11/11 PRs      │
  │ • "Why?" Evidence│      │ • Cross-checked  │      │ • Blast Radius   │
  └─────────┬────────┘      └─────────┬────────┘      └─────────┬────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Human Approval Center   │
                        │ • Draft Message Nudges    │
                        │ • Review & Edit Drafts    │
                        │ • Approve Jira Tasks      │
                        │ • Authorize Release Notes │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Dispatched Action      │
                        │   (Logged into Memory)    │
                        └───────────────────────────┘
```

---

## 5. Strict Human-In-The-Loop Safety Policy

WorkPilot adheres to strict safety principles:
- **Never Autonomous on Consequential Actions**: The agent prepares Slack drafts, Jira tickets, and release tags, but **requires explicit human approval** before execution.
- **Draft Inspection & Editing**: Users can edit draft messages or change Jira priorities directly inside the approval modal.
- **Audit Logging**: Every approved or rejected action is recorded into the chronological Agent Activity Timeline and persistent memory.

---

## 6. Demo Mode (Zero Credentials Required)

WorkPilot includes a fully pre-seeded **Demo Workspace** simulating realistic developer signals for **Muskan Gupta** (Acme Corp):
- **Jira Tickets**: `Z10-40391` (Ready for QA, High), `Z10-40041` (In Progress), `Z10-39513` (Done).
- **GitHub PRs**: `PR #8314` (Fix widget limit validation, Open, CI Passed, Pending Review), `PR #8297` (Merged), `PR #8310` (Merged).
- **Calendar**: `11:30 AM Frontend Team Sync`, `3:00 PM Release 10.14.0.6 Planning`.
- **CI/CD**: `Build #1024` (Passed, 412/412 tests green).
- **Commitments**: "Update API documentation" (Detected with 87% confidence from Monday standup notes; cross-checked with 0 related PRs).
- **Release 10.14.0.6**: Evaluated as `READY WITH REVIEW ITEMS` due to shared navigation component modification across microfrontends.

---

## 7. AI Concepts Demonstrated

- **Agent Orchestration**: Modular 9-tool coordination and multi-step planning.
- **Structured Tool Calling**: Typed inputs and outputs using Zod schema validation.
- **Pluggable AI Provider**: `AIProvider` interface supporting OpenAI, Anthropic, or `DeterministicMockProvider` (zero latency fallback).
- **Persistent Memory**: Durable records of tracked promises, user dismissal habits, completed actions, and preferences.
- **Vercel Cron Scheduled Agents**: Morning agent triggering via standard cron expressions (`30 8 * * 1-5`).
- **Verifiable Reasoning**: Action recommendations accompanied by verifiable "Why?" data traces.

---

## 8. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & custom glassmorphism
- **Icons**: Lucide React
- **Validation**: Zod
- **Deployment**: Vercel-ready with edge cron support

---

## 9. Local Development

### Prerequisites
- Node.js >= 18.17 (Node 20+ recommended)
- npm >= 9

### Quick Start

1. Clone or navigate to the repository:
   ```bash
   cd workpilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Environment Variables (`.env.example`)

WorkPilot works **out of the box in Demo Mode** with zero environment variables. To connect live services:

```bash
# AI Provider (mock | openai | anthropic)
AI_PROVIDER=mock
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Live Work Integrations (Optional)
GITHUB_ACCESS_TOKEN=
JIRA_API_TOKEN=
JIRA_DOMAIN=

# Vercel Cron Security
CRON_SECRET=
```

---

## 11. Vercel Deployment

Deploying WorkPilot to Vercel requires no external databases or paid API keys:

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Leave environment variables empty to run in Demo Mode.
4. Click **Deploy**. Vercel will automatically build the Next.js App Router project and register the `/api/cron/morning-brief` cron schedule specified in `vercel.json`.

---

## 12. Future Roadmap

- Real GitHub OAuth App with live PR webhook handlers.
- Atlassian Jira Connect integration with bi-directional transitions.
- Slack & Microsoft Teams bot integrations for automated approval notifications.
- Persistent vector embeddings store for semantic transcript search.
- Event-driven CI/CD failure analysis with automatic regression blaming.

---

## License

MIT © 2026 WorkPilot
