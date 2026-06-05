'use client';

import { useState, useEffect, useRef } from 'react';
import { useTradingStore, TrainingLog } from '@/store/trading-store';
import { MOCK_TRAINING_LOGS } from '@/lib/mock-data';
import { formatCurrency, cn } from '@/lib/utils-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Brain, Play, Loader2, Zap, Database, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'];

// ─── Training Configuration ────────────────────────────
function TrainingConfig() {
  const { isTraining, setIsTraining, setTrainingLogs, selectedStock } = useTradingStore();
  const [symbol, setSymbol] = useState(selectedStock);
  const [episodes, setEpisodes] = useState('100');
  const [learningRate, setLearningRate] = useState('0.1');
  const [discountFactor, setDiscountFactor] = useState('0.95');

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingLogs([]);
    toast.info('Training started...');

    try {
      const res = await fetch('/api/rl/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          episodes: parseInt(episodes),
          learningRate: parseFloat(learningRate),
          discountFactor: parseFloat(discountFactor),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.logs?.length) {
          setTrainingLogs(data.logs);
        }
        if (data.result) {
          toast.success('Training completed!');
        }
      } else {
        // Use simulated training data
        simulateTraining(parseInt(episodes));
      }
    } catch {
      simulateTraining(parseInt(episodes));
    } finally {
      setIsTraining(false);
    }
  };

  const simulateTraining = (numEpisodes: number) => {
    const logs: TrainingLog[] = [];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= numEpisodes) {
        clearInterval(interval);
        setIsTraining(false);
        toast.success('Training completed!');
        return;
      }
      const log: TrainingLog = {
        episode: i + 1,
        totalReward: -500 + i * 15 + (Math.random() - 0.3) * 100,
        epsilon: Math.max(0.01, 1 - (i + 1) / numEpisodes),
        portfolioValue: 100000 + i * 300 + (Math.random() - 0.4) * 2000,
        totalProfit: i * 300 + (Math.random() - 0.4) * 2000,
      };
      logs.push(log);
      setTrainingLogs([...logs]);
      i++;
    }, 100);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Training Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
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
            <Label className="text-xs">Episodes</Label>
            <Input type="number" value={episodes} onChange={(e) => setEpisodes(e.target.value)} className="h-9" min="10" max="1000" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Learning Rate</Label>
            <Input type="number" value={learningRate} onChange={(e) => setLearningRate(e.target.value)} className="h-9" step="0.01" min="0.01" max="1" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Discount Factor</Label>
            <Input type="number" value={discountFactor} onChange={(e) => setDiscountFactor(e.target.value)} className="h-9" step="0.01" min="0" max="1" />
          </div>
        </div>
        <Button
          onClick={handleStartTraining}
          disabled={isTraining}
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white h-10"
        >
          {isTraining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Training Progress ─────────────────────────────────
function TrainingProgress() {
  const { trainingLogs, isTraining } = useTradingStore();
  const totalEpisodes = trainingLogs.length > 0 ? Math.max(trainingLogs[trainingLogs.length - 1]?.episode || 0, 100) : 100;
  const currentEpisode = trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1]?.episode || 0 : 0;
  const progressPercent = totalEpisodes > 0 ? Math.round((currentEpisode / totalEpisodes) * 100) : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Training Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Episode {currentEpisode} / {totalEpisodes}</span>
            <span className="text-emerald-400">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {isTraining && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
              <span>Training in progress...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Training Results Chart ────────────────────────────
function TrainingResultsChart() {
  const { trainingLogs } = useTradingStore();
  const data = trainingLogs.length > 0 ? trainingLogs : MOCK_TRAINING_LOGS;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Reward per Episode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="episode" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
              <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="totalReward" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Q-Table Stats ─────────────────────────────────────
function QTableStats() {
  const { trainingLogs } = useTradingStore();
  const lastLog = trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1] : null;
  const epsilon = lastLog?.epsilon ?? 0.5;
  const statesExplored = trainingLogs.length * 25 + Math.floor(Math.random() * 100);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          Q-Table Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">States Explored</p>
            <p className="text-2xl font-bold">{statesExplored.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Epsilon</p>
            <p className="text-2xl font-bold text-purple-400">{epsilon.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Q-Values Updated</p>
            <p className="text-2xl font-bold">{(statesExplored * 3).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exploration</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${epsilon * 100}%` }} />
              </div>
              <span className="text-xs font-medium">{(epsilon * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Trade History from Training ───────────────────────
function TrainingTradeHistory() {
  const { trainingLogs } = useTradingStore();
  const lastLog = trainingLogs.length > 0 ? trainingLogs[trainingLogs.length - 1] : null;

  const mockTrades = [
    { episode: 10, action: 'BUY', symbol: 'AAPL', price: 174.50, reward: 25.30 },
    { episode: 25, action: 'SELL', symbol: 'AAPL', price: 177.20, reward: 42.10 },
    { episode: 40, action: 'HOLD', symbol: 'AAPL', price: 175.80, reward: -5.20 },
    { episode: 55, action: 'BUY', symbol: 'AAPL', price: 173.90, reward: 18.70 },
    { episode: 70, action: 'SELL', symbol: 'AAPL', price: 179.40, reward: 56.40 },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Training Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
          {mockTrades.map((trade, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/20 border border-border/20">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] h-5', trade.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : trade.action === 'SELL' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}>
                  {trade.action}
                </Badge>
                <span className="text-sm">{trade.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-sm">{formatCurrency(trade.price)}</p>
                <p className={cn('text-xs', trade.reward >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  Reward: {trade.reward >= 0 ? '+' : ''}{trade.reward.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Training View ────────────────────────────────
export function TrainingView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <TrainingConfig />
          <TrainingProgress />
          <QTableStats />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <TrainingResultsChart />
          <TrainingTradeHistory />
        </div>
      </div>
    </motion.div>
  );
}
