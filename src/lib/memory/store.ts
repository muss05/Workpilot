import {
  ActionApprovalRequest,
  ActivityTimelineItem,
  AgentMemoryItem,
  ForgottenCommitment,
  JiraWorklog,
  MorningBrief,
  ReleaseAudit,
  TimeLogDraft,
} from "@/types";
import { getActiveIntegrationAdapter } from "../integrations/real-adapter";

interface WorkPilotState {
  morningBrief: MorningBrief | null;
  commitments: ForgottenCommitment[];
  releases: ReleaseAudit[];
  actions: ActionApprovalRequest[];
  activity: ActivityTimelineItem[];
  memoryItems: AgentMemoryItem[];
  worklogs: JiraWorklog[];
  timeLogDrafts: TimeLogDraft[];
}

function initializeDefaultState(): WorkPilotState {
  const now = new Date();
  const timeStr = (minsAgo: number) => {
    const d = new Date(now.getTime() - minsAgo * 60 * 1000);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const initialBrief: MorningBrief = {
    id: "brief-today",
    date: now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    generatedAt: timeStr(14),
    greeting: "Good morning, Muskan. WorkPilot analyzed 5 work streams to build your daily operations brief.",
    yesterdayAccomplishments: [
      {
        id: "y-1",
        text: "PR #8482 (Z10-40432 DAM: Hide Generate Image button) pushed & verified",
        source: "github",
        evidence: "Pushed to MRRSoft/znode10-admin-migration#8482 at 13:57. Passed all CI build checks.",
      },
      {
        id: "y-2",
        text: "PR #6699 (Z10-36295 Locale Redirect Fix) code review points resolved",
        source: "github",
        evidence: "Updated MRRSoft/znode-webstore10x-page-builder#6699 for French vs English launch.",
      },
      {
        id: "y-3",
        text: "Logged 8.0h in Jira across Z10-40432, Z10-36295, and Z10-40391",
        source: "timelog",
        evidence: "Jira worklogs recorded 8.0h total for Thursday sprint tasks.",
      },
    ],
    todayFocus: [
      {
        id: "t-1",
        text: "Z10-40432 — PR #8482 ready for review by Umashankar Pardhi",
        priority: "critical",
        source: "github",
        badge: "Review Pending",
      },
      {
        id: "t-2",
        text: "Z10-40384 — PR #6715 GA cart event add-on pricing verification",
        priority: "high",
        source: "jira",
        badge: "In Progress",
      },
      {
        id: "t-3",
        text: "Z10-40391 — Webstore impact validation of Hide From Category",
        priority: "medium",
        source: "jira",
        badge: "Ready for QA",
      },
      {
        id: "t-4",
        text: "11:30 AM — Webstore & Admin Team Standup",
        priority: "medium",
        source: "calendar",
        badge: "Calendar",
      },
    ],
    potentialBlockers: [
      {
        id: "b-1",
        title: "PR #8482 pending review (Z10-40432 DAM edit)",
        description: "Branch MRRSoft/znode10-admin-migration#8482 is ready for QA. Requires code review signoff from Umashankar Pardhi.",
        severity: "high",
        source: "github",
        evidence: "GitHub PR #8482 open with verified CI pass. Waiting on review.",
      },
      {
        id: "b-2",
        title: "2.0h unlogged work detected for PR #6715 (Z10-40384)",
        description: "Pushed commits for GA cart event price calculation this morning; Jira worklog pending submission.",
        severity: "medium",
        source: "timelog",
        evidence: "GitHub PR #6715 pushed at 09:19. No Jira worklog recorded yet for today.",
      },
    ],
    suggestedActions: [
      {
        id: "sug-1",
        title: "Nudge reviewer for PR #8482 (Z10-40432 DAM Edit)",
        description: "Follow up with Umashankar Pardhi before 11:30 AM sync to unblock QA deployment.",
        urgency: "high",
        type: "message",
        evidence: [
          {
            source: "github",
            title: "PR #8482 Status",
            details: "Open on MRRSoft/znode10-admin-migration. CI passed.",
          },
          {
            source: "calendar",
            title: "Webstore & Admin Team Standup",
            details: "Sync starts at 11:30 AM.",
          },
        ],
        defaultPayload: {
          recipient: "Umashankar Pardhi",
          channel: "Slack #dev-migration",
          draftMessage: "Hi Umashankar! Quick follow up on PR #8482 (Z10-40432 Hide Generate Image button for document files) - build and CI tests are green. Could you please take a look before our 11:30 AM sync? Thanks!",
        },
        approvalStatus: "pending",
      },
      {
        id: "sug-2",
        title: "Log 1.5h work to Jira Z10-36295 (PR #6699)",
        description: "Submit detected coding time for PR #6699 (Webstore launch French locale redirect fix) to Jira.",
        urgency: "medium",
        type: "timelog",
        evidence: [
          {
            source: "github",
            title: "PR #6699 Activity",
            details: "Pushed to MRRSoft/znode-webstore10x-page-builder#6699. Changes ready to log in Jira.",
          },
        ],
        defaultPayload: {
          issueKey: "Z10-36295",
          timeSpent: "1h 30m",
          comment: "Worked on PR #6699: Locale Redirect Fix. Addressed review comments and verified build.",
        },
        approvalStatus: "pending",
      },
      {
        id: "sug-3",
        title: "Log 2.0h unlogged work to Jira Z10-40384",
        description: "Submit detected coding time for PR #6715 (GA cart event item price fix) to today's timesheet.",
        urgency: "high",
        type: "timelog",
        evidence: [
          {
            source: "github",
            title: "PR #6715 Activity",
            details: "Pushed to MRRSoft/znode-webstore10x-page-builder#6715 at 09:19. 0h logged so far today.",
          },
        ],
        defaultPayload: {
          issueKey: "Z10-40384",
          timeSpent: "2h 00m",
          comment: "Included selected add-on price in GA cart event item price tracking payload.",
        },
        approvalStatus: "pending",
      },
    ],
    agentReasoning:
      "WorkPilot correlated your active GitHub PRs (#8482, #6699, #6715) with Jira tickets. You logged 8.0h daily from Mon to Thu (32.0h total). Friday is in progress with 3 PR coding sessions ready to be logged.",
  };

  const initialCommitments: ForgottenCommitment[] = [
    {
      id: "com-1",
      title: "Update API documentation for deprecated v1 user metadata endpoints",
      source: "Team meeting notes (Monday Sprint Standup)",
      createdDate: "Monday, 9:45 AM",
      confidence: 87,
      evidence: [
        "Mentioned in meeting notes: 'Muskan will update the API docs for legacy endpoint deprecation'",
        "No matching GitHub PR found in repository 'org/api-docs' or 'org/backend'",
        "No Jira ticket created with component='Documentation' or label='api-docs'",
        "Z10-39513 code merged yesterday without accompanying markdown docs commit",
      ],
      status: "detected",
      suggestedActionTitle: "Create Jira Task & Add to Backlog",
      relatedJiraKey: "Z10-39513",
    },
    {
      id: "com-2",
      title: "Sync with DevOps on Build #1023 test runner timeout",
      source: "Slack #dev-triage channel",
      createdDate: "Yesterday, 4:45 PM",
      confidence: 76,
      evidence: [
        "Slack comment: 'I will check with DevOps if the test runner worker pool was starved during build #1023'",
        "Build #1024 succeeded shortly after, but root cause worker log remains unreviewed",
        "No Jira ticket or Slack follow-up found with DevOps lead",
      ],
      status: "detected",
      suggestedActionTitle: "Draft Slack reminder for DevOps team",
    },
    {
      id: "com-3",
      title: "Verify widget quota telemetry after PR #8297 deployment",
      source: "GitHub PR #8297 review comment",
      createdDate: "Yesterday, 2:30 PM",
      confidence: 91,
      evidence: [
        "PR comment on #8297: 'I will watch Datadog widget quota graphs post-merge'",
        "PR merged at 14:15 yesterday",
        "No Datadog or dashboard bookmark logged in memory",
      ],
      status: "detected",
      suggestedActionTitle: "Set 1-hour verification reminder",
      relatedPRNumber: 8297,
    },
  ];

  const initialActions: ActionApprovalRequest[] = [
    {
      id: "act-app-1",
      type: "message",
      title: "Follow up on PR #8314 review with Alex Rivera",
      description: "Send friendly Slack message reminder to Alex Rivera to review PR #8314 before 11:30 AM sync.",
      status: "pending",
      createdAt: timeStr(12),
      draftContent: "Hi Alex! Quick follow up on PR #8314 (Fix widget limit validation) - CI tests are all green (#1024). Could you give it a quick review before our 11:30 AM sync? Thanks!",
      targetDestination: "Slack direct message to @alex-dev",
      evidence: [
        {
          source: "github",
          title: "PR #8314 Waiting",
          details: "Pending review for 18 hours. CI is passing.",
        },
        {
          source: "calendar",
          title: "11:30 AM Team Sync",
          details: "Upcoming meeting with reviewer.",
        },
      ],
      payload: {
        recipient: "alex-dev",
        channel: "slack-dm",
        prNumber: 8314,
      },
    },
    {
      id: "act-app-2",
      type: "timelog",
      title: "Log 1.5h to Jira Z10-36295 (PR #6699 French Locale Fix)",
      description: "Submit detected coding time for PR #6699 to today's timesheet.",
      status: "pending",
      createdAt: timeStr(10),
      draftContent: "1h 30m on Z10-36295\nComment: Worked on PR #6699: Locale Redirect Fix. Addressed review comments and verified build.",
      targetDestination: "Jira Cloud (amla.atlassian.net/browse/Z10-36295)",
      evidence: [
        {
          source: "github",
          title: "PR #6699 Commits & Review Activity",
          details: "Verified push to MRRSoft/znode-webstore10x-page-builder#6699.",
        },
      ],
      payload: {
        issueKey: "Z10-36295",
        timeSpent: "1h 30m",
      },
    },
    {
      id: "act-app-3",
      type: "release",
      title: "Generate Release Notes for Release 10.14.0.6",
      description: "Compile changelog from 11 merged PRs and 14 Jira tickets for deployment staging.",
      status: "pending",
      createdAt: timeStr(8),
      draftContent: "# Release 10.14.0.6\n\n### Highlights\n- **Fix**: Widget quota boundary checks (PR #8314 / Z10-40391)\n- **Security**: Cookie SameSite strict serialization (PR #8297)\n- **Architecture**: Shared navigation layout refactor (PR #8310)\n\n### Review Items\n- Smoke test shared navigation bar across microfrontends.\n- Transitive dependency advisories acknowledged.",
      targetDestination: "GitHub Release Draft (v10.14.0.6)",
      evidence: [
        {
          source: "github",
          title: "PR #8310 & #8314 Verification",
          details: "All test suites passing. Release candidate ready.",
        },
      ],
      payload: {
        version: "10.14.0.6",
      },
    },
    {
      id: "act-app-4",
      type: "timelog",
      title: "Log 3h 15m to Jira ticket Z10-40391",
      description: "Submit verified coding time derived from GitHub PR #8314 directly to Jira worklog.",
      status: "pending",
      createdAt: timeStr(5),
      draftContent: "3h 15m spent on Z10-40391\nComment: Implemented bounds checking and unit test suites for negative quotas in widget service.",
      targetDestination: "Jira Cloud (Z10-40391 Worklog)",
      evidence: [
        {
          source: "github",
          title: "PR #8314 Activity",
          details: "4 commits pushed between 11:00 AM - 2:15 PM. 142 lines modified.",
        },
      ],
      payload: {
        issueKey: "Z10-40391",
        timeSpent: "3h 15m",
        comment: "Implemented bounds checking and unit test suites for negative quotas in widget service.",
      },
    },
  ];

  const initialActivity: ActivityTimelineItem[] = [
    {
      id: "act-1",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(15),
      title: "WorkPilot started morning analysis cycle",
      description: "Scheduled autonomous work stream observation initiated.",
      category: "agent",
      status: "info",
      toolUsed: "agent_orchestrator",
    },
    {
      id: "act-2",
      timestamp: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(14),
      title: "Checked GitHub pull requests and CI status",
      description: "Found PR #8314 open with passed CI, 0 reviews. Verified PR #8297 and #8310 merged.",
      category: "github",
      status: "success",
      toolUsed: "github_tool",
    },
    {
      id: "act-3",
      timestamp: new Date(now.getTime() - 13 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(13),
      title: "Checked Jira sprint tickets and release mapping",
      description: "Identified Z10-40391 in Ready for QA, Z10-40041 in Progress, Z10-39513 Done.",
      category: "jira",
      status: "success",
      toolUsed: "jira_tool",
    },
    {
      id: "act-4",
      timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(12),
      title: "Checked calendar events for today",
      description: "Observed 11:30 AM Frontend Sync and 3:00 PM Release 10.14.0.6 Planning.",
      category: "calendar",
      status: "info",
      toolUsed: "calendar_tool",
    },
    {
      id: "act-5",
      timestamp: new Date(now.getTime() - 11 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(11),
      title: "Potential forgotten commitment detected",
      description: "Detected commitment 'Update API documentation' from Monday notes with 87% confidence.",
      category: "agent",
      status: "warning",
      toolUsed: "commitment_tool",
    },
    {
      id: "act-6",
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      timeFormatted: timeStr(10),
      title: "Generated Morning Brief & Prepared Human Approvals",
      description: "Compiled daily brief with 3 blockers and queued 3 actions for user authorization.",
      category: "agent",
      status: "success",
      toolUsed: "action_tool",
    },
  ];

  const initialMemory: AgentMemoryItem[] = [
    {
      id: "mem-1",
      category: "commitment",
      title: "Update API documentation for v1 deprecation",
      detail: "Detected from Monday sprint meeting notes. Status: Unresolved, tracking in WorkPilot.",
      recordedAt: "Monday, 10:00 AM",
      evidenceRef: "meeting_notes_monday",
      status: "active",
    },
    {
      id: "mem-2",
      category: "release_record",
      title: "Release 10.14.0.5 Deployment Record",
      detail: "Successfully tagged and deployed to production on Friday. 0 rollbacks, 100% CI pass.",
      recordedAt: "Friday, 18:30 PM",
      status: "completed",
    },
    {
      id: "mem-3",
      category: "dismissed_pattern",
      title: "Automated renovate dependency PR bumps ignored for minor lodash patches",
      detail: "User previously dismissed automated minor bump PRs as low priority during release week.",
      recordedAt: "Last week",
      status: "active",
    },
    {
      id: "mem-4",
      category: "user_preference",
      title: "Morning Brief timing & channel preference",
      detail: "Prefers morning brief compiled at 08:30 AM before daily standup; message nudges require approval.",
      recordedAt: "Initial Setup",
      status: "active",
    },
  ];

  return {
    morningBrief: initialBrief,
    commitments: initialCommitments,
    releases: [], // Will be filled with mock adapter data
    actions: initialActions,
    activity: initialActivity,
    memoryItems: initialMemory,
    worklogs: [],
    timeLogDrafts: [],
  };
}

// Global state instance
let globalState: WorkPilotState | null = null;

export async function getState(): Promise<WorkPilotState> {
  if (!globalState) {
    globalState = initializeDefaultState();
    const adapter = getActiveIntegrationAdapter();
    const [releases, worklogs, drafts] = await Promise.all([
      adapter.getReleaseAudits(),
      adapter.getJiraWorklogs(),
      adapter.getTimeLogDrafts(),
    ]);
    globalState.releases = releases;
    globalState.worklogs = worklogs;
    globalState.timeLogDrafts = drafts;
  }
  return globalState;
}

export async function getMorningBrief(): Promise<MorningBrief> {
  const state = await getState();
  return state.morningBrief!;
}

export async function getCommitments(): Promise<ForgottenCommitment[]> {
  const state = await getState();
  return state.commitments;
}

export async function updateCommitmentStatus(
  id: string,
  status: ForgottenCommitment["status"]
): Promise<ForgottenCommitment | null> {
  const state = await getState();
  const commitment = state.commitments.find((c) => c.id === id);
  if (!commitment) return null;

  commitment.status = status;

  // Add activity log
  state.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: `Commitment status changed: ${status}`,
    description: `"${commitment.title}" updated by user to ${status}.`,
    category: "agent",
    status: status === "dismissed" ? "warning" : "success",
    toolUsed: "commitment_tool",
  });

  // If dismissed, record in memory to learn user patterns
  if (status === "dismissed") {
    state.memoryItems.unshift({
      id: `mem-${Date.now()}`,
      category: "dismissed_pattern",
      title: `Dismissed commitment: ${commitment.title}`,
      detail: `User marked this detected commitment as false positive or dismissed. WorkPilot adapts confidence.`,
      recordedAt: "Just now",
      status: "dismissed",
    });
  }

  return commitment;
}

export async function getReleases(): Promise<ReleaseAudit[]> {
  const state = await getState();
  return state.releases;
}

export async function getActions(): Promise<ActionApprovalRequest[]> {
  const state = await getState();
  return state.actions;
}

export async function approveAction(
  id: string,
  reviewerNotes?: string
): Promise<{ success: boolean; action: ActionApprovalRequest | null }> {
  const state = await getState();
  const action = state.actions.find((a) => a.id === id);
  if (!action) return { success: false, action: null };

  action.status = "approved";
  action.reviewedAt = new Date().toISOString();

  // Log execution activity
  state.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: `Human Approved: ${action.title}`,
    description: `Action authorized for execution target '${action.targetDestination}'. ${reviewerNotes ? `Notes: ${reviewerNotes}` : ""}`,
    category: "approval",
    status: "success",
    toolUsed: "action_tool",
  });

  // Add to completed memory
  state.memoryItems.unshift({
    id: `mem-${Date.now()}`,
    category: "completed_action",
    title: action.title,
    detail: `Approved and dispatched to ${action.targetDestination} at ${new Date().toLocaleTimeString()}.`,
    recordedAt: "Just now",
    status: "executed",
  });

  return { success: true, action };
}

