'use client';

import { useTradingStore } from '@/store/trading-store';
import { AppShell } from '@/components/trading/app-shell';
import { AuthModal } from '@/components/trading/auth-modal';
import { LandingPage } from '@/components/trading/landing-page';

export default function Home() {
  const isAuthenticated = useTradingStore((s) => s.isAuthenticated);
  const authStep = useTradingStore((s) => s.authStep);

  // Not authenticated: show landing first, then auth on "Get Started"
  if (!isAuthenticated) {
    if (authStep === 'landing') {
      return <LandingPage />;
    }
    return (
      <>
        <AppShell />
        <AuthModal />
      </>
    );
  }

  // Authenticated: show full app
  return <AppShell />;
}
