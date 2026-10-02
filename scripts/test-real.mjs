import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function testJira() {
  console.log('--- Testing Jira ---');
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  // Try search
  const jql = encodeURIComponent('ORDER BY updated DESC');
  const res = await fetch(`https://${config.jiraDomain}/rest/api/3/search?jql=${jql}&maxResults=10`, { headers });
  console.log('Jira search status:', res.status);
  if (res.ok) {
    const data = await res.json();
    console.log('Total issues found:', data.total);
    console.log('Issues:', data.issues?.map(i => ({
      key: i.key,
      summary: i.fields?.summary,
      assignee: i.fields?.assignee?.displayName,
      status: i.fields?.status?.name,
      updated: i.fields?.updated
    })));

    // For each issue, check worklogs
    for (const i of (data.issues || []).slice(0, 5)) {
      const wlRes = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/${i.key}/worklog`, { headers });
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        console.log(`Worklogs for ${i.key}:`, wlData.worklogs?.map(w => ({
          id: w.id,
          timeSpent: w.timeSpent,
          started: w.started,
          comment: JSON.stringify(w.comment).slice(0, 100)
        })));
      }
    }
  } else {
    const text = await res.text();
    console.log('Jira search error:', text.slice(0, 300));
  }
}

async function testGithub() {
  console.log('--- Testing GitHub ---');
  const headers = {
    Authorization: `Bearer ${config.githubToken}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'WorkPilot'
  };

  // Check user info
  const userRes = await fetch('https://api.github.com/user', { headers });
  console.log('GitHub user status:', userRes.status);
  if (userRes.ok) {
    const user = await userRes.json();
    console.log('User login:', user.login);
  }

  // Check user PRs
  const prRes = await fetch(`https://api.github.com/search/issues?q=is:pr+author:${config.githubUsername}+sort:updated-desc&per_page=10`, { headers });
  console.log('GitHub PR search status:', prRes.status);
  if (prRes.ok) {
    const prData = await prRes.json();
    console.log('Total PRs authored:', prData.total_count);
    console.log('Authored PRs:', prData.items?.map(p => ({
      number: p.number,
      title: p.title,
      html_url: p.html_url,
      repository_url: p.repository_url,
      state: p.state,
      updated_at: p.updated_at
    })));
  }

  // Also check involves
  const invRes = await fetch(`https://api.github.com/search/issues?q=is:pr+involves:${config.githubUsername}+sort:updated-desc&per_page=10`, { headers });
  if (invRes.ok) {
    const invData = await invRes.json();
    console.log('Total PRs involved:', invData.total_count);
    console.log('Involved PRs:', invData.items?.map(p => ({
      number: p.number,
      title: p.title,
      html_url: p.html_url,
      repository_url: p.repository_url,
      state: p.state,
      updated_at: p.updated_at
    })));
  }
}

async function main() {
  await testJira();
  await testGithub();
}

main().catch(console.error);
