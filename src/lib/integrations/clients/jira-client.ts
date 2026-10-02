import { JiraTicket, JiraWorklog } from "@/types";

interface JiraMyselfResponse {
  accountId?: string;
  name?: string;
  displayName?: string;
  emailAddress?: string;
  active?: boolean;
}

interface JiraIssueResponse {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: unknown;
    status: {
      name: string;
      statusCategory?: { name: string; key: string };
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress?: string;
    };
    updated: string;
    fixVersions?: Array<{ name: string }>;
  };
}

export interface ParsedJiraTarget {
  displayDomain: string;
  host: string;
  basePath: string;
  endpoints: {
    myself: string[];
    search: string[];
  };
}

export class JiraClient {
  /**
   * Cleans any user input (full browser URL, subpaths, missing protocol, subdomain-only)
   * into clean host and valid Jira REST API endpoint candidates.
   */
  parseDomain(rawInput: string): ParsedJiraTarget {
    let input = (rawInput || "").trim();

    // Add protocol if missing so URL constructor can parse reliably
    if (!/^https?:\/\//i.test(input)) {
      input = `https://${input}`;
    }

    let host = "";
    let basePath = "";

    try {
      const url = new URL(input);
      host = url.hostname;
      basePath = url.pathname.replace(/\/+$/, "");

      // If user typed only "company" without any dot
      if (!host.includes(".")) {
        host = `${host}.atlassian.net`;
      }

      // Strip browser web routes commonly copied from address bars
      // e.g., /jira/your-work, /jira/projects/PROJ, /browse/KEY, /secure/...
      if (
        /^\/jira\/(your-work|projects|browse|software|servicedesk|secure)/i.test(basePath) ||
        /^\/(browse|your-work|projects|software|servicedesk|secure)/i.test(basePath)
      ) {
        basePath = "";
      } else if (basePath === "/jira" && host.toLowerCase().endsWith(".atlassian.net")) {
        // Atlassian Cloud REST API lives at the root (https://host.atlassian.net/rest/api/3)
        basePath = "";
      }
    } catch {
      let cleaned = (rawInput || "")
        .replace(/^https?:\/\//i, "")
        .replace(/\/+$/, "")
        .trim();
      if (!cleaned.includes(".")) {
        cleaned = `${cleaned}.atlassian.net`;
      }
      host = cleaned;
      basePath = "";
    }

    const isAtlassianCloud = host.toLowerCase().endsWith(".atlassian.net");

    // Build ordered list of candidate endpoints
    const myselfEndpoints: string[] = [];
    const searchEndpoints: string[] = [];

    if (isAtlassianCloud) {
      myselfEndpoints.push(`https://${host}/rest/api/3/myself`);
      myselfEndpoints.push(`https://${host}/rest/api/2/myself`);

      searchEndpoints.push(`https://${host}/rest/api/3/search/jql`);
      searchEndpoints.push(`https://${host}/rest/api/3/search`);
      searchEndpoints.push(`https://${host}/rest/api/2/search`);
    } else {
      // Custom domain or Jira Server / Data Center
      const prefix = basePath ? `https://${host}${basePath}` : `https://${host}`;
      myselfEndpoints.push(`${prefix}/rest/api/3/myself`);
      myselfEndpoints.push(`${prefix}/rest/api/2/myself`);
      if (!basePath) {
        myselfEndpoints.push(`https://${host}/jira/rest/api/2/myself`);
      }

      searchEndpoints.push(`${prefix}/rest/api/3/search/jql`);
      searchEndpoints.push(`${prefix}/rest/api/3/search`);
      searchEndpoints.push(`${prefix}/rest/api/2/search`);
      if (!basePath) {
        searchEndpoints.push(`https://${host}/jira/rest/api/2/search`);
      }
    }

    return {
      displayDomain: host,
      host,
      basePath,
      endpoints: {
        myself: myselfEndpoints,
        search: searchEndpoints,
      },
    };
  }

  cleanDomain(domain: string): string {
    return this.parseDomain(domain).displayDomain;
  }

  private getHeaders(email: string, apiToken: string) {
    const cleanEmail = (email || "").trim();
    const cleanToken = (apiToken || "").trim();

    // Determine auth scheme:
    // If email is provided: Atlassian Cloud Basic Auth (email:api_token)
    // If no email or "pat" keyword: Bearer token (for Jira Server / Data Center PAT)
    const isBearer =
      cleanEmail.length === 0 ||
      cleanEmail.toLowerCase() === "pat" ||
      cleanEmail.toLowerCase() === "bearer";

    const authHeader = isBearer
      ? `Bearer ${cleanToken}`
      : `Basic ${Buffer.from(`${cleanEmail}:${cleanToken}`).toString("base64")}`;

    return {
      Authorization: authHeader,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "WorkPilot-Agent/1.0",
      "X-Atlassian-Token": "no-check",
    };
  }

  private async safeFetchJson<T>(
    url: string,
    headers: Record<string, string>
  ): Promise<{
    ok: boolean;
    status: number;
    data?: T;
    isHtml?: boolean;
    isLoginRedirect?: boolean;
    errorText?: string;
  }> {
    try {
      const response = await fetch(url, {
        headers,
        redirect: "follow",
      });

      // Detect if fetch followed a redirect to a login/SSO portal
      if (
        response.url.includes("/login") ||
        response.url.includes("id.atlassian.com/login") ||
        response.url.includes("/auth")
      ) {
        return {
          ok: false,
          status: 401,
          isLoginRedirect: true,
          errorText: "Request was redirected to an Atlassian login screen.",
        };
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const rawText = await response.text();
      const isHtml =
        rawText.trim().startsWith("<") ||
        contentType.includes("text/html") ||
        rawText.includes("<!DOCTYPE") ||
        rawText.includes("<html");

      if (isHtml) {
        return {
          ok: false,
          status: response.status,
          isHtml: true,
          errorText: "Received an HTML document instead of JSON.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          errorText: rawText.slice(0, 300),
        };
      }

      const data = JSON.parse(rawText) as T;
      return { ok: true, status: response.status, data };
    } catch (err) {
      return {
        ok: false,
        status: 500,
        errorText: String(err),
      };
    }
  }

  async verifyCredentials(
    domain: string,
    email: string,
    apiToken: string
  ): Promise<{
    valid: boolean;
    user?: { accountId: string; displayName: string; emailAddress?: string };
    error?: string;
    resolvedUrl?: string;
  }> {
    const target = this.parseDomain(domain);
    const headers = this.getHeaders(email, apiToken);

    let lastError = "";
    let sawHtml = false;
    let sawRedirect = false;

    // Try candidate endpoints in order (e.g. /rest/api/3/myself -> /rest/api/2/myself)
    for (const endpoint of target.endpoints.myself) {
      const result = await this.safeFetchJson<JiraMyselfResponse>(endpoint, headers);

      if (result.ok && result.data) {
        const data = result.data;
        return {
          valid: true,
          user: {
            accountId: data.accountId || data.name || "jira-user",
            displayName: data.displayName || data.name || email,
            emailAddress: data.emailAddress || email,
          },
          resolvedUrl: endpoint,
        };
      }

      if (result.isLoginRedirect) {
        sawRedirect = true;
      } else if (result.isHtml) {
        sawHtml = true;
      } else if (result.status === 401) {
        return {
          valid: false,
          error:
            "Authentication failed (401 Unauthorized). Verify your Atlassian account email and use an API Token generated from https://id.atlassian.com/manage-profile/security/api-tokens (NOT your Jira account password).",
        };
      } else if (result.status === 403) {
        return {
          valid: false,
          error:
            "Access forbidden (403 Forbidden). Your Atlassian user does not have permission to access Jira Software REST API on this instance.",
        };
      } else if (result.errorText) {
        lastError = result.errorText;
      }
    }

    if (sawRedirect) {
      return {
        valid: false,
        error:
          "The Jira server redirected to a login page. Please verify your Jira email address and ensure you are using an Atlassian API Token from id.atlassian.com (not your password).",
      };
    }

    if (sawHtml) {
      return {
        valid: false,
        error: `Could not connect to '${target.displayDomain}': The server returned an HTML web page instead of Jira API JSON. Ensure your domain is formatted like 'your-team.atlassian.net' (omit any subpaths like '/jira/your-work').`,
      };
    }

    return {
      valid: false,
      error:
        lastError ||
        `Could not connect to Jira domain '${target.displayDomain}'. Please ensure the domain is correct and reachable.`,
    };
  }

  async getTickets(
    domain: string,
    email: string,
    apiToken: string
  ): Promise<JiraTicket[]> {
    try {
      const target = this.parseDomain(domain);
      const headers = this.getHeaders(email, apiToken);
      const fields = "summary,status,priority,assignee,updated,fixVersions,description,timetracking,timespent,timeoriginalestimate,timeestimate";

      // Try queries: first assignee = currentUser(), then bounded updated >= -30d
      const jqlQueries = [
        encodeURIComponent("assignee = currentUser() ORDER BY updated DESC"),
        encodeURIComponent("updated >= -30d ORDER BY updated DESC"),
        encodeURIComponent("ORDER BY updated DESC"),
      ];

      for (const endpoint of target.endpoints.search) {
        for (const jql of jqlQueries) {
          const url = `${endpoint}?jql=${jql}&maxResults=30&fields=${fields}`;
          const result = await this.safeFetchJson<{ issues?: JiraIssueResponse[] }>(
            url,
            headers
          );

          if (result.ok && result.data && Array.isArray(result.data.issues)) {
            const issues = result.data.issues;
            if (issues.length === 0 && jql === jqlQueries[0]) {
              // No tickets assigned to currentUser; loop to try next query
              continue;
            }

            return issues.map((issue) => {
              const rawStatusName = issue.fields?.status?.name || "Open";
              const statusCategoryName = issue.fields?.status?.statusCategory?.name || "In Progress";
              const status = rawStatusName;

              const rawPriority = (issue.fields?.priority?.name || "").toLowerCase();
              let priority: JiraTicket["priority"] = "Medium";
              if (rawPriority.includes("crit") || rawPriority.includes("highest")) {
                priority = "Critical";
              } else if (rawPriority.includes("high")) {
                priority = "High";
              } else if (rawPriority.includes("low")) {
                priority = "Low";
              }

              const fixVersion = issue.fields?.fixVersions?.[0]?.name;
              const anyFields = issue.fields as any;
              const tt = anyFields?.timetracking;

              const timeSpent =
                tt?.timeSpent ||
                (anyFields?.timespent ? `${Math.round((anyFields.timespent / 3600) * 10) / 10}h` : undefined);
              const timeSpentSeconds = tt?.timeSpentSeconds || anyFields?.timespent || 0;
              const remainingTime =
                tt?.remainingEstimate ||
                (anyFields?.timeestimate ? `${Math.round((anyFields.timeestimate / 3600) * 10) / 10}h` : undefined);
              const remainingSeconds = tt?.remainingEstimateSeconds ?? anyFields?.timeestimate ?? undefined;
              const originalEstimate =
                tt?.originalEstimate ||
                (anyFields?.timeoriginalestimate ? `${Math.round((anyFields.timeoriginalestimate / 3600) * 10) / 10}h` : undefined);
              const originalEstimateSeconds = tt?.originalEstimateSeconds || anyFields?.timeoriginalestimate || 0;

              return {
                id: `jira-${issue.id}`,
                key: issue.key,
                title: issue.fields?.summary || "Untitled Jira Ticket",
                status,
                rawStatus: rawStatusName,
                statusCategory: statusCategoryName,
                priority,
                timeSpent,
                timeSpentSeconds,
                remainingTime,
                remainingSeconds,
                originalEstimate,
                originalEstimateSeconds,
                assignee: issue.fields?.assignee?.displayName || "Unassigned",
                updatedAt: new Date(issue.fields?.updated || Date.now()).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                releaseVersion: fixVersion,
                description:
                  typeof issue.fields?.description === "string"
                    ? issue.fields.description
                    : undefined,
                jiraUrl: `https://${target.host}/browse/${issue.key}`,
              };
            });
          }
        }
      }

      return [];
    } catch (err) {
      console.error("Error querying real Jira API:", err);
      return [];
    }
  }

  async addWorklog(
    domain: string,
    email: string,
    apiToken: string,
    issueKey: string,
    timeSpent: string,
    comment: string,
    started?: string
  ): Promise<{ success: boolean; worklogId?: string; message: string; errorDetails?: string }> {
    try {
      const target = this.parseDomain(domain);
      const headers = this.getHeaders(email, apiToken);
      
      const d = started ? new Date(started) : new Date();
      const pad = (n: number, z = 2) => String(n).padStart(z, "0");
      // Format must be strictly YYYY-MM-DDTHH:mm:ss.SSS+0000
      const formattedStarted = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}+0000`;
      const cleanComment = (comment || "").trim() || "Work logged via WorkPilot Agent";

      // Candidate 1: Jira Cloud v3 Document format
      const v3Payload = {
        timeSpent: timeSpent.trim(),
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: cleanComment,
                },
              ],
            },
          ],
        },
        started: formattedStarted,
      };

      // Candidate 2: Jira Cloud / Server v2 plaintext string format
      const v2Payload = {
        timeSpent: timeSpent.trim(),
        comment: cleanComment,
        started: formattedStarted,
      };

      const isCloud = target.host.toLowerCase().endsWith(".atlassian.net");
      const urlsToTry: Array<{ url: string; payload: unknown; version: string }> = [];

      if (isCloud) {
        urlsToTry.push({
          url: `https://${target.host}/rest/api/3/issue/${issueKey}/worklog`,
          payload: v3Payload,
          version: "v3",
        });
        urlsToTry.push({
          url: `https://${target.host}/rest/api/2/issue/${issueKey}/worklog`,
          payload: v2Payload,
          version: "v2",
        });
      } else {
        const prefix = target.basePath ? `https://${target.host}${target.basePath}` : `https://${target.host}`;
        urlsToTry.push({
          url: `${prefix}/rest/api/2/issue/${issueKey}/worklog`,
          payload: v2Payload,
          version: "v2",
        });
        urlsToTry.push({
          url: `${prefix}/rest/api/3/issue/${issueKey}/worklog`,
          payload: v3Payload,
          version: "v3",
        });
      }

