async function check() {
  const res = await fetch('http://localhost:3002/api/timelog');
  const d = await res.json();
  if (!d.weeklySheet) {
    console.log('Error/No sheet:', d);
    return;
  }
  console.log('Summary:', d.summary);
  console.log('=== Weekly Sheet Breakdown ===');
  d.weeklySheet.days.forEach(day => {
    console.log(`${day.dayName} (${day.date}): ${day.totalHours}h (${day.worklogs.length} logs)`);
    day.worklogs.forEach(w => {
      console.log(`   - [${w.issueKey}] ${w.timeSpent}: ${w.comment.slice(0, 60)} | PR #${w.prNumber || 'none'}`);
    });
  });
  console.log('=== Pending Drafts ===');
  d.drafts?.forEach(dr => {
    console.log(`[${dr.issueKey}] Suggested ${dr.suggestedTime} | PR #${dr.prNumber} | ${dr.jiraUrl} | ${dr.prUrl}`);
  });
}

check().catch(console.error);
