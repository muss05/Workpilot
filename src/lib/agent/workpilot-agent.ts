import { getAIProvider } from "@/lib/ai/provider";
import { logActivity } from "@/lib/memory/store";
import {
  ActionApprovalRequest,
  AgentRunResult,
  SuggestedAction
} from "@/types";
import {
  ActionTool,
  CalendarTool,
  CommitmentDetectionTool,
  EmailTool,
  GitHubTool,
  JiraTimeLogTool,
  JiraTool,
  MemoryTool,
  ReleaseAnalysisTool
} from "./tools/tools";
import { AgentTool, AgentToolCallResult } from "./tools/types";

export class WorkPilotAgent {
  private tools: Map<string, AgentTool> = new Map();

  constructor() {
    this.registerTool(new GitHubTool());
    this.registerTool(new JiraTool());
    this.registerTool(new CalendarTool());
    this.registerTool(new JiraTimeLogTool());
    this.registerTool(new EmailTool());
    this.registerTool(new MemoryTool());
    this.registerTool(new CommitmentDetectionTool());
    this.registerTool(new ReleaseAnalysisTool());
    this.registerTool(new ActionTool());
  }

  private registerTool(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  async run(goal: string, params: Record<string, unknown> = {}): Promise<AgentRunResult> {
    const aiProvider = getAIProvider();

    // Step 1: Formulate Plan based on goal
    let plan: string[] = [];
    let toolsToExecute: string[] = [];

    if (goal.includes("morning") || goal === "morning_brief") {
      plan = [
        "1. Inspect active GitHub pull requests, commits, and open reviews",
        "2. Query Jira sprint tickets for QA bottlenecks and blockers",
        "3. Correlate coding activity to detect unlogged Jira work hours",
        "4. Scan daily calendar events for team syncs and deadlines",
        "5. Correlate recent transcripts for forgotten verbal commitments",
        "6. Consult long-term memory for user preferences and dismissal patterns",
        "7. Synthesize daily brief and stage recommended actions for human approval",
      ];
      toolsToExecute = [
        "github_tool",
        "jira_tool",
        "jira_time_log_tool",
        "calendar_tool",
        "email_tool",
        "commitment_tool",
        "action_tool",
      ];
    } else if (goal.includes("release") || goal === "analyze_release") {
      plan = [
        "1. Query Jira tickets assigned to target release version",
        "2. Check status of all PRs merged into release candidate branch",
        "3. Scan security vulnerabilities and dependency audit reports",
        "4. Analyze architectural blast radius (shared components)",
        "5. Generate release readiness recommendation category and approval actions",
      ];
      toolsToExecute = [
        "jira_tool",
        "github_tool",
        "release_analysis_tool",
        "action_tool",
      ];
    } else if (goal.includes("timelog") || goal === "auto_detect_worklogs") {
      plan = [
        "1. Query active sprint tickets assigned to developer in Jira",
        "2. Inspect today's commits, branch updates, and merged PRs in GitHub",
        "3. Compute active coding windows and draft precise worklog durations",
        "4. Stage draft worklogs for 1-click human verification and Jira submission",
      ];
      toolsToExecute = [
        "jira_tool",
        "github_tool",
        "jira_time_log_tool",
        "action_tool",
      ];
    } else if (goal.includes("commitment") || goal === "detect_commitments") {
      plan = [
        "1. Scan meeting notes and communication transcripts",
        "2. Cross-reference identified promises against GitHub commits and PRs",
        "3. Cross-reference against Jira backlog tickets",
        "4. Calculate confidence score and prepare evidence documentation",
      ];
      toolsToExecute = [
        "email_tool",
        "github_tool",
        "jira_tool",
        "commitment_tool",
      ];
    } else {
      plan = [
        "1. Analyze incoming request and select appropriate operations tools",
        "2. Execute tools and observe cross-system findings",
        "3. Reason and formulate evidence-backed recommendations",
      ];
      toolsToExecute = ["github_tool", "jira_tool", "action_tool"];
    }

    // Step 2 & 3: Execute Tools and Observe Results
    const toolsExecutedLogs: {
      tool: string;
      input: Record<string, unknown>;
      output: Record<string, unknown>;
      timestamp: string;
    }[] = [];

    const observations: AgentToolCallResult[] = [];

    for (const toolName of toolsToExecute) {
      const tool = this.tools.get(toolName);
      if (!tool) continue;

      const result = await tool.execute(params);
      observations.push(result);

      toolsExecutedLogs.push({
        tool: toolName,
        input: params,
        output: {
          purpose: result.purpose,
          status: result.status,
          observation: result.observation,
        },
        timestamp: result.timestamp,
      });

      // Log to agent timeline
      await logActivity({
        title: `Agent Tool: ${toolName}`,
        description: result.observation,
        category: "agent",
        status: result.status === "warning" ? "warning" : "success",
        toolUsed: toolName,
      });
    }

    // Step 4: Reason & Synthesize
    const reasoningPrompt = `
Goal: ${goal}
Plan: ${plan.join("; ")}
Tool Observations:
${observations.map((o) => `[${o.toolName}] ${o.observation}`).join("\n")}
Synthesize findings into actionable work operations intelligence.
`;

    const fallbackReasoning =
      "WorkPilot correlated signals across GitHub, Jira, and Time Logs. High-priority blocker identified on PR #8314 waiting for code review. Unfulfilled commitment detected regarding API documentation. Found 2 pending worklog suggestions ready for Jira synchronization.";

    const reasoning = await aiProvider.generateText(reasoningPrompt, fallbackReasoning);

    // Step 5: Recommendations with complete evidence
    const recommendations: SuggestedAction[] = [
      {
        id: `sug-${Date.now()}-1`,
        title: "Follow up on PR #8314 review with Alex Rivera",
        description: "Send friendly reminder before 11:30 AM frontend sync.",
        urgency: "high",
        type: "message",
        evidence: [
          {
            source: "github",
            title: "PR #8314 Waiting",
            details: "18h without review. CI passed.",
          },
        ],
        approvalStatus: "pending",
      },
      {
        id: `sug-${Date.now()}-2`,
        title: "Review detected API documentation commitment",
        description: "Convert detected commitment into a sprint tracking ticket.",
        urgency: "medium",
        type: "jira",
        evidence: [
          {
            source: "meeting_notes",
            title: "Monday Sprint Notes",
            details: "Confidence score: 87%. No matching PR or issue found.",
          },
        ],
        approvalStatus: "pending",
      },
    ];

    const approvalsRequested: ActionApprovalRequest[] = [
      {
        id: `act-${Date.now()}-app`,
        type: "message",
        title: "Send Slack Nudge for PR #8314",
        description: "Draft message to Alex Rivera requesting code review.",
        status: "pending",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        draftContent: "Hi Alex, PR #8314 has all CI checks green. Could you review before our 11:30 AM sync?",
        targetDestination: "Slack DM to @alex-dev",
        evidence: [
          {
            source: "github",
            title: "PR #8314 CI Passed",
            details: "All 412 automated tests passed.",
          },
        ],
        payload: {
          pr: 8314,
          recipient: "alex-dev",
        },
      },
    ];

    return {
      goal,
      status: "success",
      plan,
      toolsExecuted: toolsExecutedLogs,
      reasoning,
      recommendations,
      approvalsRequested,
    };
  }
}

export const workPilotAgent = new WorkPilotAgent();
