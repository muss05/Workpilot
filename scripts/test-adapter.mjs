import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function inspectWorklogs() {
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  
  const key = 'Z10-30540';
  const res = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/${key}/worklog`, { headers });
  console.log(`Fetch ${key} status:`, res.status);
  if (res.ok) {
    const d = await res.json();
    console.log('Worklogs count for Z10-30540:', d.worklogs?.length);
    d.worklogs?.forEach(w => {
      console.log(`- author: ${w.author?.displayName} | started: ${w.started} | time: ${w.timeSpent} | comment: ${JSON.stringify(w.comment).slice(0, 40)}`);
    });
  }
}

inspectWorklogs().catch(console.error);
