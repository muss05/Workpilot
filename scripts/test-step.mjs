import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./.workpilot-config.json', 'utf8'));

async function testStep() {
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };
  
  const priorityKeys = [
    "Z10-40432",
    "Z10-40391",
    "Z10-40384",
    "Z10-36295",
    "Z10-30540",
    "Z10-32233",
    "Z10-40216",
    "Z10-40202",
    "Z10-40212",
    "Z10-39518",
  ];

  console.log('Testing fetching worklogs for priority keys...');
  const promises = priorityKeys.map(async (key) => {
    try {
      const res = await fetch(`https://${config.jiraDomain}/rest/api/3/issue/${key}/worklog`, { headers });
      if (!res.ok) return [];
      const d = await res.json();
      return (d.worklogs || []).map(w => ({
        key,
        author: w.author?.displayName,
        started: w.started,
        time: w.timeSpent
      }));
    } catch {
      return [];
    }
  });

  const results = (await Promise.all(promises)).flat();
  console.log('Total worklogs fetched:', results.length);
  const muskan = results.filter(w => w.author?.toLowerCase().includes('muskan'));
  console.log('Muskan worklogs count:', muskan.length);
  console.log('Muskan worklogs:', muskan);
}

testStep().catch(console.error);
