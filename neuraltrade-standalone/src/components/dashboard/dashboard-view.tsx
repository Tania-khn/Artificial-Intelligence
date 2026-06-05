'use client';

import { useEffect, useRef, useState } from 'react';
import { useTradingStore, StockData } from '@/store/trading-store';
import { MOCK_STOCKS, MOCK_TRADES, MOCK_PORTFOLIO, MOCK_PORTFOLIO_HISTORY } from '@/lib/mock-data';
import { formatCurrency, formatPercent, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Brain, Activity, Shield,
  ArrowUpRight, ArrowDownRight, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Ticker Bar ────────────────────────────────────────
function TickerBar() {
  const { liveStocks, setLiveStocks } = useTradingStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLiveStocks(MOCK_STOCKS);
  }, [setLiveStocks]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/stocks/multi?symbols=AAPL,TSLA,NVDA,MSFT,GOOGL,AMZN,META');
        if (res.ok) {
          const data = await res.json();
          if (data.stocks?.length) {
            setLiveStocks(data.stocks);
          }
        }
      } catch {
        // keep existing data
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [setLiveStocks]);

  const stocks = liveStocks.length > 0 ? liveStocks : MOCK_STOCKS;

  return (
    <div className="w-full overflow-hidden bg-card/30 border-b border-border/50">
      <div className="flex animate-scroll whitespace-nowrap py-2">
        <div className="flex gap-8 px-4 animate-marquee">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{stock.symbol}</span>
              <span className="text-muted-foreground">{formatCurrency(stock.price)}</span>
              <span className={cn('flex items-center text-xs font-medium', stock.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(stock.changePercent)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-8 px-4 animate-marquee" aria-hidden>
          {stocks.map((stock) => (
            <div key={`${stock.symbol}-dup`} className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{stock.symbol}</span>
              <span className="text-muted-foreground">{formatCurrency(stock.price)}</span>
              <span className={cn('flex items-center text-xs font-medium', stock.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(stock.changePercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Summary Card ────────────────────────────
function PortfolioSummary() {
  const { portfolio } = useTradingStore();
  const holdings = portfolio.length > 0 ? portfolio : MOCK_PORTFOLIO;
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0) || 102347.85;
  const dailyPL = 1247.32;
  const totalPL = 7347.85;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalValue)}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatCurrency(dailyPL)} today
              </span>
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                +{((totalPL / (totalValue - totalPL)) * 100).toFixed(2)}% total
              </span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_PORTFOLIO_HISTORY.slice(-7)}>
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Signal Card ────────────────────────────────────
function AISignalCard() {
  const { aiSignal, setAiSignal } = useTradingStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setAiSignal({ action: 'BUY', confidence: 0.87, score: 0.82 });
  }, [setAiSignal]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/rl/predict?symbol=AAPL');
        if (res.ok) {
          const data = await res.json();
          if (data.action) setAiSignal(data);
        }
      } catch {
        // keep existing
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [setAiSignal]);

  const signal = aiSignal || { action: 'BUY', confidence: 0.87 };
  const confidencePercent = Math.round(signal.confidence * 100);
  const actionColor = signal.action === 'BUY' ? 'text-emerald-400' : signal.action === 'SELL' ? 'text-red-400' : 'text-amber-400';
  const actionBg = signal.action === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20' : signal.action === 'SELL' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-emerald-400" />
          AI Signal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={cn('w-16 h-16 rounded-2xl border flex items-center justify-center', actionBg)}>
            <span className={cn('text-xl font-bold', actionColor)}>{signal.action}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-sm font-semibold">{confidencePercent}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Risk Level Indicator ──────────────────────────────
function RiskIndicator() {
  const riskLevel = 'MEDIUM'; // Low/Medium/High
  const riskValue = 55; // 0-100
  const riskColor = riskLevel === 'LOW' ? '#34d399' : riskLevel === 'MEDIUM' ? '#fbbf24' : '#ef4444';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Risk Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-accent"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={riskColor}
                strokeWidth="3"
                strokeDasharray={`${riskValue}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{riskValue}</span>
            </div>
          </div>
          <div>
            <p className={cn('text-lg font-bold', riskLevel === 'LOW' ? 'text-emerald-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-red-400')}>
              {riskLevel}
            </p>
            <p className="text-xs text-muted-foreground">Portfolio Risk</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Price Chart ───────────────────────────────────────
function PortfolioChart() {
  const { portfolioHistory, setPortfolioHistory } = useTradingStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setPortfolioHistory(MOCK_PORTFOLIO_HISTORY);
  }, [setPortfolioHistory]);

  const data = portfolioHistory.length > 0 ? portfolioHistory : MOCK_PORTFOLIO_HISTORY;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={['dataMin - 2000', 'dataMax + 2000']} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#portfolioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top Movers ────────────────────────────────────────
function TopMovers() {
  const { liveStocks } = useTradingStore();
  const stocks = liveStocks.length > 0 ? liveStocks : MOCK_STOCKS;
  const sorted = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Top Movers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold', stock.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                  {stock.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{stock.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(stock.price)}</p>
                <p className={cn('text-xs font-medium', stock.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {formatPercent(stock.changePercent)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Trades ─────────────────────────────────────
function RecentTrades() {
  const { trades, setTrades, user } = useTradingStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setTrades(MOCK_TRADES);
  }, [setTrades]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trading/history?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.trades?.length) setTrades(data.trades);
        }
      } catch {
        // keep existing
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, setTrades]);

  const displayTrades = trades.length > 0 ? trades.slice(0, 5) : MOCK_TRADES;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <Badge variant={trade.action === 'BUY' ? 'default' : 'destructive'} className={cn('text-[10px] h-5', trade.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')}>
                  {trade.action}
                </Badge>
                <span className="text-sm font-medium">{trade.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-sm">{trade.quantity} × {formatCurrency(trade.price)}</p>
                <p className={cn('text-xs', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {trade.profitLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Learning Progress ──────────────────────────────
function AILearningProgress() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          AI Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Episodes</p>
            <p className="text-lg font-bold">500</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Epsilon</p>
            <p className="text-lg font-bold">0.01</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">States Explored</p>
            <p className="text-lg font-bold">1,247</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold text-emerald-400">64.2%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard View ───────────────────────────────
export function DashboardView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <TickerBar />

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioSummary />
        <AISignalCard />
        <RiskIndicator />
      </div>

      {/* Chart + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PortfolioChart />
        </div>
        <div className="space-y-4">
          <TopMovers />
          <AILearningProgress />
        </div>
      </div>

      {/* Recent Trades */}
      <RecentTrades />
    </motion.div>
  );
}
