const https = require('https');

exports.handler = async function() {
  const url = 'https://www.nwseaportalliance.com/cargo-operations/terminals/gate-schedules';

  const html = await new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  // Find context around "Open" and "Closed"
  const openIdx = html.indexOf('Open');
  const closedIdx = html.indexOf('Closed');
  
  const openCtx = openIdx > -1 ? html.slice(Math.max(0, openIdx - 300), openIdx + 300) : 'not found';
  const closedCtx = closedIdx > -1 ? html.slice(Math.max(0, closedIdx - 300), closedIdx + 300) : 'not found';

  // Find views-row context
  const rowIdx = html.indexOf('views-row');
  const rowCtx = rowIdx > -1 ? html.slice(rowIdx, rowIdx + 1000) : 'not found';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ openCtx, closedCtx, rowCtx })
  };
};
