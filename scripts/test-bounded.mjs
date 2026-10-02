import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function inspectJqlWithFields() {
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  const fields = 'id,key,summary,status,priority,assignee,updated,fixVersions';
  const res = await fetch(`https://${config.jiraDomain}/rest/api/3/search/jql?jql=${encodeURIComponent('assignee = currentUser() ORDER BY updated DESC')}&fields=${fields}&maxResults=5`, { headers });
  const d = await res.json();
  console.log('Issues with fields:');
  console.log(JSON.stringify(d.issues, null, 2));
}

inspectJqlWithFields().catch(console.error);
