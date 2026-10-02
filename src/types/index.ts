export type SourceType = 'github' | 'jira' | 'calendar' | 'email' | 'timelog';

export type IntegrationStatus = 'connected' | 'demo_mode' | 'disconnected';

export interface Integration {
  id: string;
  name: string;
  type: SourceType;
  status: IntegrationStatus;
  lastSyncedAt: string;
  itemCount: number;
  description: string;
  icon: string;
}

export interface JiraTicket {
  id: string;
  key: string;
  title: string;
  status: string;
  rawStatus?: string;
  statusCategory?: 'To Do' | 'In Progress' | 'Done' | string;
  priority: 'High' | 'Medium' | 'Low' | 'Critical' | string;
  assignee: string;
  updatedAt: string;
  releaseVersion?: string;
  description?: string;
  jiraUrl?: string;
  prNumber?: number;
  prUrl?: string;
  timeSpent?: string;
  timeSpentSeconds?: number;
  remainingTime?: string;
  remainingSeconds?: number;
  originalEstimate?: string;
  originalEstimateSeconds?: number;
}

export interface JiraWorklog {
  id: string;
  issueKey: string;
  issueTitle: string;
  timeSpent: string; // e.g. "2h 30m"
  timeSpentSeconds: number; // in seconds, e.g. 9000
  author: string;
  comment: string;
  started: string; // ISO date string
  source: 'manual' | 'automated_pr' | 'automated_commit' | 'suggested';
  status: 'logged' | 'pending_approval' | 'draft';
  prNumber?: number;
  jiraUrl?: string;
  prUrl?: string;
  dayOfWeek?: string;
}

export interface TimeLogDraft {
  id: string;
  issueKey: string;
  issueTitle: string;
  suggestedTime: string; // e.g. "3h 15m"
  suggestedSeconds: number;
  reasoning: string;
  confidence: number; // 0-100
  comment: string;
  started: string;
  prNumber?: number;
  branchName?: string;
  jiraUrl?: string;
  prUrl?: string;
}

export interface DayTimeLog {
  date: string;
  dayName: string;
  formattedDate: string;
  totalHours: number;
  targetHours: number;
  worklogs: JiraWorklog[];
  isToday?: boolean;
}

export interface WeeklyTimeSheet {
  weekLabel: string;
  totalLoggedHours: number;
  targetLoggedHours: number;
  days: DayTimeLog[];
}

export interface TimeLogSummary {
  todayLoggedHours: number;
  todayTargetHours: number;
  weeklyLoggedHours: number;
  weeklyTargetHours: number;
  pendingDraftsCount: number;
}

export interface GitHubPR {
  id: string;
  number: number;
  title: string;
  status: 'open' | 'merged' | 'closed';
  ciStatus?: 'passed' | 'failed' | 'running';
  reviewStatus: 'approved' | 'pending' | 'changes_requested';
  author: string;
  branch: string;
  updatedAt: string;
  url?: string;
  additions?: number;
  deletions?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  type: 'sync' | 'planning' | '1on1' | 'review';
  meetingNotesSummary?: string;
}

export interface CICDBuild {
  id: string;
  buildNumber: number;
  commitHash: string;
  branch: string;
  status: 'passed' | 'failed' | 'running';
  durationSeconds: number;
  timestamp: string;
  testsCount?: number;
  failedTestsCount?: number;
}

export interface ActionItemEvidence {
  source: SourceType | 'system' | 'meeting_notes';
  title: string;
  details: string;
  rawUrl?: string;
  timestamp?: string;
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  type: 'message' | 'jira' | 'review' | 'release' | 'calendar' | 'timelog' | 'custom';
  evidence: ActionItemEvidence[];
  defaultPayload?: Record<string, unknown>;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface MorningBrief {
  id: string;
  date: string;
  generatedAt: string;
  greeting: string;
  yesterdayAccomplishments: {
    id: string;
    text: string;
    source: SourceType;
    evidence: string;
  }[];
  todayFocus: {
    id: string;
    text: string;
    priority: 'critical' | 'high' | 'medium';
    source: SourceType;
    badge: string;
  }[];
  potentialBlockers: {
    id: string;
    title: string;
    description: string;
    severity: 'high' | 'medium';
    source: SourceType;
    evidence: string;
  }[];
  suggestedActions: SuggestedAction[];
  agentReasoning: string;
}

export interface ForgottenCommitment {
  id: string;
  title: string;
  source: string;
  createdDate: string;
  confidence: number; // 0 to 100
  evidence: string[];
  status: 'detected' | 'task_created' | 'reminded' | 'completed' | 'dismissed';
  suggestedActionTitle: string;
  relatedJiraKey?: string;
  relatedPRNumber?: number;
}

export type ReleaseOverallStatus = 'READY' | 'READY_WITH_REVIEW' | 'BLOCKED';

export interface ReleaseAudit {
  id: string;
  version: string;
  targetDate: string;
  overallStatus: ReleaseOverallStatus;
  statusSummary: string;
  jiraStatus: {
    totalTickets: number;
    completedTickets: number;
    openTickets: number;
    blockedTickets: number;
    highPriorityBugs: number;
    details: string;
  };
  githubStatus: {
    totalPRs: number;
    mergedPRs: number;
    openPRs: number;
    reviewPendingPRs: number;
    details: string;
  };
  cicdStatus?: {
    status: 'passed' | 'failed' | 'warning';
    latestBuildNumber: number;
    passedTests: number;
    totalTests: number;
    details: string;
  };
  securityStatus: {
    criticalVulnerabilities: number;
    dependencyWarnings: number;
    details: string;
  };
  potentialRisks: {
    id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    blastRadius: string;
  }[];
  investigationSteps: AgentInvestigationStep[];
  recommendedActions: {
    id: string;
    title: string;
    actionType: 'release_notes' | 'tag_release' | 'followup_ticket';
    description: string;
  }[];
}

export interface AgentInvestigationStep {
  step: number;
  tool: string;
  purpose: string;
  result: string;
  status: 'completed' | 'warning' | 'in_progress';
  timestamp: string;
}

export type ActionType = 'message' | 'jira' | 'release' | 'calendar' | 'timelog' | 'custom';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed';

export interface ActionApprovalRequest {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt?: string;
  draftContent?: string;
  targetDestination: string; // e.g., 'Slack #frontend', 'Jira Project Z10', 'GitHub Releases'
  evidence: ActionItemEvidence[];
  payload: Record<string, unknown>;
}

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  title: string;
  description: string;
  category: SourceType | 'agent' | 'approval' | 'release';
  status: 'success' | 'warning' | 'info' | 'error';
  toolUsed?: string;
}

export interface AgentMemoryItem {
  id: string;
  category: 'commitment' | 'dismissed_pattern' | 'completed_action' | 'release_record' | 'user_preference';
  title: string;
  detail: string;
  recordedAt: string;
  evidenceRef?: string;
  status?: string;
}

export interface AgentRunResult {
  goal: string;
  status: 'success' | 'partial' | 'failed';
  plan: string[];
  toolsExecuted: {
    tool: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    timestamp: string;
  }[];
  reasoning: string;
  recommendations: SuggestedAction[];
  approvalsRequested: ActionApprovalRequest[];
}
