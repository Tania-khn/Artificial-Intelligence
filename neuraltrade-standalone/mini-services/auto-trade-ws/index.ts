import { Server } from 'socket.io';
import http from 'http';

const PORT = 3003;

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Auto trading state
let autoTradeState = {
  isRunning: false,
  config: {
    symbols: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'],
    maxPositionSize: 5000,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    maxDailyLoss: 2000,
    confidenceThreshold: 0.7,
    tradingInterval: 30,
    strategy: 'combined',
    riskLevel: 'moderate',
  },
  status: {
    isRunning: false,
    startedAt: null as string | null,
    balance: 100000,
    totalValue: 100000,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfitLoss: 0,
    dailyPL: 0,
    currentPositions: [] as any[],
    lastCheck: null as string | null,
    aiDecisions: [] as any[],
    equityCurve: [] as any[],
    epsilon: 0.3,
    qTableSize: 0,
  },
  tradeLogs: [] as any[],
  cycleTimer: null as ReturnType<typeof setInterval> | null,
};

async function runAutoTradeCycle() {
  if (!autoTradeState.isRunning) return;

  try {
    const response = await fetch(
      `http://localhost:3031/api/auto/cycle?XTransformPort=3031`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...autoTradeState.config,
          balance: autoTradeState.status.balance,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.status) {
        autoTradeState.status = {
          ...autoTradeState.status,
          ...data.status,
        };

        // Emit status update
        io.emit('auto_trade_status', autoTradeState.status);
      }

      if (data.cycleResults?.length > 0) {
        for (const trade of data.cycleResults) {
          if (trade.status === 'executed') {
            autoTradeState.tradeLogs.unshift(trade);
            if (autoTradeState.tradeLogs.length > 100) {
              autoTradeState.tradeLogs = autoTradeState.tradeLogs.slice(0, 100);
            }

            // Emit new trade
            io.emit('auto_trade_executed', trade);
          }
        }
      }
    }
  } catch (error) {
    // Simulate trade for demo when Python service is unavailable
    simulateTradeCycle();
  }
}

