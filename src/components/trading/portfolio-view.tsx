'use client';

import { useEffect, useRef } from 'react';
import { useTradingStore, PortfolioHolding } from '@/store/trading-store';
import { MOCK_PORTFOLIO, MOCK_PORTFOLIO_HISTORY, MOCK_TRADES } from '@/lib/mock-data';
import { formatCurrency, formatPercent, formatLargeNumber, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, TrendingDown, BarChart3, Target, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const PIE_COLORS = ['#34d399', '#f97316', '#a78bfa', '#fbbf24', '#38bdf8', '#fb7185'];

// ─── Holdings Table ────────────────────────────────────
function HoldingsTable() {
  const { portfolio, setPortfolio, user } = useTradingStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) {
        setPortfolio(MOCK_PORTFOLIO);
        return;
      }
      try {
        const res = await fetch(`/api/portfolio?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.holdings?.length) {
            setPortfolio(data.holdings);
            return;
          }
        }
      } catch {
        // fallback
      }
      setPortfolio(MOCK_PORTFOLIO);
    };
    fetchPortfolio();
  }, [user, setPortfolio]);

  const holdings = portfolio.length > 0 ? portfolio : MOCK_PORTFOLIO;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs">Qty</TableHead>
                <TableHead className="text-xs">Avg Price</TableHead>
                <TableHead className="text-xs">Current</TableHead>
                <TableHead className="text-xs">P/L</TableHead>
                <TableHead className="text-xs">P/L %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => {
                const pl = (h.currentPrice - h.avgPrice) * h.quantity;
                const plPercent = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="font-semibold text-sm">{h.symbol}</TableCell>
                    <TableCell className="text-sm">{h.quantity}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(h.avgPrice)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(h.currentPrice)}</TableCell>
                    <TableCell className={cn('text-sm font-medium', pl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px] h-5', pl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                        {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Allocation Pie Chart ──────────────────────────────
function AllocationChart() {
  const { portfolio } = useTradingStore();
  const holdings = portfolio.length > 0 ? portfolio : MOCK_PORTFOLIO;

  const data = holdings.map((h) => ({
    name: h.symbol,
    value: h.currentPrice * h.quantity,
  }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-emerald-400" />
          Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="font-medium">{d.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Performance Metrics ───────────────────────────────
function PerformanceMetrics() {
  const metrics = [
    { label: 'Total Return', value: '+7.35%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Sharpe Ratio', value: '1.82', icon: BarChart3, color: 'text-purple-400' },
    { label: 'Max Drawdown', value: '-4.23%', icon: ShieldAlert, color: 'text-red-400' },
    { label: 'Win Rate', value: '64.2%', icon: Award, color: 'text-amber-400' },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
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

// ─── Portfolio Value Line Chart ────────────────────────
function PortfolioValueChart() {
  const { portfolioHistory } = useTradingStore();
  const data = portfolioHistory.length > 0 ? portfolioHistory : MOCK_PORTFOLIO_HISTORY;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#portfolioLineGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Portfolio View ───────────────────────────────
export function PortfolioView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <PortfolioValueChart />
          <HoldingsTable />
        </div>
        <div className="space-y-4">
          <AllocationChart />
          <PerformanceMetrics />
        </div>
      </div>
    </motion.div>
  );
}
