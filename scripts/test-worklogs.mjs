import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function inspectWorklogs() {
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  
  const tickets = ['Z10-40432', 'Z10-40391', 'Z10-40202', 'Z10-39518', 'Z10-36295', 'Z10-40384', 'Z10-30540', 'Z10-32233', 'Z10-40216'];
  for (const t of tickets) {
    const res = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/${t}/worklog`, { headers });
    if (res.ok) {
      const d = await res.json();
      if (d.worklogs && d.worklogs.length > 0) {
        console.log(`=== Worklogs for ${t} (${d.worklogs.length}) ===`);
        for (const w of d.worklogs) {
          console.log({
            author: w.author?.displayName,
            timeSpent: w.timeSpent,
            started: w.started,
            comment: typeof w.comment === 'string' ? w.comment : (w.comment?.content?.[0]?.content?.[0]?.text || '')
          });
        }
      }
    }
  }
}

inspectWorklogs().catch(console.error);
