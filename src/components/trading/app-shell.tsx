'use client';

import { useTradingStore } from '@/store/trading-store';
import { Sidebar, MobileBottomNav } from './sidebar';
import { Header } from './header';
import { ChatPanel } from './chat-panel';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TradingView } from './trading-view';
import { PortfolioView } from './portfolio-view';
import { TrainingView } from './training-view';
import { BacktestView } from './backtest-view';
import { AutoTradingView } from './auto-trading-view';
import { AnimatePresence, motion } from 'framer-motion';

const viewMap: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  trading: TradingView,
  'auto-trading': AutoTradingView,
  portfolio: PortfolioView,
  training: TrainingView,
  backtest: BacktestView,
};

export function AppShell() {
  const { activePage } = useTradingStore();
  const ActiveView = viewMap[activePage] || DashboardView;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveView />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="border-t border-border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Reinforcement Learning • NeuralTrade AI © 2024
            </p>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
}
