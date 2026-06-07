'use client';

import { useEffect, useRef, useState } from 'react';
import { useTradingStore, TradeRecord } from '@/store/trading-store';
import { MOCK_STOCKS, MOCK_HISTORICAL_DATA, MOCK_INDICATORS, MOCK_SENTIMENT } from '@/lib/mock-data';
import { formatCurrency, formatPercent, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, LineChart, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Brain, Activity, Search,
  ArrowUpRight, ArrowDownRight, BarChart3, Gauge, Loader2, Zap, Clock, CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];

// ─── Stock Selector ────────────────────────────────────
function StockSelector() {
  const { selectedStock, setSelectedStock } = useTradingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) return;
      try {
        const res = await fetch(`/api/stocks/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // fallback
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {SYMBOLS.map((sym) => (
            <Button
              key={sym}
              variant={selectedStock === sym ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs',
                selectedStock === sym && 'bg-emerald-500 hover:bg-emerald-600 text-white'
              )}
              onClick={() => setSelectedStock(sym)}
            >
              {sym}
            </Button>
          ))}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 w-32 text-xs"
            />
          </div>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {searchResults.slice(0, 5).map((r: any) => (
              <button
                key={r.symbol}
                suppressHydrationWarning
                onClick={() => { setSelectedStock(r.symbol); setSearchQuery(''); setSearchResults([]); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm flex justify-between"
              >
                <span className="font-medium">{r.symbol}</span>
                <span className="text-muted-foreground text-xs">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Price Chart (Candlestick-like with Volume) ────────
function PriceChart() {
  const { selectedStock, historicalData, setHistoricalData, liveStocks } = useTradingStore();
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/stocks/history?symbol=${selectedStock}&period=1mo`);
        if (res.ok) {
          const data = await res.json();
          if (data.history?.length) {
            setHistoricalData(data.history);
            return;
          }
        }
      } catch {
        // fallback to mock
      }
      setHistoricalData(MOCK_HISTORICAL_DATA);
    };
    fetchHistory();

    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [selectedStock, setHistoricalData]);

  const data = historicalData.length > 0 ? historicalData : MOCK_HISTORICAL_DATA;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            {selectedStock} Price Chart
          </CardTitle>
          <div className="flex items-center gap-1">
            {['1W', '1M', '3M', '1Y'].map((period) => (
              <Button key={period} variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => v?.slice(5)} />
              <YAxis yAxisId="price" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" domain={['dataMin - 2', 'dataMax + 2']} />
              <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar yAxisId="volume" dataKey="volume" fill="rgba(52,211,153,0.15)" />
              <Area yAxisId="price" type="monotone" dataKey="close" stroke="#34d399" strokeWidth={2} fill="url(#priceGradient)" />
              <Line yAxisId="price" type="monotone" dataKey="high" stroke="rgba(52,211,153,0.3)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
              <Line yAxisId="price" type="monotone" dataKey="low" stroke="rgba(239,68,68,0.3)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Technical Indicators Panel ────────────────────────
function TechnicalIndicators() {
  const { selectedStock, indicators, setIndicators } = useTradingStore();
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const res = await fetch(`/api/stocks/indicators?symbol=${selectedStock}`);
        if (res.ok) {
          const data = await res.json();
          if (data.rsi) {
            setIndicators(data);
            return;
          }
        }
      } catch {
        // fallback to mock
      }
      setIndicators(MOCK_INDICATORS);
    };
    fetchIndicators();
  }, [selectedStock, setIndicators]);

  const ind = indicators || MOCK_INDICATORS;

  const indicatorItems = [
    { label: 'RSI', value: ind.rsi?.value?.toFixed(1) || '62.4', signal: ind.rsi?.signal || 'NEUTRAL' },
    { label: 'MACD', value: ind.macd?.value?.toFixed(2) || '2.35', signal: ind.macd?.signal || 'BULLISH' },
    { label: 'Bollinger', value: `${ind.bollingerBands?.upper?.toFixed(0) || '185'}/${ind.bollingerBands?.lower?.toFixed(0) || '168'}`, signal: ind.bollingerBands?.signal || 'NEUTRAL' },
    { label: 'MA Trend', value: `${ind.movingAverages?.sma20?.toFixed(0) || '175'}`, signal: ind.movingAverages?.signal || 'BULLISH' },
  ];

  const signalColor = (s: string) => {
    if (s === 'BULLISH' || s === 'BUY') return 'text-emerald-400 bg-emerald-500/10';
    if (s === 'BEARISH' || s === 'SELL') return 'text-red-400 bg-red-500/10';
    return 'text-amber-400 bg-amber-500/10';
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Technical Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {indicatorItems.map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-accent/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className="text-lg font-bold mt-1">{item.value}</p>
              <Badge className={cn('text-[10px] h-5 mt-1', signalColor(item.signal))}>
                {item.signal}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Prediction Card ────────────────────────────────
function AIPrediction() {
  const { selectedStock, aiSignal, setAiSignal } = useTradingStore();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`/api/rl/predict?symbol=${selectedStock}`);
        if (res.ok) {
          const data = await res.json();
          if (data.action) {
            setAiSignal(data);
            return;
          }
        }
      } catch {
        // fallback
      }
      const actions = ['BUY', 'SELL', 'HOLD'];
      setAiSignal({ action: actions[Math.floor(Math.random() * 3)], confidence: 0.6 + Math.random() * 0.35 });
    };
    fetchPrediction();
  }, [selectedStock, setAiSignal]);

  const signal = aiSignal || { action: 'BUY', confidence: 0.87 };
  const confidencePercent = Math.round(signal.confidence * 100);
  const actionColor = signal.action === 'BUY' ? 'text-emerald-400' : signal.action === 'SELL' ? 'text-red-400' : 'text-amber-400';
  const actionBg = signal.action === 'BUY' ? 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30' : signal.action === 'SELL' ? 'from-red-500/20 to-red-600/5 border-red-500/30' : 'from-amber-500/20 to-amber-600/5 border-amber-500/30';

  return (
    <Card className={cn('border bg-gradient-to-br backdrop-blur-sm', actionBg)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          RL Agent Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          <motion.div
            key={signal.action}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('text-4xl font-black', actionColor)}
          >
            {signal.action}
          </motion.div>
          <p className="text-sm text-muted-foreground mt-2">{selectedStock}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Confidence</span>
              <span className="font-semibold">{confidencePercent}%</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sentiment Analysis ────────────────────────────────
function SentimentAnalysis() {
  const { selectedStock, sentiment, setSentiment } = useTradingStore();

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch(`/api/stocks/sentiment?symbol=${selectedStock}`);
        if (res.ok) {
          const data = await res.json();
          if (data.overallScore !== undefined) {
            setSentiment(data);
            return;
          }
        }
      } catch {
        // fallback
      }
      setSentiment(MOCK_SENTIMENT);
    };
    fetchSentiment();
  }, [selectedStock, setSentiment]);

  const sent = sentiment || MOCK_SENTIMENT;
  const score = sent.overallScore || 0.72;
  const label = sent.label || 'POSITIVE';
  const scorePercent = Math.round(score * 100);
  const sentimentColor = score > 0.6 ? '#34d399' : score > 0.4 ? '#fbbf24' : '#ef4444';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          News Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={sentimentColor} strokeWidth="3" strokeDasharray={`${scorePercent}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{scorePercent}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', score > 0.6 ? 'text-emerald-400' : score > 0.4 ? 'text-amber-400' : 'text-red-400')}>
              {label}
            </p>
            {sent.breakdown && (
              <div className="mt-1 flex gap-2 text-[10px]">
                <span className="text-emerald-400">{sent.breakdown.positive}% pos</span>
                <span className="text-muted-foreground">{sent.breakdown.neutral}% neu</span>
                <span className="text-red-400">{sent.breakdown.negative}% neg</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Trade Execution Panel ─────────────────────────────
function TradeExecutionPanel() {
  const {
    selectedStock, aiSignal, user, liveStocks,
    addTrade, addNotification, portfolio, setPortfolio, updateUserBalance,
  } = useTradingStore();
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  // Get current price from live stock data or mock data
  const currentStock = liveStocks.find((s) => s.symbol === selectedStock)
    || MOCK_STOCKS.find((s) => s.symbol === selectedStock);
  const currentPrice = currentStock?.price || 0;
  const totalValue = currentPrice * parseInt(quantity || '0');

  const handleTrade = async () => {
    if (!quantity || parseInt(quantity) <= 0 || currentPrice <= 0) return;

    setLoading(true);
    const qty = parseInt(quantity);
    const tradeAction = action;
    const tradePrice = currentPrice;
    const tradeTotal = tradePrice * qty;

    try {
      const res = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo-user',
          symbol: selectedStock,
          action: tradeAction,
          quantity: qty,
          price: tradePrice,
          aiSignal: aiSignal?.action,
          confidence: aiSignal?.confidence,
          strategy: 'Manual Trade',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Use the trade from API response
        const apiTrade = data.trade;
        const tradeRecord: TradeRecord = {
          id: apiTrade?.id || `trade-${Date.now()}`,
          symbol: selectedStock,
          action: tradeAction,
          quantity: qty,
          price: tradePrice,
          totalValue: tradeTotal,
          profitLoss: apiTrade?.profitLoss || 0,
          aiSignal: aiSignal?.action,
          confidence: aiSignal?.confidence || 0,
          strategy: 'Manual Trade',
          createdAt: new Date().toISOString(),
        };
        addTrade(tradeRecord);

        // Update balance
        if (tradeAction === 'BUY') {
          updateUserBalance(-tradeTotal);
        } else {
          updateUserBalance(tradeTotal);
        }

        // Update portfolio locally
        updatePortfolioLocal(tradeAction, qty, tradePrice);

        // Add notification
        const actionEmoji = tradeAction === 'BUY' ? '🟢' : '🔴';
        addNotification({
          id: `notif-${Date.now()}`,
          title: `${actionEmoji} Trade Executed: ${tradeAction} ${selectedStock}`,
          message: `${tradeAction} ${qty} shares of ${selectedStock} at ${formatCurrency(tradePrice)}. Total: ${formatCurrency(tradeTotal)}`,
          type: 'TRADE',
          read: false,
          createdAt: new Date().toISOString(),
        });

        toast.success(`${actionEmoji} ${tradeAction} ${qty} shares of ${selectedStock} @ ${formatCurrency(tradePrice)}`, {
          description: `Total: ${formatCurrency(tradeTotal)}${tradeAction === 'SELL' ? ` | P/L: ${formatCurrency(apiTrade?.profitLoss || 0)}` : ''}`,
        });
      } else {
        // API failed, still record locally for demo
        executeLocalTrade(tradeAction, qty, tradePrice);
      }
    } catch {
      // Fallback: record locally
      executeLocalTrade(tradeAction, qty, tradePrice);
    } finally {
      setLoading(false);
    }
  };

  const updatePortfolioLocal = (tradeAction: 'BUY' | 'SELL', qty: number, price: number) => {
    const existingIdx = portfolio.findIndex((h) => h.symbol === selectedStock);
    const stockInfo = currentStock || MOCK_STOCKS.find((s) => s.symbol === selectedStock);
    const newName = stockInfo?.name || selectedStock;

    if (tradeAction === 'BUY') {
      if (existingIdx >= 0) {
        const existing = portfolio[existingIdx];
        const newQty = existing.quantity + qty;
        const newAvg = (existing.avgPrice * existing.quantity + price * qty) / newQty;
        const updated = [...portfolio];
        updated[existingIdx] = { ...existing, quantity: newQty, avgPrice: newAvg, currentPrice: price };
        setPortfolio(updated);
      } else {
        setPortfolio([
          ...portfolio,
          {
            id: `hold-${Date.now()}`,
            symbol: selectedStock,
            name: newName,
            quantity: qty,
            avgPrice: price,
            currentPrice: price,
          },
        ]);
      }
    } else {
      if (existingIdx >= 0) {
        const existing = portfolio[existingIdx];
        const newQty = existing.quantity - qty;
        if (newQty <= 0) {
          setPortfolio(portfolio.filter((_, i) => i !== existingIdx));
        } else {
          const updated = [...portfolio];
          updated[existingIdx] = { ...existing, quantity: newQty, currentPrice: price };
          setPortfolio(updated);
        }
      }
    }
  };

  const executeLocalTrade = (tradeAction: 'BUY' | 'SELL', qty: number, price: number) => {
    const total = price * qty;
    let profitLoss = 0;

    // Calculate P/L for SELL
    if (tradeAction === 'SELL') {
      const holding = portfolio.find((h) => h.symbol === selectedStock);
      if (holding) {
        profitLoss = (price - holding.avgPrice) * qty;
      }
    }

    // Add to trade history
    const tradeRecord: TradeRecord = {
      id: `trade-${Date.now()}`,
      symbol: selectedStock,
      action: tradeAction,
      quantity: qty,
      price,
      totalValue: total,
      profitLoss,
      aiSignal: aiSignal?.action,
      confidence: aiSignal?.confidence || 0,
      strategy: 'Manual Trade',
      createdAt: new Date().toISOString(),
    };
    addTrade(tradeRecord);

    // Update balance
    if (tradeAction === 'BUY') {
      updateUserBalance(-total);
    } else {
      updateUserBalance(total);
    }

    // Update portfolio
    updatePortfolioLocal(tradeAction, qty, price);

    // Add notification
    const actionEmoji = tradeAction === 'BUY' ? '🟢' : '🔴';
    addNotification({
      id: `notif-${Date.now()}`,
      title: `${actionEmoji} Trade Executed: ${tradeAction} ${selectedStock}`,
      message: `${tradeAction} ${qty} shares of ${selectedStock} at ${formatCurrency(price)}. Total: ${formatCurrency(total)}${profitLoss !== 0 ? ` | P/L: ${formatCurrency(profitLoss)}` : ''}`,
      type: 'TRADE',
      read: false,
      createdAt: new Date().toISOString(),
    });

    toast.success(`${actionEmoji} ${tradeAction} ${qty} shares of ${selectedStock} @ ${formatCurrency(price)}`, {
      description: `Total: ${formatCurrency(total)}${profitLoss !== 0 ? ` | P/L: ${formatCurrency(profitLoss)}` : ''}`,
    });
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Execute Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Price Display */}
          <div className="p-3 rounded-xl bg-accent/20 border border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Price</p>
            <p className="text-xl font-bold">{formatCurrency(currentPrice)}</p>
            {currentStock && (
              <p className={cn('text-xs font-medium', currentStock.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)} ({currentStock.changePercent.toFixed(2)}%)
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Action</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={action === 'BUY' ? 'default' : 'outline'}
                className={cn('h-10', action === 'BUY' && 'bg-emerald-500 hover:bg-emerald-600 text-white')}
                onClick={() => setAction('BUY')}
              >
                <TrendingUp className="w-4 h-4 mr-1" /> Buy
              </Button>
              <Button
                variant={action === 'SELL' ? 'default' : 'outline'}
                className={cn('h-10', action === 'SELL' && 'bg-red-500 hover:bg-red-600 text-white')}
                onClick={() => setAction('SELL')}
              >
                <TrendingDown className="w-4 h-4 mr-1" /> Sell
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Quantity</p>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10"
            />
          </div>
          {/* Total Value Preview */}
          <div className="p-3 rounded-xl bg-accent/20 border border-border/20">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-bold">{formatCurrency(totalValue)}</span>
            </div>
            {user && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Balance After</span>
                <span className={cn(
                  'font-medium',
                  (action === 'BUY' ? user.balance - totalValue : user.balance + totalValue) >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {formatCurrency(action === 'BUY' ? user.balance - totalValue : user.balance + totalValue)}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={handleTrade}
            disabled={loading || !quantity || parseInt(quantity) <= 0 || currentPrice <= 0}
            className={cn(
              'w-full h-10 font-semibold',
              action === 'BUY'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {action} {parseInt(quantity || '0')} {selectedStock} @ {formatCurrency(currentPrice)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Technical Indicators Charts (RSI + MACD) ──────────
function IndicatorCharts() {
  const { indicators } = useTradingStore();
  const ind = indicators || MOCK_INDICATORS;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Technical Charts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSI Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">RSI (14)</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ind.rsiData || MOCK_INDICATORS.rsiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => v?.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                <ReferenceLine y={70} stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="rgba(52,211,153,0.3)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* MACD Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">MACD</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ind.macdData || MOCK_INDICATORS.macdData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} stroke="rgba(255,255,255,0.2)" />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="histogram" fill="rgba(52,211,153,0.3)" />
                <Line type="monotone" dataKey="macd" stroke="#34d399" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Trade History ─────────────────────────────────────
function TradeHistory() {
  const { trades } = useTradingStore();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Recent Trades
          <Badge className="text-[10px] h-5 bg-amber-500/20 text-amber-400">{trades.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            No trades yet. Use the Execute Trade panel to place orders.
          </div>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'p-3 rounded-xl border',
                    'bg-accent/20 border-border/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {trade.action === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <Badge className={cn(
                        'text-[10px] h-5',
                        trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}>
                        {trade.action}
                      </Badge>
                      <span className="text-sm font-semibold">{trade.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-muted-foreground">Executed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {trade.quantity} × {formatCurrency(trade.price)} = {formatCurrency(trade.totalValue)}
                      {trade.profitLoss !== 0 && (
                        <span className={cn('ml-2 font-medium', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          P/L: {trade.profitLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(trade.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  {trade.aiSignal && (
                    <div className="flex items-center gap-1 mt-1">
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-muted-foreground">
                        AI Signal: {trade.aiSignal} ({(trade.confidence * 100).toFixed(0)}% conf)
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Trading View ─────────────────────────────────
export function TradingView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <StockSelector />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <PriceChart />
          <IndicatorCharts />
          <TradeHistory />
        </div>
        <div className="space-y-4">
          <AIPrediction />
          <TechnicalIndicators />
          <SentimentAnalysis />
          <TradeExecutionPanel />
        </div>
      </div>
    </motion.div>
  );
}
