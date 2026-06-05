# NeuralTrade - Windows Setup Guide

## Requirements (Pehle Ye Install Karo)

1. **Node.js** - Download from: https://nodejs.org/
   - LTS version download karo (v20+)
   - Install karte waqt "Add to PATH" checkbox ON rakho

2. **VS Code** - Download from: https://code.visualstudio.com/

---

## Step-by-Step Setup (Easy Method)

### Step 1: ZIP ko Extract Karo
- ZIP file ko Desktop par extract karo
- Andar ek folder hoga: `neuraltrade-standalone`

### Step 2: VS Code Mein Open Karo
- VS Code kholo
- File > Open Folder
- `neuraltrade-standalone` folder ko select karo
- ⚠️ IMPORTANT: Andar wala folder select karo, bahar wala NAHI!

### Step 3: VS Code Mein Terminal Kholo
- Menu: Terminal > New Terminal
- Ya press karo: Ctrl + `

### Step 4: Setup Command Chalao (ONE Command!)
```
npm run setup
```
Ye command automatically:
- npm install karega
- Prisma generate karega
- Database push karega

### Step 5: Start Karo!
```
npm run dev
```

### Step 6: Browser Mein Open Karo
- Chrome kholo
- Type karo: http://localhost:3000
- App dikh jayega! 🎉

---

## Agar Koi Error Aaye

### Error: "npm is not recognized"
- Node.js install nahi hua, Step 1 follow karo
- VS Code band karke dobara kholo

### Error: "prisma is not recognized"
```
npx prisma generate
npx prisma db push
```

### Error: "Port 3000 already in use"
```
npx kill-port 3000
npm run dev
```
Ya:
```
npm run dev -- -p 3001
```

### Error: Database connection failed
```
npx prisma db push --force-reset
```

---

## Features

- 📊 Real-time Stock Data (Mock)
- 🤖 AI Trading Signals
- 🧠 RL Model Training & Backtesting
- 🤖 Auto Trading (Simulation Mode)
- 💼 Portfolio Management
- 💬 AI Chat Assistant
- 📈 Technical Indicators (RSI, MACD, Bollinger)
- 🔔 Notifications

---

## Quick Commands

| Command | Kya Karta Hai |
|---------|---------------|
| `npm run setup` | Sab kuch install + database setup |
| `npm run dev` | Server start karo |
| `npm run build` | Production build banao |
| `npm run start` | Production server chalao |
| `npm run db:push` | Database update karo |
