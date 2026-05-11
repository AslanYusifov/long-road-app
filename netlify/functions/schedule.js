const https = require('https');

exports.handler = async function() {
  const url = 'https://www.nwseaportalliance.com/cargo-operations/terminals/gate-schedules';

  const html = await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  // Extract all calendar event data from the page
  const terminals = ['T5', 'T18', 'Husky', 'PCT', 'WUT', 'EB1', 'T7'];
  const schedule = {};

  // Parse view-content calendar table
  // Look for date cells and their events
  const datePattern = /date-display-single[^>]*>([^<]+)</g;
  const eventPattern = /views-field-title[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g;

  // Simpler approach: find all td elements with data-date attribute
  const tdPattern = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*>([\s\S]*?)<\/td>/g;
  const eventTitlePattern = /<span[^>]*class="[^"]*field-content[^"]*"[^>]*>([\s\S]*?)<\/span>/g;

  let match;
  const days = {};

  while ((match = tdPattern.exec(html)) !== null) {
    const date = match[1];
    const cellContent = match[2];
    const events = [];
    let evMatch;
    while ((evMatch = eventTitlePattern.exec(cellContent)) !== null) {
      events.push(evMatch[1].trim());
    }
    if (events.length > 0) days[date] = events;
  }

  // Fallback: try to get today's schedule via simpler text patterns
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  // Try to find terminal status blocks
  const statusBlocks = [];
  const blockPattern = /class="views-row[^"]*"[^>]*>([\s\S]*?)(?=class="views-row|$)/g;
  while ((match = blockPattern.exec(html)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/field--name-title[^>]*>[\s\S]*?>([^<]+)</);
    const dateMatch = block.match(/datetime="([^"T]+)/);
    const statusMatch = block.match(/Open|Closed/i);
    if (titleMatch && dateMatch && statusMatch) {
      const d = dateMatch[1];
      if (!days[d]) days[d] = [];
      days[d].push(titleMatch[1].trim() + ' - ' + statusMatch[0]);
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    },
    body: JSON.stringify({
      today: today,
      days: days,
      source: 'nwseaportalliance.com',
      fetched: new Date().toISOString()
    })
  };
};
