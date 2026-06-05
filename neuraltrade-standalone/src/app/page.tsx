'use client';

import { useTradingStore } from '@/store/trading-store';
import { AppShell } from '@/components/trading/app-shell';
import { AuthModal } from '@/components/trading/auth-modal';

export default function Home() {
  const isAuthenticated = useTradingStore((s) => s.isAuthenticated);

  return (
    <>
      <AppShell />
      {!isAuthenticated && <AuthModal />}
    </>
  );
}