export async function rejectAction(
  id: string,
  reason?: string
): Promise<{ success: boolean; action: ActionApprovalRequest | null }> {
  const state = await getState();
  const action = state.actions.find((a) => a.id === id);
  if (!action) return { success: false, action: null };

  action.status = "rejected";
  action.reviewedAt = new Date().toISOString();

  // Log activity
  state.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: `Human Rejected: ${action.title}`,
    description: `Action rejected by user. ${reason ? `Reason: ${reason}` : "No reason provided."}`,
    category: "approval",
    status: "warning",
    toolUsed: "action_tool",
  });

  return { success: true, action };
}

export async function updateActionDraft(
  id: string,
  newDraftContent: string
): Promise<{ success: boolean; action: ActionApprovalRequest | null }> {
  const state = await getState();
  const action = state.actions.find((a) => a.id === id);
  if (!action) return { success: false, action: null };

  action.draftContent = newDraftContent;
  return { success: true, action };
}

export async function getActivityTimeline(): Promise<ActivityTimelineItem[]> {
  const state = await getState();
  return state.activity;
}

export async function getMemoryItems(): Promise<AgentMemoryItem[]> {
  const state = await getState();
  return state.memoryItems;
}

export async function logActivity(item: Omit<ActivityTimelineItem, "id" | "timestamp" | "timeFormatted">): Promise<void> {
  const state = await getState();
  const now = new Date();
  state.activity.unshift({
    id: `act-${Date.now()}`,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...item,
  });
}

