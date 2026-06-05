'use client';

import { useTradingStore } from '@/store/trading-store';
import { cn } from '@/lib/utils-helpers';
import {
  LayoutDashboard,
  CandlestickChart,
  PieChart,
  Brain,
  FlaskConical,
  MessageSquare,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Trading', icon: CandlestickChart },
  { id: 'auto-trading', label: 'Auto Trade', icon: Bot },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'training', label: 'AI Training', icon: Brain },
  { id: 'backtest', label: 'Backtesting', icon: FlaskConical },
];

export function Sidebar() {
  const { activePage, setActivePage } = useTradingStore();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5">
          <Image
            src="/trading-bot-logo.png"
            alt="NeuralTrade AI"
            width={40}
            height={40}
            className="rounded-[10px] object-cover"
          />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">NeuralTrade</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Trading Bot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              suppressHydrationWarning
              onClick={() => setActivePage(item.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <item.icon className={cn('w-5 h-5 relative z-10', isActive && 'text-emerald-400')} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Powered by Reinforcement Learning</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const { activePage, setActivePage } = useTradingStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              suppressHydrationWarning
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
                isActive ? 'text-emerald-400' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