function simulateTradeCycle() {
  const symbols = autoTradeState.config.symbols;
  const now = new Date().toISOString();

  for (const symbol of symbols) {
    // Simulate AI decision
    const rand = Math.random();
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let status: 'executed' | 'skipped';

    const hasPosition = autoTradeState.status.currentPositions.some(
      (p: any) => p.symbol === symbol
    );

    if (rand < 0.15 && !hasPosition) {
      action = 'BUY';
      confidence = 0.7 + Math.random() * 0.25;
      status = confidence >= autoTradeState.config.confidenceThreshold ? 'executed' : 'skipped';
    } else if (rand < 0.30 && hasPosition) {
      action = 'SELL';
      confidence = 0.65 + Math.random() * 0.3;
      status = 'executed';
    } else {
      action = 'HOLD';
      confidence = 0.4 + Math.random() * 0.3;
      status = 'skipped';
    }

    if (status === 'executed') {
      const price = 150 + Math.random() * 300;
      const quantity = Math.floor(
        Math.min(autoTradeState.config.maxPositionSize, autoTradeState.status.balance * 0.1) / price
      );

      if (action === 'BUY' && quantity > 0) {
        const cost = quantity * price;
        autoTradeState.status.balance -= cost;
        autoTradeState.status.currentPositions.push({
          symbol,
          quantity,
          entryPrice: price,
          currentPrice: price,
          unrealizedPL: 0,
        });
        autoTradeState.status.totalTrades++;

        const trade = {
          id: `sim-${Date.now()}-${symbol}`,
          timestamp: now,
          symbol,
          action: 'BUY',
          quantity,
          price: Math.round(price * 100) / 100,
          confidence,
          reason: `AI Auto-Trade: BUY signal (confidence: ${(confidence * 100).toFixed(0)}%)`,
          status: 'executed',
        };
        autoTradeState.tradeLogs.unshift(trade);
        io.emit('auto_trade_executed', trade);
      } else if (action === 'SELL') {
        const posIdx = autoTradeState.status.currentPositions.findIndex(
          (p: any) => p.symbol === symbol
        );
        if (posIdx >= 0) {
          const pos = autoTradeState.status.currentPositions[posIdx];
          const profit = (price - pos.entryPrice) * pos.quantity;
          autoTradeState.status.balance += pos.quantity * price;
          autoTradeState.status.dailyPL += profit;
          autoTradeState.status.totalProfitLoss += profit;

          if (profit > 0) autoTradeState.status.winningTrades++;
          else autoTradeState.status.losingTrades++;

          autoTradeState.status.totalTrades++;
          autoTradeState.status.currentPositions.splice(posIdx, 1);

          const trade = {
            id: `sim-${Date.now()}-${symbol}`,
            timestamp: now,
            symbol,
            action: 'SELL',
            quantity: pos.quantity,
            price: Math.round(price * 100) / 100,
            confidence,
            reason: `AI Auto-Trade: SELL signal (P/L: $${profit.toFixed(2)})`,
            profitLoss: Math.round(profit * 100) / 100,
            status: 'executed',
          };
          autoTradeState.tradeLogs.unshift(trade);
          io.emit('auto_trade_executed', trade);
        }
      }
    }

    // Record AI decision
    autoTradeState.status.aiDecisions.push({
      symbol,
      action,
      confidence,
      timestamp: now,
    });
  }

  // Keep only last 20 decisions
  autoTradeState.status.aiDecisions = autoTradeState.status.aiDecisions.slice(-20);

  // Update equity curve
  const positionsValue = autoTradeState.status.currentPositions.reduce(
    (sum: number, p: any) => sum + p.currentPrice * p.quantity,
    0
  );
  const totalValue = autoTradeState.status.balance + positionsValue;
  autoTradeState.status.totalValue = Math.round(totalValue * 100) / 100;
  autoTradeState.status.equityCurve.push({ time: now, value: totalValue });
  autoTradeState.status.equityCurve = autoTradeState.status.equityCurve.slice(-60);
  autoTradeState.status.lastCheck = now;
  autoTradeState.status.winRate =
    autoTradeState.status.totalTrades > 0
      ? Math.round(
          (autoTradeState.status.winningTrades / autoTradeState.status.totalTrades) * 100
        )
      : 0;

  // Decay epsilon
  autoTradeState.status.epsilon = Math.max(
    0.05,
    autoTradeState.status.epsilon * 0.995
  );

  io.emit('auto_trade_status', autoTradeState.status);
  io.emit('auto_trade_logs', autoTradeState.tradeLogs.slice(0, 50));
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current state on connect
  socket.emit('auto_trade_status', autoTradeState.status);
  socket.emit('auto_trade_logs', autoTradeState.tradeLogs.slice(0, 50));
  socket.emit('auto_trade_config', autoTradeState.config);

  // Start auto trading
  socket.on('start_auto_trade', (config?: any) => {
    if (autoTradeState.isRunning) return;

    if (config) {
      autoTradeState.config = { ...autoTradeState.config, ...config };
    }

    autoTradeState.isRunning = true;
    autoTradeState.status.isRunning = true;
    autoTradeState.status.startedAt = new Date().toISOString();

    // Start cycle timer
    const intervalMs = autoTradeState.config.tradingInterval * 1000;
    autoTradeState.cycleTimer = setInterval(runAutoTradeCycle, intervalMs);

    // Run first cycle immediately
    runAutoTradeCycle();

    io.emit('auto_trade_started', { config: autoTradeState.config });
    io.emit('auto_trade_status', autoTradeState.status);

    console.log('Auto trading started with config:', autoTradeState.config);
  });

  // Stop auto trading
  socket.on('stop_auto_trade', () => {
    autoTradeState.isRunning = false;
    autoTradeState.status.isRunning = false;

    if (autoTradeState.cycleTimer) {
      clearInterval(autoTradeState.cycleTimer);
      autoTradeState.cycleTimer = null;
    }

    io.emit('auto_trade_stopped', { status: autoTradeState.status });
    io.emit('auto_trade_status', autoTradeState.status);

    console.log('Auto trading stopped');
  });

  // Update config
  socket.on('update_auto_trade_config', (config: any) => {
    autoTradeState.config = { ...autoTradeState.config, ...config };

    // Restart timer if running
    if (autoTradeState.isRunning && autoTradeState.cycleTimer) {
      clearInterval(autoTradeState.cycleTimer);
      const intervalMs = autoTradeState.config.tradingInterval * 1000;
      autoTradeState.cycleTimer = setInterval(runAutoTradeCycle, intervalMs);
    }

    io.emit('auto_trade_config', autoTradeState.config);
    console.log('Auto trade config updated:', config);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🤖 Auto Trade WebSocket running on port ${PORT}`);
});