export async function resetDemoState(): Promise<void> {
  globalState = null;
  await getState();
}

export async function getJiraWorklogs(forceFresh: boolean = false): Promise<JiraWorklog[]> {
  const state = await getState();
  const adapter = getActiveIntegrationAdapter();
  if (forceFresh || state.worklogs.length === 0) {
    try {
      const freshLogs = await adapter.getJiraWorklogs();
      if (freshLogs.length > 0) {
        const cleanId = (id: string) => (id || "").replace(/^wl-/, "").trim();
        const freshIdSet = new Set(freshLogs.map((l) => cleanId(l.id)));

        // Remove any local logs that match freshLogs by ID or by same issueKey + day
        const newLocalLogs = state.worklogs.filter((l) => {
          const cId = cleanId(l.id);
          if (freshIdSet.has(cId)) return false;

          const lDate = l.started ? new Date(l.started).toISOString().slice(0, 10) : "";
          const isDuplicateInFresh = freshLogs.some((fl) => {
            const flDate = fl.started ? new Date(fl.started).toISOString().slice(0, 10) : "";
            return (
              fl.issueKey.toUpperCase() === l.issueKey.toUpperCase() &&
              flDate === lDate
            );
          });
          return !isDuplicateInFresh;
        });

        // Set state.worklogs to deduplicated list
        state.worklogs = [...newLocalLogs, ...freshLogs];
      }
    } catch {
      // keep existing
    }
  }
  return state.worklogs;
}

