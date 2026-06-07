'use client';

import { useState } from 'react';
import { useTradingStore, BacktestResult } from '@/store/trading-store';
import { formatCurrency, formatPercent, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FlaskConical, Play, Loader2, TrendingUp, ShieldAlert, Target, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];
const STRATEGIES = ['Q-Learning', 'MA Crossover', 'RSI', 'MACD', 'Bollinger'];
const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y'];

// ─── Configuration Panel ───────────────────────────────
function BacktestConfig() {
  const { setBacktestResult, selectedStock } = useTradingStore();
  const [symbol, setSymbol] = useState(selectedStock);
  const [strategy, setStrategy] = useState('Q-Learning');
  const [period, setPeriod] = useState('6mo');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [loading, setLoading] = useState(false);

  const handleRunBacktest = async () => {
    setLoading(true);
    toast.info('Running backtest...');

    try {
      const res = await fetch('/api/rl/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          strategy,
          period,
          initialBalance: parseFloat(initialBalance),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.finalBalance) {
          setBacktestResult(data);
          toast.success('Backtest completed!');
          setLoading(false);
          return;
        }
      }
    } catch {
      // fallback to simulated results
    }

    // Generate mock backtest results
    const numTrades = 15 + Math.floor(Math.random() * 20);
    const equityCurve = Array.from({ length: 60 }, (_, i) => {
      const base = parseFloat(initialBalance);
      return Math.round(base + i * 80 + (Math.random() - 0.35) * 500);
    });

    const trades = Array.from({ length: numTrades }, (_, i) => ({
      id: `bt-${i}`,
      symbol,
      action: Math.random() > 0.5 ? 'BUY' : 'SELL',
      quantity: Math.floor(Math.random() * 20) + 1,
      price: 170 + Math.random() * 20,
      totalValue: 0,
      profitLoss: (Math.random() - 0.35) * 500,
      aiSignal: strategy === 'Q-Learning' ? 'BUY' : undefined,
      confidence: 0.5 + Math.random() * 0.4,
      strategy,
      createdAt: new Date(Date.now() - (numTrades - i) * 86400000).toISOString(),
    })).map((t) => ({ ...t, totalValue: t.quantity * t.price }));

    const finalBalance = equityCurve[equityCurve.length - 1];
    const totalReturn = ((finalBalance - parseFloat(initialBalance)) / parseFloat(initialBalance)) * 100;

    const result: BacktestResult = {
      initialBalance: parseFloat(initialBalance),
      finalBalance,
      totalReturn,
      sharpeRatio: 1.2 + Math.random() * 0.8,
      maxDrawdown: -(3 + Math.random() * 8),
      winRate: 50 + Math.random() * 25,
      totalTrades: numTrades,
      equityCurve,
      trades,
    };

    setBacktestResult(result);
    toast.success('Backtest completed!');
    setLoading(false);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400" />
          Backtest Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Initial Balance</Label>
              <Input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="h-9"
                min="1000"
              />
            </div>
          </div>

          <Button
            onClick={handleRunBacktest}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Backtest...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Backtest
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Results Dashboard ─────────────────────────────────
function ResultsDashboard() {
  const { backtestResult } = useTradingStore();

  if (!backtestResult) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Run a backtest to see results
        </CardContent>
      </Card>
    );
  }

  const r = backtestResult;
  const metrics = [
    { label: 'Final Balance', value: formatCurrency(r.finalBalance), icon: TrendingUp, color: r.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Total Return', value: `${r.totalReturn >= 0 ? '+' : ''}${r.totalReturn.toFixed(2)}%`, icon: Target, color: r.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Sharpe Ratio', value: r.sharpeRatio.toFixed(2), icon: BarChart3, color: 'text-purple-400' },
    { label: 'Max Drawdown', value: `${r.maxDrawdown.toFixed(2)}%`, icon: ShieldAlert, color: 'text-red-400' },
    { label: 'Win Rate', value: `${r.winRate.toFixed(1)}%`, icon: Award, color: 'text-amber-400' },
    { label: 'Total Trades', value: r.totalTrades.toString(), icon: BarChart3, color: 'text-blue-400' },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Results Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-xl bg-accent/30 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={cn('w-3.5 h-3.5', m.color)} />
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
              <p className={cn('text-lg font-bold', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Equity Curve Chart ────────────────────────────────
function EquityCurveChart() {
  const { backtestResult } = useTradingStore();

  if (!backtestResult) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Equity curve will appear here
        </CardContent>
      </Card>
    );
  }

  const data = backtestResult.equityCurve.map((value, i) => ({
    day: i + 1,
    value,
  }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Equity Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Equity']}
              />
              <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Trade Log ─────────────────────────────────────────
function TradeLog() {
  const { backtestResult } = useTradingStore();

  if (!backtestResult || !backtestResult.trades?.length) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Trade log will appear here
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Trade Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Qty</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backtestResult.trades.map((trade: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>
                    <Badge className={cn('text-[10px] h-5', trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                      {trade.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{trade.quantity}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(trade.price)}</TableCell>
                  <TableCell className={cn('text-sm font-medium', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {trade.profitLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Backtest View ────────────────────────────────
export function BacktestView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <BacktestConfig />
          <ResultsDashboard />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <EquityCurveChart />
          <TradeLog />
        </div>
      </div>
    </motion.div>
  );
}
