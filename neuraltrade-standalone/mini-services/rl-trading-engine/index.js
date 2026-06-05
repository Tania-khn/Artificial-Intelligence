const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3031;

// Simple HTTP server that proxies requests to Python or handles them natively
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  try {
    if (url.pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', service: 'rl-trading-engine', version: '1.0.0' });
    } else if (url.pathname === '/api/stocks/live') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const result = await runPython('market_data.py', ['live', symbol]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/stocks/history') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const period = url.searchParams.get('period') || '1mo';
      const result = await runPython('market_data.py', ['history', symbol, period]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/stocks/indicators') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const result = await runPython('technical_indicators.py', [symbol]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/stocks/sentiment') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const result = await runPython('sentiment.py', [symbol]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/rl/train' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await runPython('rl_agent.py', ['train', JSON.stringify(body)]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/rl/predict') {
      const symbol = url.searchParams.get('symbol') || 'AAPL';
      const result = await runPython('rl_agent.py', ['predict', symbol]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/rl/backtest' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await runPython('backtest.py', [JSON.stringify(body)]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/stocks/multi') {
      const symbols = url.searchParams.get('symbols') || 'AAPL,TSLA,NVDA';
      const result = await runPython('market_data.py', ['multi', symbols]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/stocks/search') {
      const query = url.searchParams.get('q') || '';
      const result = await runPython('market_data.py', ['search', query]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/auto/cycle' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await runPython('auto_trader.py', ['cycle', JSON.stringify(body)]);
      sendJson(res, 200, result);
    } else if (url.pathname === '/api/auto/analyze' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await runPython('auto_trader.py', ['analyze', JSON.stringify(body)]);
      sendJson(res, 200, result);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    console.error('Request error:', err);
    sendJson(res, 500, { error: err.message || 'Internal server error' });
  }
});

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

function runPython(script, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'python', script);
    const proc = spawn('python3', [scriptPath, ...args], { 
      timeout: 120000,
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python ${script} error (code ${code}):`, stderr);
        reject(new Error(stderr.slice(-500) || `Process exited with code ${code}`));
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Invalid JSON output: ${stdout.slice(0, 200)}`));
        }
      }
    });
    
    proc.on('error', (err) => reject(err));
  });
}

server.listen(PORT, () => {
  console.log(`🤖 RL Trading Engine running on port ${PORT}`);
});