export async function getTimeLogDrafts(forceFresh: boolean = false): Promise<TimeLogDraft[]> {
  const state = await getState();
  const adapter = getActiveIntegrationAdapter();
  if (forceFresh || state.timeLogDrafts.length === 0) {
    try {
      const freshDrafts = await adapter.getTimeLogDrafts();
      if (freshDrafts.length > 0) {
        state.timeLogDrafts = freshDrafts;
      }
    } catch {
      // keep existing
    }
  }
  return state.timeLogDrafts;
}

export async function addJiraWorklog(
  issueKey: string,
  timeSpent: string,
  comment: string,
  started?: string
): Promise<{ success: boolean; worklogId?: string; message: string }> {
  const state = await getState();
  const adapter = getActiveIntegrationAdapter();
  const result = await adapter.addJiraWorklog(issueKey, timeSpent, comment, started);

  if (result.success) {
    const id = (result.worklogId || `wl-${Date.now()}`).replace(/^wl-/, "");
    const tickets = await adapter.getJiraTickets().catch(() => []);
    const matchingTicket = tickets.find((t) => t.key.toUpperCase() === issueKey.toUpperCase());

    // Parse timeSpent accurately
    let totalSec = 0;
    const hourMatch = timeSpent.match(/(\d+(?:\.\d+)?)\s*h/i);
    const minMatch = timeSpent.match(/(\d+)\s*m/i);
    if (hourMatch) totalSec += parseFloat(hourMatch[1]) * 3600;
    if (minMatch) totalSec += parseInt(minMatch[1], 10) * 60;
    if (!hourMatch && !minMatch) {
      const num = parseFloat(timeSpent);
      if (!isNaN(num)) totalSec = num * 3600;
    }
    const timeSpentSeconds = totalSec || 3600;

    const ticketTitle =
      matchingTicket?.title ||
      (issueKey.toUpperCase() === "Z10-40444" ? "Magicians Daily Scrum (10x Standup)" : `Jira Ticket ${issueKey}`);

    const newWorklog: JiraWorklog = {
      id,
      issueKey,
      issueTitle: ticketTitle,
      timeSpent,
      timeSpentSeconds,
      author: "Muskan Gupta",
      comment,
      started: started || new Date().toISOString(),
      source: "manual",
      status: "logged",
      prNumber: matchingTicket?.prNumber,
      prUrl: matchingTicket?.prUrl,
      jiraUrl: matchingTicket?.jiraUrl || `https://amla.atlassian.net/browse/${issueKey}`,
      dayOfWeek: "Friday",
    };

    // Filter out existing with same clean ID
    const cleanWId = (wId: string) => (wId || "").replace(/^wl-/, "").trim();
    state.worklogs = state.worklogs.filter((w) => cleanWId(w.id) !== id);
    state.worklogs.unshift(newWorklog);

    // Remove matching draft
    state.timeLogDrafts = state.timeLogDrafts.filter((d) => d.issueKey !== issueKey);

    // Log to activity timeline
    state.activity.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      title: `Logged ${timeSpent} to ${issueKey}`,
      description: `Worklog recorded in Jira: "${comment.slice(0, 80)}..."`,
      category: "agent",
      status: "success",
      toolUsed: "jira_tool",
    });
  }

  return result;
}

