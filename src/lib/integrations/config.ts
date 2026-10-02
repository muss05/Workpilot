import fs from "fs";
import path from "path";

export interface IntegrationCredentials {
  githubToken?: string;
  githubUsername?: string;
  jiraDomain?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  jiraDisplayName?: string;
}

// In-memory credential cache with fallback to .workpilot-config.json
let runtimeCredentials: IntegrationCredentials = {
  githubToken: process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN,
  jiraDomain: process.env.JIRA_DOMAIN,
  jiraEmail: process.env.JIRA_EMAIL,
  jiraApiToken: process.env.JIRA_API_TOKEN,
};

const CONFIG_FILE_PATH = path.join(process.cwd(), ".workpilot-config.json");

function loadFromFile() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
      runtimeCredentials = { ...runtimeCredentials, ...data };
    }
  } catch {
    // Non-fatal if config file cannot be read
  }
}

// Attempt initial load
loadFromFile();

export function getIntegrationCredentials(): IntegrationCredentials {
  return { ...runtimeCredentials };
}

export function saveIntegrationCredentials(creds: Partial<IntegrationCredentials>): IntegrationCredentials {
  runtimeCredentials = { ...runtimeCredentials, ...creds };
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(runtimeCredentials, null, 2), "utf-8");
  } catch {
    // Non-fatal if writing to filesystem fails (e.g. read-only serverless environment)
  }
  return { ...runtimeCredentials };
}

export function clearIntegrationCredentials(type?: "github" | "jira"): IntegrationCredentials {
  if (type === "github") {
    delete runtimeCredentials.githubToken;
    delete runtimeCredentials.githubUsername;
  } else if (type === "jira") {
    delete runtimeCredentials.jiraDomain;
    delete runtimeCredentials.jiraEmail;
    delete runtimeCredentials.jiraApiToken;
    delete runtimeCredentials.jiraDisplayName;
  } else {
    runtimeCredentials = {};
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(runtimeCredentials, null, 2), "utf-8");
    }
  } catch {
    // ignore
  }

  return { ...runtimeCredentials };
}

export function isLiveGithubConfigured(): boolean {
  return Boolean(runtimeCredentials.githubToken && runtimeCredentials.githubToken.trim().length > 0);
}

export function isLiveJiraConfigured(): boolean {
  return Boolean(
    runtimeCredentials.jiraDomain &&
    runtimeCredentials.jiraEmail &&
    runtimeCredentials.jiraApiToken &&
    runtimeCredentials.jiraApiToken.trim().length > 0
  );
}

export function isAnyLiveConfigured(): boolean {
  return isLiveGithubConfigured() || isLiveJiraConfigured();
}

export function getJiraTicketUrl(issueKey: string): string {
  const creds = getIntegrationCredentials();
  const domain = creds.jiraDomain
    ? creds.jiraDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "")
    : "amla.atlassian.net";
  return `https://${domain}/browse/${issueKey}`;
}

export function getGitHubPRUrl(prNumber: number): string {
  const repo =
    prNumber >= 8000
      ? "znode10-admin-migration"
      : "znode-webstore10x-page-builder";
  return `https://github.com/MRRSoft/${repo}/pull/${prNumber}`;
}

