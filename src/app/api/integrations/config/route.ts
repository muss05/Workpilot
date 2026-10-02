import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearIntegrationCredentials,
  getIntegrationCredentials,
  isLiveGithubConfigured,
  isLiveJiraConfigured,
  saveIntegrationCredentials,
} from "@/lib/integrations/config";
import { githubClient } from "@/lib/integrations/clients/github-client";
import { jiraClient } from "@/lib/integrations/clients/jira-client";
import { logActivity } from "@/lib/memory/store";

export async function GET() {
  try {
    const creds = getIntegrationCredentials();
    const hasGithub = isLiveGithubConfigured();
    const hasJira = isLiveJiraConfigured();

    return NextResponse.json({
      isLive: hasGithub || hasJira,
      github: {
        connected: hasGithub,
        username: creds.githubUsername || null,
        hasToken: Boolean(creds.githubToken),
      },
      jira: {
        connected: hasJira,
        domain: creds.jiraDomain || null,
        email: creds.jiraEmail || null,
        displayName: creds.jiraDisplayName || null,
        hasToken: Boolean(creds.jiraApiToken),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read configuration", message: String(err) },
      { status: 500 }
    );
  }
}

const updateConfigSchema = z.object({
  type: z.enum(["github", "jira"]),
  githubToken: z.string().optional(),
  jiraDomain: z.string().optional(),
  jiraEmail: z.string().optional(),
  jiraApiToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = updateConfigSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { type, githubToken, jiraDomain, jiraEmail, jiraApiToken } = parsed.data;

    if (type === "github") {
      if (!githubToken || githubToken.trim().length === 0) {
        return NextResponse.json({ error: "GitHub Personal Access Token is required." }, { status: 400 });
      }

      // Verify with real GitHub API
      const verifyRes = await githubClient.verifyCredentials(githubToken);
      if (!verifyRes.valid) {
        return NextResponse.json(
          { error: verifyRes.error || "Failed to authenticate with GitHub." },
          { status: 401 }
        );
      }

      // Save credentials
      saveIntegrationCredentials({
        githubToken: githubToken.trim(),
        githubUsername: verifyRes.user?.login,
      });

      await logActivity({
        title: "Live GitHub Integration Connected",
        description: `Authenticated with GitHub as @${verifyRes.user?.login}. Real-time pull requests and branch signals activated.`,
        category: "github",
        status: "success",
        toolUsed: "github_client",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully connected to GitHub as @${verifyRes.user?.login}!`,
        user: verifyRes.user,
      });
    }

    if (type === "jira") {
      if (!jiraDomain || !jiraEmail || !jiraApiToken) {
        return NextResponse.json(
          { error: "Jira Domain, Email, and API Token are all required." },
          { status: 400 }
        );
      }

      // Verify with real Atlassian Jira API
      const verifyRes = await jiraClient.verifyCredentials(jiraDomain, jiraEmail, jiraApiToken);
      if (!verifyRes.valid) {
        return NextResponse.json(
          { error: verifyRes.error || "Failed to authenticate with Atlassian Jira." },
          { status: 401 }
        );
      }

      // Save credentials
      saveIntegrationCredentials({
        jiraDomain: jiraClient.cleanDomain(jiraDomain),
        jiraEmail: jiraEmail.trim(),
        jiraApiToken: jiraApiToken.trim(),
        jiraDisplayName: verifyRes.user?.displayName,
      });

      await logActivity({
        title: "Live Atlassian Jira Connected",
        description: `Authenticated with Jira Cloud (${jiraClient.cleanDomain(jiraDomain)}) as ${verifyRes.user?.displayName}. Real-time sprint tickets activated.`,
        category: "jira",
        status: "success",
        toolUsed: "jira_client",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully connected to Jira Cloud as ${verifyRes.user?.displayName}!`,
        user: verifyRes.user,
      });
    }

    return NextResponse.json({ error: "Unsupported integration type." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: "Configuration save failed", message: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "github" | "jira" | undefined;

    clearIntegrationCredentials(type || undefined);

    await logActivity({
      title: `${type ? type.toUpperCase() : "Live"} Integration Disconnected`,
      description: "Reverted connection to high-fidelity demo workspace.",
      category: "agent",
      status: "info",
      toolUsed: "integration_manager",
    });

    return NextResponse.json({
      success: true,
      message: `Disconnected ${type || "all"} live integrations. Reverted to Demo Workspace.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to disconnect", message: String(err) },
      { status: 500 }
    );
  }
}