      let lastError = "";

      for (const candidate of urlsToTry) {
        try {
          const res = await fetch(candidate.url, {
            method: "POST",
            headers,
            body: JSON.stringify(candidate.payload),
          });

          if (res.ok) {
            const resJson = (await res.json().catch(() => ({}))) as { id?: string };
            return {
              success: true,
              worklogId: resJson.id || `worklog-${Date.now()}`,
              message: `Successfully logged ${timeSpent} to ${issueKey} in Jira Cloud.`,
            };
          } else {
            const errText = await res.text().catch(() => "");
            lastError = `Jira ${candidate.version} HTTP ${res.status}: ${errText}`;
            console.error(`Jira worklog failed on ${candidate.url}:`, lastError);
          }
        } catch (fetchErr) {
          lastError = String(fetchErr);
        }
      }

      return {
        success: false,
        message: `Failed to submit worklog to Jira ticket ${issueKey}. ${lastError}`,
        errorDetails: lastError,
      };
    } catch (err) {
      return {
        success: false,
        message: `Jira worklog submission error: ${String(err)}`,
        errorDetails: String(err),
      };
    }
  }

  async getWorklogs(
    domain: string,
    email: string,
    apiToken: string,
    issueKey: string
  ): Promise<JiraWorklog[]> {
    try {
      const target = this.parseDomain(domain);
      const headers = this.getHeaders(email, apiToken);
      const urls = [
        `https://${target.host}/rest/api/3/issue/${issueKey}/worklog`,
        `https://${target.host}/rest/api/2/issue/${issueKey}/worklog`,
      ];

      for (const url of urls) {
        const res = await this.safeFetchJson<{
          worklogs?: Array<{
            id: string;
            timeSpent?: string;
            timeSpentSeconds?: number;
            author?: { displayName?: string };
            comment?: unknown;
            started?: string;
          }>;
        }>(url, headers);

        if (res.ok && res.data?.worklogs) {
          return res.data.worklogs.map((w) => {
            let commentText = "";
            if (typeof w.comment === "string") {
              commentText = w.comment;
            } else if (w.comment && typeof w.comment === "object") {
              const obj = w.comment as { content?: Array<{ content?: Array<{ text?: string }> }> };
              if (Array.isArray(obj.content)) {
                commentText = obj.content
                  .map((p) => p.content?.map((c) => c.text || "").join(" ") || "")
                  .join("\n");
              }
            }

            const startDate = new Date(w.started || Date.now());
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayOfWeek = days[startDate.getDay()];

            return {
              id: String(w.id),
              issueKey,
              issueTitle: `Jira Issue ${issueKey}`,
              timeSpent: w.timeSpent || `${Math.round((w.timeSpentSeconds || 3600) / 3600)}h`,
              timeSpentSeconds: w.timeSpentSeconds || 3600,
              author: w.author?.displayName || email,
              comment: commentText || "Logged work",
              started: w.started || new Date().toISOString(),
              source: "manual",
              status: "logged",
              dayOfWeek,
              jiraUrl: `https://${target.host}/browse/${issueKey}`,
            };
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  async getWorklogsForIssues(
    domain: string,
    email: string,
    apiToken: string,
    issueKeys: string[]
  ): Promise<JiraWorklog[]> {
    const promises = issueKeys.map((key) => this.getWorklogs(domain, email, apiToken, key));
    const results = await Promise.all(promises);
    return results.flat();
  }

  async deleteWorklog(
    domain: string,
    email: string,
    apiToken: string,
    issueKey: string,
    worklogId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const target = this.parseDomain(domain);
      const headers = this.getHeaders(email, apiToken);
      const cleanWorklogId = worklogId.replace(/^wl-/, "").trim();

      const urls = [
        `https://${target.host}/rest/api/3/issue/${issueKey}/worklog/${cleanWorklogId}`,
        `https://${target.host}/rest/api/2/issue/${issueKey}/worklog/${cleanWorklogId}`,
      ];

      for (const url of urls) {
        const res = await fetch(url, {
          method: "DELETE",
          headers,
        });

        if (res.status === 204 || res.ok) {
          return {
            success: true,
            message: `Successfully deleted worklog ${cleanWorklogId} from ${issueKey} in Jira Cloud.`,
          };
        }
      }

      return {
        success: false,
        message: `Failed to delete worklog ${cleanWorklogId} from Jira. Worklog may not exist in Jira Cloud.`,
      };
    } catch (err) {
      return {
        success: false,
        message: `Jira worklog delete error: ${String(err)}`,
      };
    }
  }
}

export const jiraClient = new JiraClient();
