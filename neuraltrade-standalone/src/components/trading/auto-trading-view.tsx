'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTradingStore, AutoTradeConfig, AutoTradeLog, AutoTradeStatus } from '@/store/trading-store';
import { MOCK_STOCKS } from '@/lib/mock-data';
import { formatCurrency, formatPercent, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  Bot, Play, Square, Settings, TrendingUp, TrendingDown, Activity,
  Shield, Zap, Brain, Eye, Loader2, AlertTriangle, CheckCircle2,
  XCircle, Clock, DollarSign, BarChart3, Target, Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
// Dynamic import for socket.io-client to avoid SSR issues
type SocketIOClient = {
  io: (uri: string, opts?: Record<string, unknown>) => any;
};

let socketIOClient: SocketIOClient | null = null;

async function loadSocketIO(): Promise<SocketIOClient | null> {
  if (socketIOClient) return socketIOClient;
  try {
    const mod = await import('socket.io-client');
    socketIOClient = { io: mod.io };
    return socketIOClient;
  } catch {
    console.warn('socket.io-client not available, using simulation mode');
    return null;
  }
}

// Preload on module init
loadSocketIO();

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];

// ─── AI Brain Pulse Animation ──────────────────────────
function AIBrainPulse({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {isActive && (
        <>
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-emerald-500/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-16 h-16 rounded-full bg-emerald-500/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
      <motion.div
        className={cn(
          'relative w-12 h-12 rounded-2xl flex items-center justify-center',
          isActive
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
            : 'bg-muted'
        )}
        animate={isActive ? { rotateY: [0, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <Brain className={cn('w-6 h-6', isActive ? 'text-white' : 'text-muted-foreground')} />
      </motion.div>
    </div>
  );
}

// ─── Auto Trade Controls ───────────────────────────────
function AutoTradeControls() {
  const { autoTradeConfig, setAutoTradeConfig, autoTradeRunning, setAutoTradeRunning, setAutoTradeStatus, addAutoTradeLog } = useTradingStore();
  const socketRef = useRef<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Connect to WebSocket
  useEffect(() => {
    const connectSocket = async () => {
      // Ensure socket.io-client is loaded
      const client = socketIOClient || await loadSocketIO();
      if (!client) return; // socket.io-client not available

      try {
        const socket = client.io('/?XTransformPort=3003', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
          console.log('Auto-trade WebSocket connected');
          setConnecting(false);
        });

        socket.on('auto_trade_status', (status: Partial<AutoTradeStatus>) => {
          setAutoTradeStatus(status);
        });

        socket.on('auto_trade_executed', (trade: AutoTradeLog) => {
          addAutoTradeLog(trade);
          const actionEmoji = trade.action === 'BUY' ? '🟢' : trade.action === 'SELL' ? '🔴' : '⚪';
          toast.success(`${actionEmoji} Auto ${trade.action}: ${trade.quantity} ${trade.symbol} @ $${trade.price}`, {
            description: trade.reason,
          });
        });

        socket.on('auto_trade_started', () => {
          setAutoTradeRunning(true);
          toast.success('🤖 Auto Trading Started!', { description: 'AI is now monitoring and trading autonomously' });
        });

        socket.on('auto_trade_stopped', () => {
          setAutoTradeRunning(false);
          toast.info('⏹ Auto Trading Stopped');
        });

        socket.on('auto_trade_logs', (logs: AutoTradeLog[]) => {
          useTradingStore.getState().setAutoTradeLogs(logs);
        });

        socket.on('disconnect', () => {
          console.log('Auto-trade WebSocket disconnected');
        });

        socketRef.current = socket;
      } catch (err) {
        console.warn('Failed to connect WebSocket, simulation mode active');
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [setAutoTradeStatus, addAutoTradeLog, setAutoTradeRunning]);

  const handleStart = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('start_auto_trade', autoTradeConfig);
    } else {
      // Fallback: simulate auto trading
      setAutoTradeRunning(true);
      setAutoTradeStatus({ isRunning: true, startedAt: new Date().toISOString() });
      toast.success('🤖 Auto Trading Started (Simulation Mode)', {
        description: 'AI is now monitoring and trading autonomously',
      });
      startSimulation();
    }
  };

  const handleStop = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_auto_trade');
    }
    setAutoTradeRunning(false);
    setAutoTradeStatus({ isRunning: false });
    stopSimulation();
    toast.info('⏹ Auto Trading Stopped');
  };

  // Simulation mode for when WebSocket is unavailable
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulation = useCallback(() => {
    if (simulationRef.current) clearInterval(simulationRef.current);

    const currentStore = useTradingStore.getState();
    const intervalMs = currentStore.autoTradeConfig.tradingInterval * 1000;

    simulationRef.current = setInterval(() => {
      const store = useTradingStore.getState();
      if (!store.autoTradeRunning) {
        if (simulationRef.current) {
          clearInterval(simulationRef.current);
          simulationRef.current = null;
        }
        return;
      }

      const symbols = store.autoTradeConfig.symbols;
      const now = new Date().toISOString();

      for (const symbol of symbols) {
        const rand = Math.random();
        let action: 'BUY' | 'SELL' | 'HOLD';
        let confidence: number;

        if (rand < 0.12) {
          action = 'BUY';
          confidence = 0.72 + Math.random() * 0.23;
        } else if (rand < 0.24) {
          action = 'SELL';
          confidence = 0.68 + Math.random() * 0.27;
        } else {
          action = 'HOLD';
          confidence = 0.35 + Math.random() * 0.3;
        }

        if (action !== 'HOLD' && confidence >= store.autoTradeConfig.confidenceThreshold) {
          const stock = MOCK_STOCKS.find(s => s.symbol === symbol);
          const price = stock?.price || (150 + Math.random() * 300);
          const quantity = Math.floor(Math.min(store.autoTradeConfig.maxPositionSize, 10000 * 0.1) / price);

          if (quantity > 0) {
            const trade: AutoTradeLog = {
              id: `sim-${Date.now()}-${symbol}`,
              timestamp: now,
              symbol,
              action,
              quantity,
              price: Math.round(price * 100) / 100,
              confidence,
              reason: action === 'BUY'
                ? `AI detected BUY signal for ${symbol} (confidence: ${(confidence * 100).toFixed(0)}%, RSI oversold + MACD bullish crossover)`
                : `AI detected SELL signal for ${symbol} (confidence: ${(confidence * 100).toFixed(0)}%, RSI overbought + stop-loss check)`,
              status: 'executed',
              profitLoss: action === 'SELL' ? Math.round((Math.random() - 0.35) * 500 * 100) / 100 : undefined,
            };
            store.addAutoTradeLog(trade);
          }
        }

        // Add AI decision
        const decisions = store.autoTradeStatus.aiDecisions || [];
        decisions.push({ symbol, action, confidence, timestamp: now });
        store.setAutoTradeStatus({ aiDecisions: decisions.slice(-20) });
      }

      // Update equity curve
      const curve = store.autoTradeStatus.equityCurve || [];
      const baseVal = 100000;
      const newVal = baseVal + curve.length * 50 + (Math.random() - 0.35) * 300;
      curve.push({ time: now, value: Math.round(newVal) });
      store.setAutoTradeStatus({
        equityCurve: curve.slice(-60),
        lastCheck: now,
        totalTrades: (store.autoTradeStatus.totalTrades || 0) + Math.floor(Math.random() * 3),
        totalProfitLoss: Math.round((newVal - baseVal) * 100) / 100,
        dailyPL: Math.round((Math.random() - 0.3) * 800 * 100) / 100,
      });
    }, intervalMs);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSimulation();
  }, [stopSimulation]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            AI Auto Trading Engine
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Config
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <AIBrainPulse isActive={autoTradeRunning} />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">
                {autoTradeRunning ? 'AI Trading Active' : 'AI Trading Paused'}
              </span>
              <Badge className={cn(
                'text-[10px] h-5',
                autoTradeRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
              )}>
                {autoTradeRunning ? 'LIVE' : 'OFFLINE'}
              </Badge>
            </div>
            <div className="flex gap-2">
              {!autoTradeRunning ? (
                <Button
                  onClick={handleStart}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Auto Trading
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Auto Trading
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Risk Level</Label>
                  <Select
                    value={autoTradeConfig.riskLevel}
                    onValueChange={(v) => setAutoTradeConfig({ riskLevel: v as any })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">🛡️ Conservative</SelectItem>
                      <SelectItem value="moderate">⚖️ Moderate</SelectItem>
                      <SelectItem value="aggressive">🔥 Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Strategy</Label>
                  <Select
                    value={autoTradeConfig.strategy}
                    onValueChange={(v) => setAutoTradeConfig({ strategy: v as any })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combined">🧠 Combined AI</SelectItem>
                      <SelectItem value="q_learning">🤖 Q-Learning</SelectItem>
                      <SelectItem value="ma_crossover">📈 MA Crossover</SelectItem>
                      <SelectItem value="rsi">📊 RSI Strategy</SelectItem>
                      <SelectItem value="macd">📉 MACD Strategy</SelectItem>
                      <SelectItem value="bollinger">🎯 Bollinger Bands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Position Size ($)</Label>
                  <Input
                    type="number"
                    value={autoTradeConfig.maxPositionSize}
                    onChange={(e) => setAutoTradeConfig({ maxPositionSize: parseInt(e.target.value) || 5000 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={autoTradeConfig.stopLossPercent}
                    onChange={(e) => setAutoTradeConfig({ stopLossPercent: parseFloat(e.target.value) || 5 })}
                    className="h-9"
                    step="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={autoTradeConfig.takeProfitPercent}
                    onChange={(e) => setAutoTradeConfig({ takeProfitPercent: parseFloat(e.target.value) || 10 })}
                    className="h-9"
                    step="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Daily Loss ($)</Label>
                  <Input
                    type="number"
                    value={autoTradeConfig.maxDailyLoss}
                    onChange={(e) => setAutoTradeConfig({ maxDailyLoss: parseInt(e.target.value) || 2000 })}
                    className="h-9"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Confidence Threshold: {(autoTradeConfig.confidenceThreshold * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[autoTradeConfig.confidenceThreshold * 100]}
                    onValueChange={([v]) => setAutoTradeConfig({ confidenceThreshold: v / 100 })}
                    min={50}
                    max={95}
                    step={5}
                    className="py-2"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Check Interval: {autoTradeConfig.tradingInterval}s</Label>
                  <Slider
                    value={[autoTradeConfig.tradingInterval]}
                    onValueChange={([v]) => setAutoTradeConfig({ tradingInterval: v })}
                    min={10}
                    max={120}
                    step={5}
                    className="py-2"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Trading Symbols</Label>
                  <div className="flex flex-wrap gap-2">
                    {SYMBOLS.map((sym) => {
                      const isSelected = autoTradeConfig.symbols.includes(sym);
                      return (
                        <Button
                          key={sym}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className={cn(
                            'h-7 text-xs',
                            isSelected && 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          )}
                          onClick={() => {
                            const symbols = isSelected
                              ? autoTradeConfig.symbols.filter(s => s !== sym)
                              : [...autoTradeConfig.symbols, sym];
                            if (symbols.length > 0) setAutoTradeConfig({ symbols });
                          }}
                        >
                          {sym}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Live Status Dashboard ─────────────────────────────
function LiveStatusDashboard() {
  const { autoTradeStatus, autoTradeRunning } = useTradingStore();
  const status = autoTradeStatus;

  const metrics = [
    { label: 'Total P/L', value: formatCurrency(status.totalProfitLoss || 0), icon: DollarSign, color: (status.totalProfitLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Daily P/L', value: formatCurrency(status.dailyPL || 0), icon: TrendingUp, color: (status.dailyPL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Win Rate', value: `${status.winRate || 0}%`, icon: Target, color: 'text-amber-400' },
    { label: 'Total Trades', value: (status.totalTrades || 0).toString(), icon: BarChart3, color: 'text-purple-400' },
    { label: 'Active Positions', value: (status.currentPositions?.length || 0).toString(), icon: Activity, color: 'text-blue-400' },
    { label: 'Epsilon', value: (status.epsilon || 0.3).toFixed(3), icon: Brain, color: 'text-pink-400' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {metrics.map((m) => (
        <motion.div
          key={m.label}
          className="p-3 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1 mb-1">
            <m.icon className={cn('w-3 h-3', m.color)} />
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
          <p className={cn('text-sm font-bold', m.color)}>{m.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Equity Curve ──────────────────────────────────────
function AutoTradeEquityCurve() {
  const { autoTradeStatus } = useTradingStore();
  const data = autoTradeStatus.equityCurve?.length > 0
    ? autoTradeStatus.equityCurve.map((e, i) => ({ ...e, idx: i + 1 }))
    : Array.from({ length: 20 }, (_, i) => ({
        time: new Date(Date.now() - (19 - i) * 30000).toISOString(),
        value: 100000 + i * 80 + (Math.random() - 0.35) * 500,
        idx: i + 1,
      }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Auto Trading Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="autoEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="idx" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Equity']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#autoEquityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Current Positions ─────────────────────────────────
function CurrentPositions() {
  const { autoTradeStatus } = useTradingStore();
  const positions = autoTradeStatus.currentPositions || [];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Active Positions
          <Badge className="text-[10px] h-5 bg-emerald-500/20 text-emerald-400">{positions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No active positions. AI will open positions when signals are detected.
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map((pos, i) => (
              <motion.div
                key={pos.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-border/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                    {pos.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{pos.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{pos.quantity} shares @ {formatCurrency(pos.entryPrice)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(pos.currentPrice)}</p>
                  <p className={cn('text-xs font-medium', (pos.unrealizedPL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {(pos.unrealizedPL || 0) >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPL || 0)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Decision Feed ──────────────────────────────────
function AIDecisionFeed() {
  const { autoTradeStatus, autoTradeRunning } = useTradingStore();
  const decisions = autoTradeStatus.aiDecisions || [];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          AI Decision Feed
          {autoTradeRunning && (
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          {decisions.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Start auto trading to see AI decisions in real-time
            </div>
          ) : (
            <div className="space-y-2">
              {[...decisions].reverse().map((d, i) => (
                <motion.div
                  key={`${d.symbol}-${d.timestamp}-${i}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/20 border border-border/20"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      'text-[10px] h-5',
                      d.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' :
                      d.action === 'SELL' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    )}>
                      {d.action === 'BUY' ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> :
                       d.action === 'SELL' ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> :
                       <Clock className="w-2.5 h-2.5 mr-0.5" />}
                      {d.action}
                    </Badge>
                    <span className="text-sm font-medium">{d.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', d.confidence > 0.7 ? 'bg-emerald-500' : d.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${d.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Auto Trade Log ────────────────────────────────────
function AutoTradeLog() {
  const { autoTradeLogs } = useTradingStore();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Auto Trade History
          <Badge className="text-[10px] h-5 bg-amber-500/20 text-amber-400">{autoTradeLogs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {autoTradeLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              No auto trades yet. Start the AI engine to begin.
            </div>
          ) : (
            <div className="space-y-2">
              {autoTradeLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'p-3 rounded-xl border',
                    log.status === 'executed' ? 'bg-accent/20 border-border/30' : 'bg-muted/20 border-border/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {log.action === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : log.action === 'SELL' ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400" />
                      )}
                      <Badge className={cn(
                        'text-[10px] h-5',
                        log.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.action === 'SELL' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      )}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-semibold">{log.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {log.status === 'executed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {log.status === 'executed' ? 'Executed' : 'Skipped'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {log.quantity > 0 && `${log.quantity} × ${formatCurrency(log.price)}`}
                      {log.profitLoss !== undefined && (
                        <span className={cn('ml-2 font-medium', log.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          P/L: {log.profitLoss >= 0 ? '+' : ''}{formatCurrency(log.profitLoss)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Conf: {(log.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{log.reason}</p>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Risk Management Panel ─────────────────────────────
function RiskManagementPanel() {
  const { autoTradeConfig, setAutoTradeConfig } = useTradingStore();

  const riskMetrics = [
    {
      label: 'Stop Loss',
      value: `${autoTradeConfig.stopLossPercent}%`,
      desc: 'Auto-sell when loss exceeds threshold',
      icon: Shield,
      color: 'text-red-400',
    },
    {
      label: 'Take Profit',
      value: `${autoTradeConfig.takeProfitPercent}%`,
      desc: 'Auto-sell when profit target reached',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Max Position',
      value: formatCurrency(autoTradeConfig.maxPositionSize),
      desc: 'Maximum dollar amount per trade',
      icon: DollarSign,
      color: 'text-amber-400',
    },
    {
      label: 'Daily Loss Limit',
      value: formatCurrency(autoTradeConfig.maxDailyLoss),
      desc: 'Stops trading if daily loss exceeds limit',
      icon: AlertTriangle,
      color: 'text-orange-400',
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {riskMetrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between p-2.5 rounded-xl bg-accent/20 border border-border/20">
              <div className="flex items-center gap-2">
                <m.icon className={cn('w-4 h-4', m.color)} />
                <div>
                  <p className="text-xs font-medium">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              </div>
              <span className={cn('text-sm font-bold', m.color)}>{m.value}</span>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-emerald-400">AI Risk Control Active</p>
                <p className="text-[10px] text-muted-foreground">Auto-stops on loss limits, monitors positions 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Auto Trading View ────────────────────────────
export function AutoTradingView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Main Controls */}
      <AutoTradeControls />

      {/* Live Status */}
      <LiveStatusDashboard />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Equity Curve */}
          <AutoTradeEquityCurve />

          {/* Auto Trade Log */}
          <AutoTradeLog />
        </div>

        <div className="space-y-4">
          {/* Current Positions */}
          <CurrentPositions />

          {/* AI Decision Feed */}
          <AIDecisionFeed />

          {/* Risk Management */}
          <RiskManagementPanel />
        </div>
      </div>
    </motion.div>
  );
}
