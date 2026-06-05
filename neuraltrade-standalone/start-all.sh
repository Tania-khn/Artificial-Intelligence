#!/bin/bash
# NeuralTrade AI - Start All Services
# Ye script saari 3 services ek saath start karega

echo "🚀 Starting NeuralTrade AI - All Services..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Node.js dependencies..."
  bun install
  echo ""
fi

if [ ! -d "mini-services/auto-trade-ws/node_modules" ]; then
  echo "📦 Installing Auto-Trade WebSocket dependencies..."
  cd mini-services/auto-trade-ws && bun install && cd ../..
  echo ""
fi

if [ ! -d "mini-services/rl-trading-engine/node_modules" ]; then
  echo "📦 Installing RL Trading Engine dependencies..."
  cd mini-services/rl-trading-engine && bun install && cd ../..
  echo ""
fi

# Check if database exists
if [ ! -f "db/custom.db" ]; then
  echo "🗄️ Setting up database..."
  bun run db:push
  echo ""
fi

echo "═══════════════════════════════════════════"
echo "  🤖 NeuralTrade AI - Starting Services"
echo "═══════════════════════════════════════════"
echo ""
echo "  📡 Service 1: Next.js App      → http://localhost:3000"
echo "  🧠 Service 2: RL Trading Engine → http://localhost:3031"
echo "  🔌 Service 3: Auto-Trade WS     → ws://localhost:3003"
echo ""
echo "  ⏹️  Stop: Ctrl+C dabayein"
echo "═══════════════════════════════════════════"
echo ""

# Start all services in background
# Service 2: RL Trading Engine (Python)
echo "🧠 Starting RL Trading Engine on port 3031..."
cd mini-services/rl-trading-engine && bun run dev &
PID_RL=$!
cd ../..

# Service 3: Auto-Trade WebSocket
echo "🔌 Starting Auto-Trade WebSocket on port 3003..."
cd mini-services/auto-trade-ws && bun run dev &
PID_WS=$!
cd ../..

# Wait a bit for services to start
sleep 2

# Service 1: Next.js App (foreground)
echo "📡 Starting Next.js App on port 3000..."
bun run dev

# Cleanup on exit
trap "echo ''; echo '⏹️ Stopping all services...'; kill $PID_RL $PID_WS 2>/dev/null; exit 0" SIGINT SIGTERM
