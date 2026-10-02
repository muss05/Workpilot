import {
  CalendarEvent,
  GitHubPR,
  Integration,
  JiraTicket,
  JiraWorklog,
  ReleaseAudit,
  TimeLogDraft,
} from "@/types";

export interface IntegrationAdapter {
  name: string;
  isDemo: boolean;
  getIntegrations(): Promise<Integration[]>;
  getJiraTickets(): Promise<JiraTicket[]>;
  getGitHubPRs(): Promise<GitHubPR[]>;
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getReleaseAudits(): Promise<ReleaseAudit[]>;
  getJiraWorklogs(): Promise<JiraWorklog[]>;
  getTimeLogDrafts(): Promise<TimeLogDraft[]>;
  addJiraWorklog(
    issueKey: string,
    timeSpent: string,
    comment: string,
    started?: string
  ): Promise<{ success: boolean; worklogId?: string; message: string }>;
  deleteJiraWorklog(
    issueKey: string,
    worklogId: string
  ): Promise<{ success: boolean; message: string }>;
  executeAction(
    type: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; receiptId: string }>;
}
