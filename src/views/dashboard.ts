export function renderDashboardHtml(payToAddress: string, network: string, facilitatorUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CONWAY WEB 4.0 // INFRASTRUCTURE TERMINAL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0D12;
      --panel-bg: #121721;
      --border: #1E2638;
      --accent-green: #00FF87;
      --accent-cyan: #00F2FE;
      --accent-yellow: #FFB800;
      --accent-purple: #9D00FF;
      --accent-red: #FF3366;
      --text: #E2E8F0;
      --text-dim: #64748B;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: #0F141D;
      border-bottom: 1px solid var(--border);
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .mode-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .mode-demo { background: rgba(255, 184, 0, 0.15); color: var(--accent-yellow); border: 1px solid var(--accent-yellow); }
    .mode-live { background: rgba(0, 255, 135, 0.15); color: var(--accent-green); border: 1px solid var(--accent-green); }

    .top-health {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
    }

    .health-item { display: flex; align-items: center; gap: 0.4rem; }
    .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
    .dot-green { background: var(--accent-green); box-shadow: 0 0 8px var(--accent-green); }
    .dot-yellow { background: var(--accent-yellow); box-shadow: 0 0 8px var(--accent-yellow); }
    .dot-red { background: var(--accent-red); box-shadow: 0 0 8px var(--accent-red); }

    main {
      flex: 1;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
    }

    @media (max-width: 1100px) { main { grid-template-columns: 1fr; } }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 6px;
    }

    .metric-label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 0.4rem; }
    .metric-val { font-size: 1.4rem; font-weight: 700; color: #FFF; }
    .metric-sub { font-size: 0.7rem; color: var(--text-dim); margin-top: 0.2rem; }

    .terminal-box {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .terminal-head {
      background: #0B0E14;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tx-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }

    .tx-table th {
      text-align: left;
      padding: 0.6rem 0.8rem;
      background: rgba(255, 255, 255, 0.02);
      color: var(--text-dim);
      font-weight: 600;
      border-bottom: 1px solid var(--border);
    }

    .tx-table td {
      padding: 0.65rem 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .tx-id {
      color: var(--accent-cyan);
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
    }

    .tx-id:hover { color: #FFF; }

    .status-200 { color: var(--accent-green); font-weight: 700; }
    .status-402 { color: var(--accent-yellow); font-weight: 700; }
    .status-500 { color: var(--accent-red); font-weight: 700; }

    .action-btn {
      background: #1A2233;
      color: #FFF;
      border: 1px solid var(--border);
      padding: 0.7rem 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      margin-bottom: 0.6rem;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.15s ease;
    }

    .action-btn:hover { background: #243047; border-color: var(--accent-cyan); }
    .action-btn.active { border-color: var(--accent-green); }

    /* Inspector Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }

    .modal-card {
      background: #0F141D;
      border: 1px solid var(--accent-cyan);
      width: 90%;
      max-width: 750px;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 0 30px rgba(0, 242, 254, 0.15);
    }

    .timeline {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .timeline-step {
      background: #161D2A;
      padding: 0.65rem 0.9rem;
      border-left: 3px solid var(--text-dim);
      border-radius: 4px;
      font-size: 0.78rem;
    }

    .timeline-step.active { border-left-color: var(--accent-green); background: #1B2536; }

    .step-title { font-weight: 700; color: #FFF; margin-bottom: 0.2rem; }
    .step-desc { color: var(--text-dim); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>CONWAY // WEB 4.0 GATEWAY</span>
      <span class="mode-badge mode-demo" id="mode-indicator">DEMO MODE</span>
    </div>

    <div class="top-health" id="health-grid">
      <div class="health-item"><span class="dot dot-green"></span> Gateway</div>
      <div class="health-item"><span class="dot dot-green"></span> Facilitator</div>
      <div class="health-item"><span class="dot dot-green"></span> Base RPC</div>
      <div class="health-item"><span class="dot dot-green"></span> Wallet</div>
      <div class="health-item"><span class="dot dot-green"></span> Scrape</div>
      <div class="health-item"><span class="dot dot-green"></span> JIT Engine</div>
    </div>
  </header>

  <main>
    <div class="left-pane">
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-label">Settled Real Revenue</div>
          <div class="metric-val" id="val-live-rev">$0.00</div>
          <div class="metric-sub" id="val-live-tx">0 Live Transactions</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Demo Test Volume</div>
          <div class="metric-val" id="val-demo-rev" style="color: var(--accent-yellow);">$0.00</div>
          <div class="metric-sub" id="val-demo-tx">0 Demo Transactions</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Transactions</div>
          <div class="metric-val" id="val-total-tx">0</div>
          <div class="metric-sub">Processed by State Machine</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Active JIT APIs</div>
          <div class="metric-val" id="val-jit-count" style="color: var(--accent-cyan);">0</div>
          <div class="metric-sub">Deployed Conway Nodes</div>
        </div>
      </div>

      <div class="terminal-box">
        <div class="terminal-head">
          <span>📡 REAL TRANSACTION LIFECYCLE EVENT STREAM</span>
          <span style="color: var(--accent-green); font-size: 0.75rem;" id="stream-status">● LIVE STREAM</span>
        </div>
        <table class="tx-table">
          <thead>
            <tr>
              <th>TX ID</th>
              <th>MODE</th>
              <th>AGENT</th>
              <th>ENDPOINT</th>
              <th>STATUS</th>
              <th>PAYMENT</th>
              <th>STATE</th>
            </tr>
          </thead>
          <tbody id="tx-rows">
            <tr><td colspan="7" style="text-align: center; color: var(--text-dim);">Listening for live requests...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="right-pane">
      <div class="terminal-box" style="padding: 1rem;">
        <div class="terminal-head" style="margin: -1rem -1rem 1rem -1rem;">
          <span>⚡ REAL EXECUTION TERMINAL</span>
        </div>

        <button class="action-btn" onclick="executeRealScrape()">
          <span>1. Execute Agent Scrape</span>
          <span style="color: var(--accent-cyan);">$0.02 USDC</span>
        </button>

        <button class="action-btn" onclick="executeRealJitApi()">
          <span>2. Provision JIT Micro-API</span>
          <span style="color: var(--accent-purple);">$0.50 USDC</span>
        </button>

        <button class="action-btn" onclick="executeReal402Challenge()">
          <span>3. Trigger Raw HTTP 402</span>
          <span style="color: var(--accent-yellow);">CHALLENGE</span>
        </button>

        <button class="action-btn" onclick="toggleMode()" style="margin-top: 1rem; border-color: var(--text-dim);">
          <span>Toggle Mode: <span id="btn-mode-txt">DEMO MODE</span></span>
          <span>⇄</span>
        </button>
      </div>

      <div class="terminal-box" style="padding: 1rem;">
        <div class="terminal-head" style="margin: -1rem -1rem 1rem -1rem;">
          <span>📋 TARGET WALLET SPEC</span>
        </div>
        <div style="font-size: 0.72rem; line-height: 1.6; color: var(--text-dim);">
          <div><strong>Chain:</strong> Base (eip155:8453)</div>
          <div><strong>Facilitator:</strong> ${facilitatorUrl}</div>
          <div><strong>Address:</strong></div>
          <div style="color: var(--accent-cyan); word-break: break-all; margin-top: 0.2rem;">${payToAddress}</div>
        </div>
      </div>
    </div>
  </main>

  <!-- Modal Inspector -->
  <div class="modal-overlay" id="modal-overlay" onclick="closeModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
        <div>
          <span style="font-weight:800; font-size:1.1rem; color:var(--accent-cyan);" id="modal-tx-id">TX-000000</span>
          <span class="mode-badge mode-demo" id="modal-tx-mode" style="margin-left:0.5rem;">DEMO</span>
        </div>
        <button onclick="closeModal(null)" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:1.2rem;">✕</button>
      </div>

      <div style="margin-top:1rem; font-size:0.8rem; display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; color:var(--text-dim);">
        <div>Agent: <span style="color:#FFF" id="modal-agent">-</span></div>
        <div>Endpoint: <span style="color:#FFF" id="modal-endpoint">-</span></div>
        <div>Price: <span style="color:var(--accent-green)" id="modal-price">-</span></div>
        <div>Settled: <span style="color:#FFF" id="modal-settled">-</span></div>
      </div>

      <div style="margin-top:1.25rem;">
        <div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Complete 7-Stage State Machine Lifecycle</div>
        <div class="timeline" id="modal-timeline"></div>
      </div>
    </div>
  </div>

  <script>
    let isDemoMode = true;

    async function updateDashboard() {
      try {
        const [healthRes, txRes] = await Promise.all([
          fetch('/v1/health'),
          fetch('/v1/transactions')
        ]);

        const healthData = await healthRes.json();
        const txData = await txRes.json();

        // 1. Health Grid
        const h = healthData.health || {};
        document.getElementById('health-grid').innerHTML = \`
          <div class="health-item"><span class="dot dot-\${h.gateway === 'GREEN' ? 'green' : 'red'}"></span> Gateway</div>
          <div class="health-item"><span class="dot dot-\${h.facilitator === 'GREEN' ? 'green' : 'yellow'}"></span> Facilitator</div>
          <div class="health-item"><span class="dot dot-\${h.baseNetwork === 'GREEN' ? 'green' : 'yellow'}"></span> Base RPC</div>
          <div class="health-item"><span class="dot dot-\${h.wallet === 'GREEN' ? 'green' : 'red'}"></span> Wallet</div>
          <div class="health-item"><span class="dot dot-\${h.scrapeEndpoint === 'GREEN' ? 'green' : 'red'}"></span> Scrape</div>
          <div class="health-item"><span class="dot dot-\${h.jitEngine === 'GREEN' ? 'green' : 'red'}"></span> JIT Engine</div>
        \`;

        // 2. Metrics
        const s = txData.stats || {};
        document.getElementById('val-live-rev').innerText = '$' + (s.liveRevenueUsdc || '0.00') + ' USDC';
        document.getElementById('val-live-tx').innerText = (s.liveTxCount || 0) + ' Live Transactions';

        document.getElementById('val-demo-rev').innerText = '$' + (s.demoRevenueUsdc || '0.00') + ' USDC';
        document.getElementById('val-demo-tx').innerText = (s.demoTxCount || 0) + ' Demo Transactions';

        document.getElementById('val-total-tx').innerText = s.totalTransactions || 0;
        document.getElementById('val-jit-count').innerText = txData.totalApis || 0;

        // 3. Transactions Table
        const rows = document.getElementById('tx-rows');
        const txs = txData.transactions || [];

        if (txs.length === 0) {
          rows.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-dim);">Listening for live requests...</td></tr>';
          return;
        }

        rows.innerHTML = '';
        txs.forEach(t => {
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td><span class="tx-id" onclick="inspectTx('\${t.txId}')">\${t.txId}</span></td>
            <td><span class="mode-badge \${t.mode === 'LIVE' ? 'mode-live' : 'mode-demo'}">\${t.mode}</span></td>
            <td style="color:var(--text-dim)">\${t.agent.slice(0, 18)}</td>
            <td>\${t.endpoint}</td>
            <td><span class="status-\${t.httpStatus}">\${t.httpStatus}</span></td>
            <td style="color:var(--accent-green); font-weight:700;">$\${t.priceUsdc} USDC</td>
            <td><span style="color:var(--accent-cyan)">\${t.currentState}</span></td>
          \`;
          rows.appendChild(tr);
        });
      } catch (err) {
        console.error('Failed to update dashboard:', err);
      }
    }

    async function inspectTx(txId) {
      try {
        const res = await fetch('/v1/transaction/' + txId);
        const data = await res.json();
        const tx = data.transaction;

        document.getElementById('modal-tx-id').innerText = tx.txId;
        document.getElementById('modal-tx-mode').innerText = tx.mode;
        document.getElementById('modal-tx-mode').className = 'mode-badge ' + (tx.mode === 'LIVE' ? 'mode-live' : 'mode-demo');
        document.getElementById('modal-agent').innerText = tx.agent;
        document.getElementById('modal-endpoint').innerText = tx.endpoint;
        document.getElementById('modal-price').innerText = '$' + tx.priceUsdc + ' USDC';
        document.getElementById('modal-settled').innerText = tx.isSettled ? 'YES (Verified)' : 'NO (Challenged/Pending)';

        const timeline = document.getElementById('modal-timeline');
        timeline.innerHTML = '';

        tx.transitions.forEach(s => {
          const div = document.createElement('div');
          div.className = 'timeline-step active';
          div.innerHTML = \`
            <div class="step-title">\${s.state} · <span style="font-size:0.7rem; color:var(--text-dim)">\${new Date(s.timestamp).toLocaleTimeString()}</span></div>
            <div class="step-desc">\${s.detail}</div>
          \`;
          timeline.appendChild(div);
        });

        document.getElementById('modal-overlay').style.display = 'flex';
      } catch (err) {
        alert('Failed to load transaction details: ' + err.message);
      }
    }

    function closeModal(e) {
      if (!e || e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').style.display = 'none';
      }
    }

    function toggleMode() {
      isDemoMode = !isDemoMode;
      const ind = document.getElementById('mode-indicator');
      const btnTxt = document.getElementById('btn-mode-txt');
      if (isDemoMode) {
        ind.className = 'mode-badge mode-demo';
        ind.innerText = 'DEMO MODE';
        btnTxt.innerText = 'DEMO MODE';
      } else {
        ind.className = 'mode-badge mode-live';
        ind.innerText = 'LIVE MODE';
        btnTxt.innerText = 'LIVE MODE';
      }
    }

    async function executeRealScrape() {
      const headers = {};
      if (isDemoMode) headers['X-Demo-Mode'] = 'true';
      headers['X-402-Payment-Signature'] = '0xMockSignature_' + Math.random().toString(36).substring(2);

      await fetch('/v1/scrape?url=https://news.ycombinator.com', { headers });
      updateDashboard();
    }

    async function executeRealJitApi() {
      const headers = { 'Content-Type': 'application/json' };
      if (isDemoMode) headers['X-Demo-Mode'] = 'true';
      headers['X-402-Payment-Signature'] = '0xMockSignature_' + Math.random().toString(36).substring(2);

      await fetch('/v1/factory/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'TeslaInventoryMiami',
          targetUrl: 'https://www.tesla.com/inventory/new/m3',
          pricePerQueryUsdc: '0.15'
        })
      });
      updateDashboard();
    }

    async function executeReal402Challenge() {
      await fetch('/v1/scrape?url=https://example.com');
      updateDashboard();
    }

    setInterval(updateDashboard, 1500);
    updateDashboard();
  </script>
</body>
</html>`;
}