export async function deleteJiraWorklog(
  worklogId: string,
  issueKey?: string
): Promise<{ success: boolean; message: string }> {
  const state = await getState();
  const adapter = getActiveIntegrationAdapter();

  const cleanId = (worklogId || "").replace(/^wl-/, "").trim();
  const existingWl = state.worklogs.find(
    (w) => (w.id || "").replace(/^wl-/, "").trim() === cleanId
  );
  const targetIssueKey = issueKey || existingWl?.issueKey;

  let result = { success: true, message: "Deleted worklog." };
  if (targetIssueKey) {
    result = await adapter.deleteJiraWorklog(targetIssueKey, cleanId);
  }

  // Remove from in-memory state
  state.worklogs = state.worklogs.filter((w) => {
    const wClean = (w.id || "").replace(/^wl-/, "").trim();
    return wClean !== cleanId;
  });

  return result;
}

export async function approveTimeLogDraft(
  draftId: string
): Promise<{ success: boolean; message: string }> {
  const state = await getState();
  const draft = state.timeLogDrafts.find((d) => d.id === draftId);
  if (!draft) {
    return { success: false, message: "Draft not found." };
  }

  const result = await addJiraWorklog(
    draft.issueKey,
    draft.suggestedTime,
    draft.comment,
    draft.started
  );

  return result;
}

export async function discardTimeLogDraft(draftId: string): Promise<boolean> {
  const state = await getState();
  const initialLen = state.timeLogDrafts.length;
  state.timeLogDrafts = state.timeLogDrafts.filter((d) => d.id !== draftId);
  return state.timeLogDrafts.length < initialLen;
}
