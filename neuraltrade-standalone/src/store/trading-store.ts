import { create } from 'zustand';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  totalValue: number;
  profitLoss: number;
  aiSignal?: string;
  confidence: number;
  strategy?: string;
  createdAt: string;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AISignal {
  action: string;
  confidence: number;
  score?: number;
}

export interface TrainingLog {
  episode: number;
  totalReward: number;
  epsilon: number;
  portfolioValue: number;
  totalProfit: number;
}

export interface BacktestResult {
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  equityCurve: number[];
  trades: any[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Auto Trading Types ───────────────────────────────
export interface AutoTradeConfig {
  symbols: string[];
  maxPositionSize: number;       // max $ per trade
  stopLossPercent: number;       // stop loss percentage
  takeProfitPercent: number;     // take profit percentage
  maxDailyLoss: number;          // max daily loss $
  confidenceThreshold: number;   // min AI confidence to trade (0-1)
  tradingInterval: number;       // seconds between AI checks
  strategy: 'q_learning' | 'ma_crossover' | 'rsi' | 'macd' | 'bollinger' | 'combined';
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface AutoTradeLog {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity: number;
  price: number;
  confidence: number;
  reason: string;
  profitLoss?: number;
  status: 'executed' | 'skipped' | 'failed';
}

export interface AutoTradeStatus {
  isRunning: boolean;
  startedAt: string | null;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfitLoss: number;
  currentPositions: { symbol: string; quantity: number; entryPrice: number; currentPrice: number; unrealizedPL: number }[];
  lastCheck: string | null;
  dailyPL: number;
  aiDecisions: { symbol: string; action: string; confidence: number; timestamp: string }[];
  equityCurve: { time: string; value: number }[];
}

interface TradingStore {
  // Auth
  user: { id: string; email: string; name: string; balance: number } | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  logout: () => void;

  // Active Page
  activePage: string;
  setActivePage: (page: string) => void;

  // Selected Stock
  selectedStock: string;
  setSelectedStock: (symbol: string) => void;

  // Stock Data
  liveStocks: StockData[];
  setLiveStocks: (stocks: StockData[]) => void;
  
  // Historical Data
  historicalData: any[];
  setHistoricalData: (data: any[]) => void;

  // Technical Indicators
  indicators: any;
  setIndicators: (data: any) => void;

  // AI Signal
  aiSignal: AISignal | null;
  setAiSignal: (signal: AISignal | null) => void;

  // Sentiment
  sentiment: any;
  setSentiment: (data: any) => void;

  // Portfolio
  portfolio: PortfolioHolding[];
  setPortfolio: (holdings: PortfolioHolding[]) => void;

  // Trades
  trades: TradeRecord[];
  setTrades: (trades: TradeRecord[]) => void;
  addTrade: (trade: TradeRecord) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifs: Notification[]) => void;
  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;

  // Training
  isTraining: boolean;
  setIsTraining: (val: boolean) => void;
  trainingLogs: TrainingLog[];
  setTrainingLogs: (logs: TrainingLog[]) => void;

  // Backtest
  backtestResult: BacktestResult | null;
  setBacktestResult: (result: BacktestResult | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Loading states
  loadingStocks: boolean;
  setLoadingStocks: (val: boolean) => void;
  loadingIndicators: boolean;
  setLoadingIndicators: (val: boolean) => void;
  loadingPrediction: boolean;
  setLoadingPrediction: (val: boolean) => void;

  // Simulated Portfolio Value History for Chart
  portfolioHistory: { date: string; value: number }[];
  setPortfolioHistory: (data: { date: string; value: number }[]) => void;

  // ─── Auto Trading State ───────────────────────────
  autoTradeConfig: AutoTradeConfig;
  setAutoTradeConfig: (config: Partial<AutoTradeConfig>) => void;
  autoTradeStatus: AutoTradeStatus;
  setAutoTradeStatus: (status: Partial<AutoTradeStatus>) => void;
  autoTradeLogs: AutoTradeLog[];
  addAutoTradeLog: (log: AutoTradeLog) => void;
  setAutoTradeLogs: (logs: AutoTradeLog[]) => void;
  autoTradeRunning: boolean;
  setAutoTradeRunning: (val: boolean) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  updateUserBalance: (delta: number) => set((state) => ({
    user: state.user ? { ...state.user, balance: state.user.balance + delta } : state.user,
  })),
  logout: () => set({ user: null, isAuthenticated: false }),

  // Active Page
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Selected Stock
  selectedStock: 'AAPL',
  setSelectedStock: (symbol) => set({ selectedStock: symbol }),

  // Stock Data
  liveStocks: [],
  setLiveStocks: (stocks) => set({ liveStocks: stocks }),
  
  // Historical Data
  historicalData: [],
  setHistoricalData: (data) => set({ historicalData: data }),

  // Technical Indicators
  indicators: null,
  setIndicators: (data) => set({ indicators: data }),

  // AI Signal
  aiSignal: null,
  setAiSignal: (signal) => set({ aiSignal: signal }),

  // Sentiment
  sentiment: null,
  setSentiment: (data) => set({ sentiment: data }),

  // Portfolio
  portfolio: [],
  setPortfolio: (holdings) => set({ portfolio: holdings }),

  // Trades
  trades: [],
  setTrades: (trades) => set({ trades: trades }),
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades].slice(0, 100) })),

  // Notifications
  notifications: [],
  setNotifications: (notifs) => set({ notifications: notifs }),
  addNotification: (notif) => set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 50) })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),

  // Training
  isTraining: false,
  setIsTraining: (val) => set({ isTraining: val }),
  trainingLogs: [],
  setTrainingLogs: (logs) => set({ trainingLogs: logs }),

  // Backtest
  backtestResult: null,
  setBacktestResult: (result) => set({ backtestResult: result }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),

  // Loading
  loadingStocks: false,
  setLoadingStocks: (val) => set({ loadingStocks: val }),
  loadingIndicators: false,
  setLoadingIndicators: (val) => set({ loadingIndicators: val }),
  loadingPrediction: false,
  setLoadingPrediction: (val) => set({ loadingPrediction: val }),

  // Portfolio History
  portfolioHistory: [],
  setPortfolioHistory: (data) => set({ portfolioHistory: data }),

  // ─── Auto Trading ─────────────────────────────────
  autoTradeConfig: {
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
  setAutoTradeConfig: (config) => set((state) => ({ autoTradeConfig: { ...state.autoTradeConfig, ...config } })),
  autoTradeStatus: {
    isRunning: false,
    startedAt: null,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfitLoss: 0,
    currentPositions: [],
    lastCheck: null,
    dailyPL: 0,
    aiDecisions: [],
    equityCurve: [],
  },
  setAutoTradeStatus: (status) => set((state) => ({ autoTradeStatus: { ...state.autoTradeStatus, ...status } })),
  autoTradeLogs: [],
  addAutoTradeLog: (log) => set((state) => ({ autoTradeLogs: [log, ...state.autoTradeLogs].slice(0, 100) })),
  setAutoTradeLogs: (logs) => set({ autoTradeLogs: logs }),
  autoTradeRunning: false,
  setAutoTradeRunning: (val) => set({ autoTradeRunning: val }),
}));
