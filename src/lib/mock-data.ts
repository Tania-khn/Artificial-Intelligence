import { StockData, TradeRecord, PortfolioHolding, Notification, TrainingLog } from '@/store/trading-store';

export const MOCK_STOCKS: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.72, previousClose: 176.50, change: 2.22, changePercent: 1.26, open: 177.00, high: 179.45, low: 176.80, volume: 54326789, marketCap: 2780000000000, peRatio: 28.5, week52High: 199.62, week52Low: 124.17 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, previousClose: 248.30, change: -2.63, changePercent: -1.06, open: 247.50, high: 250.10, low: 243.20, volume: 89234567, marketCap: 780000000000, peRatio: 62.3, week52High: 299.29, week52Low: 152.37 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 480.35, previousClose: 472.10, change: 8.25, changePercent: 1.75, open: 473.00, high: 485.20, low: 471.50, volume: 42156789, marketCap: 1180000000000, peRatio: 65.7, week52High: 505.48, week52Low: 222.97 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, previousClose: 376.45, change: 2.46, changePercent: 0.65, open: 377.00, high: 380.50, low: 375.80, volume: 23456789, marketCap: 2810000000000, peRatio: 35.2, week52High: 384.30, week52Low: 275.37 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.56, previousClose: 140.20, change: 1.36, changePercent: 0.97, open: 140.50, high: 142.30, low: 139.80, volume: 34567890, marketCap: 1780000000000, peRatio: 25.8, week52High: 153.78, week52Low: 101.88 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, previousClose: 176.80, change: 1.45, changePercent: 0.82, open: 177.00, high: 179.50, low: 176.20, volume: 45678901, marketCap: 1850000000000, peRatio: 58.9, week52High: 189.77, week52Low: 118.35 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 505.72, previousClose: 502.30, change: 3.42, changePercent: 0.68, open: 503.00, high: 508.90, low: 500.50, volume: 19876543, marketCap: 1290000000000, peRatio: 33.1, week52High: 542.81, week52Low: 274.38 },
];

export const MOCK_TRADES: TradeRecord[] = [
  { id: '1', symbol: 'NVDA', action: 'BUY', quantity: 10, price: 472.10, totalValue: 4721.00, profitLoss: 82.50, aiSignal: 'BUY', confidence: 0.87, strategy: 'Q-Learning', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', symbol: 'AAPL', action: 'SELL', quantity: 25, price: 179.45, totalValue: 4486.25, profitLoss: 56.25, aiSignal: 'SELL', confidence: 0.72, strategy: 'Q-Learning', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', symbol: 'TSLA', action: 'BUY', quantity: 5, price: 248.30, totalValue: 1241.50, profitLoss: -15.00, aiSignal: 'HOLD', confidence: 0.55, strategy: 'MA Crossover', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: '4', symbol: 'MSFT', action: 'BUY', quantity: 15, price: 376.45, totalValue: 5646.75, profitLoss: 36.90, aiSignal: 'BUY', confidence: 0.91, strategy: 'Q-Learning', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', symbol: 'GOOGL', action: 'SELL', quantity: 20, price: 140.20, totalValue: 2804.00, profitLoss: 28.00, aiSignal: 'SELL', confidence: 0.68, strategy: 'RSI', createdAt: new Date(Date.now() - 18000000).toISOString() },
];

export const MOCK_PORTFOLIO: PortfolioHolding[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, avgPrice: 172.30, currentPrice: 178.72 },
  { id: '2', symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 30, avgPrice: 450.20, currentPrice: 480.35 },
  { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 25, avgPrice: 370.50, currentPrice: 378.91 },
  { id: '4', symbol: 'TSLA', name: 'Tesla Inc.', quantity: 20, avgPrice: 252.10, currentPrice: 245.67 },
  { id: '5', symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 40, avgPrice: 138.50, currentPrice: 141.56 },
  { id: '6', symbol: 'AMZN', name: 'Amazon.com Inc.', quantity: 15, avgPrice: 174.20, currentPrice: 178.25 },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'AI Signal: NVDA', message: 'Strong BUY signal detected for NVDA with 87% confidence', type: 'AI_SIGNAL', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', title: 'Trade Executed', message: 'Bought 10 shares of NVDA at $472.10', type: 'TRADE', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', title: 'Risk Alert', message: 'Portfolio risk level increased to Medium', type: 'RISK', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', title: 'Market Alert', message: 'TSLA dropped below 200-day moving average', type: 'ALERT', read: true, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: '5', title: 'Training Complete', message: 'RL Agent training completed 500 episodes', type: 'SYSTEM', read: true, createdAt: new Date(Date.now() - 14400000).toISOString() },
];

export const MOCK_PORTFOLIO_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseValue = 95000;
  const trend = i * 200;
  const noise = (Math.random() - 0.4) * 3000;
  return {
    date: date.toISOString().split('T')[0],
    value: Math.round(baseValue + trend + noise),
  };
});

export const MOCK_TRAINING_LOGS: TrainingLog[] = Array.from({ length: 50 }, (_, i) => ({
  episode: i + 1,
  totalReward: -500 + i * 15 + (Math.random() - 0.3) * 100,
  epsilon: Math.max(0.01, 1 - (i + 1) * 0.018),
  portfolioValue: 100000 + i * 300 + (Math.random() - 0.4) * 2000,
  totalProfit: i * 300 + (Math.random() - 0.4) * 2000,
}));

export const MOCK_HISTORICAL_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const base = 172 + Math.sin(i / 5) * 5;
  const open = base + (Math.random() - 0.5) * 3;
  const close = open + (Math.random() - 0.4) * 4;
  const high = Math.max(open, close) + Math.random() * 2;
  const low = Math.min(open, close) - Math.random() * 2;
  const volume = Math.round(30000000 + Math.random() * 30000000);
  return {
    date: date.toISOString().split('T')[0],
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
    volume,
  };
});

export const MOCK_INDICATORS = {
  rsi: { value: 62.4, signal: 'NEUTRAL' as const },
  macd: { value: 2.35, signal: 'BULLISH' as const, histogram: 1.12 },
  bollingerBands: { upper: 185.5, middle: 176.8, lower: 168.1, signal: 'NEUTRAL' as const },
  movingAverages: { sma20: 175.6, sma50: 172.3, sma200: 165.8, signal: 'BULLISH' as const },
  rsiData: Array.from({ length: 30 }, (_, i) => ({
    date: MOCK_HISTORICAL_DATA[i]?.date || '',
    rsi: 40 + Math.sin(i / 4) * 20 + Math.random() * 10,
  })),
  macdData: Array.from({ length: 30 }, (_, i) => ({
    date: MOCK_HISTORICAL_DATA[i]?.date || '',
    macd: Math.sin(i / 6) * 3 + Math.random(),
    signal: Math.sin(i / 6) * 2.5 + Math.random() - 0.5,
    histogram: (Math.sin(i / 6) * 3 + Math.random()) - (Math.sin(i / 6) * 2.5 + Math.random() - 0.5),
  })),
};

export const MOCK_SENTIMENT = {
  symbol: 'AAPL',
  overallScore: 0.72,
  label: 'POSITIVE' as const,
  articles: [
    { title: 'Apple Reports Strong Q4 Earnings', sentiment: 0.85, date: '2024-01-15' },
    { title: 'iPhone Sales Beat Expectations', sentiment: 0.78, date: '2024-01-14' },
    { title: 'Competition in Chinese Market Intensifies', sentiment: -0.35, date: '2024-01-13' },
  ],
  breakdown: { positive: 62, neutral: 25, negative: 13 },
};
