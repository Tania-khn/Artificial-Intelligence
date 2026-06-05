# 🤖 NeuralTrade - AI Stock Trading Bot

An AI-powered stock trading platform built with **Next.js 16**, **TypeScript**, and **Reinforcement Learning**. Features real-time stock data, AI predictions, automated trading, and portfolio management.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 📊 **Real-time Stock Data** - Live prices for AAPL, TSLA, NVDA, and more
- 🤖 **AI Trading Signals** - BUY/SELL/HOLD predictions using RL & technical analysis
- 🧠 **RL Model Training** - Train Q-Learning agent with live feedback
- 📈 **Backtesting** - Test strategies against historical data
- 🤖 **Auto Trading** - AI-powered automated trading bot
- 💼 **Portfolio Management** - Track holdings, P/L, and performance
- 💬 **AI Chat Assistant** - Ask anything about stocks and trading
- 📉 **Technical Indicators** - RSI, MACD, Bollinger Bands, Moving Averages
- 🔔 **Smart Notifications** - Trade alerts and AI signals
- 🌙 **Dark Mode** - Beautiful dark/light theme

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI Library |
| Next.js 16 | Framework (App Router) |
| TypeScript 5 | Type Safety |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI Components (48+) |
| Recharts | Charts & Graphs |
| Framer Motion | Animations |
| Zustand | State Management |
| Lucide React | Icons |
| Sonner | Toast Notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| Next.js API Routes | REST API (17 endpoints) |
| Prisma ORM | Database Queries |
| SQLite | Database |
| Socket.io | Real-time Updates |

### AI / ML
| Component | Purpose |
|-----------|---------|
| Q-Learning Agent | Trading decisions |
| Technical Analysis | RSI, MACD, Bollinger, MA |
| Sentiment Analysis | Market mood detection |
| Combined Signal | Multi-indicator fusion |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+ - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/neuraltrade.git
cd neuraltrade

# 2. Install dependencies + Setup database (ONE command!)
npm run setup

# 3. Start development server
npm run dev
```

### Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
neuraltrade/
├── prisma/
│   └── schema.prisma          # Database schema (7 models)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main app page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/               # Backend API routes
│   │       ├── ai/chat/       # AI chatbot
│   │       ├── auth/          # Authentication
│   │       ├── auto-trade/    # Auto trading engine
│   │       ├── notifications/ # User notifications
│   │       ├── portfolio/     # Portfolio management
│   │       ├── rl/            # RL predict/train/backtest
│   │       ├── stocks/        # Stock data (6 routes)
│   │       └── trading/       # Trade execution
│   ├── components/
│   │   ├── trading/           # Custom trading components (11)
│   │   ├── dashboard/         # Dashboard views
│   │   └── ui/                # shadcn/ui components (48)
│   ├── store/
│   │   └── trading-store.ts   # Zustand state management
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utilities & database client
├── .env                       # Environment variables
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript config
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth` | Login / Register |
| `POST` | `/api/ai/chat` | AI Chat response |
| `POST` | `/api/auto-trade` | Start/Stop auto trading |
| `GET` | `/api/portfolio` | Get user portfolio |
| `GET` | `/api/notifications` | Get notifications |
| `GET` | `/api/rl/predict` | AI prediction (BUY/SELL/HOLD) |
| `POST` | `/api/rl/train` | Train RL model |
| `POST` | `/api/rl/backtest` | Backtest strategy |
| `GET` | `/api/stocks/search` | Search stocks |
| `GET` | `/api/stocks/multi` | Multiple stock prices |
| `GET` | `/api/stocks/history` | Historical price data |
| `GET` | `/api/stocks/indicators` | Technical indicators |
| `GET` | `/api/stocks/sentiment` | Market sentiment |
| `GET` | `/api/stocks/live` | Live stock price |
| `POST` | `/api/trading/execute` | Execute trade |
| `GET` | `/api/trading/history` | Trade history |

---

## 🗄️ Database Schema

7 Prisma models:

- **User** - Account & balance
- **Portfolio** - Stock holdings
- **Trade** - Trade history
- **AITrainingLog** - ML training data
- **Notification** - User alerts
- **BacktestResult** - Strategy test results
- **MarketData** - Price history

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install + Generate + Database push |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This project is for **educational purposes only**. All trading involves risk. Past performance does not guarantee future results. The AI predictions are simulated and should not be used for real financial decisions.

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript, and AI
</p>
