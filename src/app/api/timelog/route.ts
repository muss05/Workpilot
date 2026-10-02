import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getJiraWorklogs,
  getTimeLogDrafts,
  addJiraWorklog,
  deleteJiraWorklog,
} from "@/lib/memory/store";
import { getActiveIntegrationAdapter } from "@/lib/integrations/real-adapter";

const createWorklogSchema = z.object({
  issueKey: z.string().min(1, "Issue key is required"),
  timeSpent: z.string().min(1, "Time spent is required (e.g. 2h 30m)"),
  comment: z.string().optional().default("Work logged via WorkPilot Agent"),
  started: z.string().optional(),
});

export async function GET() {
  try {
    const adapter = getActiveIntegrationAdapter();
    const [worklogs, drafts, rawTickets] = await Promise.all([
      getJiraWorklogs(true),
      getTimeLogDrafts(true),
      adapter.getJiraTickets().catch(() => []),
    ]);

    const hasStandupTicket = rawTickets.some((t) => t.key.toUpperCase() === "Z10-40444");
    const tickets = hasStandupTicket
      ? rawTickets
      : [
          {
            id: "scrum-standup-ticket",
            key: "Z10-40444",
            title: "10x - Daily Stand-ups",
            description: "Official team daily standup and sprint sync meeting for 10x migration (30m daily allocation).",
            status: "Open",
            priority: "High",
            assignee: "Muskan Gupta",
            updatedAt: "Today",
            jiraUrl: "https://amla.atlassian.net/browse/Z10-40444",
          },
          ...rawTickets,
        ];

    // Build weekly timesheet (Mon - Fri)
    const daysConfig = [
      { key: "Monday", date: "2026-09-28", formatted: "Mon, Sep 28", isToday: false },
      { key: "Tuesday", date: "2026-09-29", formatted: "Tue, Sep 29", isToday: false },
      { key: "Wednesday", date: "2026-09-30", formatted: "Wed, Sep 30", isToday: false },
      { key: "Thursday", date: "2026-10-01", formatted: "Thu, Oct 1", isToday: false },
      { key: "Friday", date: "2026-10-02", formatted: "Fri, Oct 2 (Today)", isToday: true },
    ];

    const getLogDateKey = (started?: string): string => {
      if (!started) return "";
      try {
        const d = new Date(started);
        return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // Returns "YYYY-MM-DD"
      } catch {
        return "";
      }
    };

    // Global deduplication of worklogs
    const cleanWorklogId = (id?: string) => (id || "").replace(/^wl-/, "").trim();
    const seenWorklogKeys = new Set<string>();
    const deduplicatedWorklogs = worklogs.filter((w) => {
      const cId = cleanWorklogId(w.id);
      const isNumeric = /^\d+$/.test(cId);
      const logDate = getLogDateKey(w.started);

      // If numeric Jira worklog ID exists (e.g. 1889883), deduplicate strictly by numeric ID
      // Otherwise deduplicate by ticket + date + duration
      const key = isNumeric
        ? `id-${cId}`
        : `${w.issueKey.toUpperCase()}-${logDate}-${w.timeSpentSeconds || 3600}`;

      if (seenWorklogKeys.has(key)) return false;
      seenWorklogKeys.add(key);
      return true;
    });

    const weeklyDays = daysConfig.map((d) => {
      const dayLogs = deduplicatedWorklogs.filter((w) => {
        const logDate = getLogDateKey(w.started);
        return logDate === d.date;
      });

      const dayTotalSec = dayLogs.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 3600), 0);
      const totalHours = Number((dayTotalSec / 3600).toFixed(1));
      return {
        date: d.date,
        dayName: d.key,
        formattedDate: d.formatted,
        totalHours,
        targetHours: 8.0,
        worklogs: dayLogs,
        isToday: d.isToday,
      };
    });

    const todayDay = weeklyDays.find((d) => d.isToday) || weeklyDays[4];
    const todayLoggedHours = todayDay.totalHours;
    const weeklyLoggedHours = Number(
      weeklyDays.reduce((acc, d) => acc + d.totalHours, 0).toFixed(1)
    );

    const weeklySheet = {
      weekLabel: "Week 40 · Sep 28 - Oct 2, 2026",
      totalLoggedHours: weeklyLoggedHours,
      targetLoggedHours: 40.0,
      days: weeklyDays,
    };

    return NextResponse.json({
      summary: {
        todayLoggedHours,
        todayTargetHours: 8.0,
        weeklyLoggedHours,
        weeklyTargetHours: 40.0,
        pendingDraftsCount: drafts.length,
      },
      weeklySheet,
      worklogs: deduplicatedWorklogs,
      drafts,
      tickets,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Jira time logs", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createWorklogSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { issueKey, timeSpent, comment, started } = parsed.data;

    const result = await addJiraWorklog(issueKey, timeSpent, comment, started);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to log work to Jira" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      worklogId: result.worklogId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create Jira worklog", message: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get("id");
    const issueFromQuery = searchParams.get("issueKey");

    let id = idFromQuery;
    let issueKey = issueFromQuery || "";

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id || body.worklogId;
      if (body.issueKey) issueKey = body.issueKey;
    }

    if (!id) {
      return NextResponse.json(
        { error: "Worklog ID is required to delete." },
        { status: 400 }
      );
    }

    const result = await deleteJiraWorklog(id, issueKey);

    return NextResponse.json({
      success: true,
      message: result.message || "Worklog deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete Jira worklog", message: String(error) },
      { status: 500 }
    );
  }
}

