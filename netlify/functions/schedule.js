const https = require('https');

exports.handler = async function() {
  const url = 'https://www.nwseaportalliance.com/cargo-operations/terminals/gate-schedules';

  const html = await new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  const calStart = html.indexOf('gate-schedule');
  const calSection = calStart > -1 ? html.slice(calStart, calStart + 3000) : html.slice(5000, 8000);

  const t5idx = html.indexOf('T5');
  const t5section = t5idx > -1 ? html.slice(t5idx - 100, t5idx + 500) : 'T5 not found';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      htmlLength: html.length,
      calSection: calSection,
      t5section: t5section,
      hasDates: html.includes('data-date'),
      hasCalendar: html.includes('calendar'),
      hasViewsRow: html.includes('views-row'),
      hasOpenClosed: html.includes('Open') || html.includes('Closed')
    })
  };
};
