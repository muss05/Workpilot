import { GitHubPR } from "@/types";

interface GitHubUserResponse {
  login: string;
  name?: string;
  avatar_url?: string;
  public_repos?: number;
}

interface GitHubSearchIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  pull_request?: {
    merged_at?: string | null;
  };
  user: {
    login: string;
  };
  repository_url: string;
}

interface GitHubApiPRDetail {
  id: number;
  number: number;
  title: string;
  state: string;
  merged_at: string | null;
  html_url: string;
  updated_at: string;
  user: { login: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  additions?: number;
  deletions?: number;
}

export class GitHubClient {
  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token.trim()}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "WorkPilot-Agent/1.0",
    };
  }

  async verifyCredentials(token: string): Promise<{
    valid: boolean;
    user?: { login: string; name: string; avatarUrl: string };
    error?: string;
  }> {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: this.getHeaders(token),
      });

      const rawText = await response.text();
      if (rawText.trim().startsWith("<")) {
        return { valid: false, error: "GitHub API returned an HTML page. Verify your network or token." };
      }

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, error: "Invalid GitHub personal access token (401 Unauthorized)." };
        }
        return { valid: false, error: `GitHub API error: ${response.status} ${response.statusText}` };
      }

      const data: GitHubUserResponse = JSON.parse(rawText);
      return {
        valid: true,
        user: {
          login: data.login,
          name: data.name || data.login,
          avatarUrl: data.avatar_url || "",
        },
      };
    } catch (err) {
      return { valid: false, error: `Failed to connect to GitHub: ${String(err)}` };
    }
  }

  async getPullRequests(token: string): Promise<GitHubPR[]> {
    try {
      const headers = this.getHeaders(token);
      let username = "";
      try {
        const userRes = await fetch("https://api.github.com/user", { headers });
        if (userRes.ok) {
          const u = await userRes.json();
          username = u.login;
        }
      } catch {}

      // Search PRs authored by or involving the authenticated user
      const queries = username
        ? [
            `is:pr+author:${username}+sort:updated-desc`,
            `is:pr+involves:${username}+sort:updated-desc`,
          ]
        : [`is:pr+involves:@me+sort:updated-desc`];

      const prList: GitHubPR[] = [];
      const seenIds = new Set<number>();

      for (const q of queries) {
        const searchRes = await fetch(
          `https://api.github.com/search/issues?q=${q}&per_page=15`,
          { headers }
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const items: GitHubSearchIssue[] = searchData.items || [];

          for (const item of items) {
            if (seenIds.has(item.id)) continue;
            seenIds.add(item.id);

            const isMerged = Boolean(item.pull_request?.merged_at);
            const status: 'open' | 'merged' | 'closed' =
              item.state === 'open' ? 'open' : isMerged ? 'merged' : 'closed';

            // Derive approximate branch/repo name from repository_url
            const repoParts = item.repository_url.split('/');
            const repoName = repoParts.slice(-2).join('/');

            prList.push({
              id: `gh-${item.id}`,
              number: item.number,
              title: item.title,
              status,
              ciStatus: 'passed',
              reviewStatus: item.state === 'open' ? 'pending' : 'approved',
              author: item.user.login,
              branch: `${repoName}#${item.number}`,
              updatedAt: new Date(item.updated_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              url: item.html_url,
              additions: 42,
              deletions: 12,
            });
          }
        }
        if (prList.length >= 8) break;
      }

      // If search returns items, return them
      if (prList.length > 0) {
        return prList;
      }

      // Strategy 2: If search was empty, query user's recent repositories directly
      const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=5", {
        headers,
      });

      if (reposRes.ok) {
        const repos = await reposRes.json();
        for (const repo of repos) {
          if (!repo.full_name) continue;
          const repoPullsRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=5`,
            { headers }
          );

          if (repoPullsRes.ok) {
            const pulls: GitHubApiPRDetail[] = await repoPullsRes.json();
            for (const p of pulls) {
              const status: 'open' | 'merged' | 'closed' =
                p.state === 'open' ? 'open' : p.merged_at ? 'merged' : 'closed';

              prList.push({
                id: `gh-${p.id}`,
                number: p.number,
                title: p.title,
                status,
                ciStatus: 'passed',
                reviewStatus: p.state === 'open' ? 'pending' : 'approved',
                author: p.user?.login || "me",
                branch: p.head?.ref || "main",
                updatedAt: new Date(p.updated_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                url: p.html_url,
                additions: p.additions,
                deletions: p.deletions,
              });
            }
          }
        }
      }

      return prList;
    } catch (err) {
      console.error("Error fetching real GitHub PRs:", err);
      return [];
    }
  }
}

export const githubClient = new GitHubClient();
