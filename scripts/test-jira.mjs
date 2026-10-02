import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function testJiraEndpoints() {
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' };
  
  // Test 1: /rest/api/2/search
  const res2 = await fetch(`https://${config.jiraDomain}/rest/api/2/search?maxResults=5`, { headers });
  console.log('API v2 /search status:', res2.status);
  if (res2.ok) {
    const d = await res2.json();
    console.log('v2 total:', d.total, 'keys:', d.issues?.map(i => i.key));
  } else {
    console.log('v2 error:', (await res2.text()).slice(0, 200));
  }

  // Test 2: /rest/api/3/search/jql
  const res3jql = await fetch(`https://${config.jiraDomain}/rest/api/3/search/jql?jql=${encodeURIComponent('ORDER BY updated DESC')}&maxResults=5`, { headers });
  console.log('API v3 /search/jql status:', res3jql.status);
  if (res3jql.ok) {
    const d = await res3jql.json();
    console.log('v3 jql total:', d.total, 'keys:', d.issues?.map(i => i.key));
  } else {
    console.log('v3 jql error:', (await res3jql.text()).slice(0, 200));
  }

  // Test 3: direct issue fetch for Z10-40432
  const resIssue = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/Z10-40432`, { headers });
  console.log('Direct issue Z10-40432 status:', resIssue.status);
  if (resIssue.ok) {
    const d = await resIssue.json();
    console.log('Issue summary:', d.fields?.summary, 'status:', d.fields?.status?.name, 'assignee:', d.fields?.assignee?.displayName);
  }

  // Test 4: worklog for Z10-40432
  const resWl = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/Z10-40432/worklog`, { headers });
  console.log('Worklog for Z10-40432 status:', resWl.status);
  if (resWl.ok) {
    const d = await resWl.json();
    console.log('Worklogs count:', d.worklogs?.length);
  }
}

testJiraEndpoints().catch(console.error);
