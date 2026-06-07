'use client';

import { useState, useEffect } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Brain, Shield, Zap, BarChart3, Bot,
  ArrowRight, Activity, Sparkles, LineChart,
} from 'lucide-react';

// ─── Deterministic particle configs (no Math.random at render time) ───
const PARTICLE_COUNT = 30;
// Pre-computed using a simple seeded approach to avoid SSR/CSR mismatch
function seededValue(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return min + (x - Math.floor(x)) * (max - min);
}

// ─── Floating Particles Background ─────────────────────
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return static placeholder during SSR to avoid hydration mismatch
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs - these are deterministic, safe to render */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const x = seededValue(i + 1, 0, 100); // percentage-based
        const y = seededValue(i + 100, 0, 100);
        const duration = seededValue(i + 200, 6, 14);
        const delay = seededValue(i + 300, 0, 5);
        const targetY = seededValue(i + 400, -100, -300);

        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-emerald-500/30"
            style={{ left: `${x}%`, top: `${y}%` }}
            animate={{
              y: [0, targetY],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
            }}
          />
        );
      })}
      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, delay: 2 }}
      />
    </div>
  );
}

// ─── Animated Logo ──────────────────────────────────────
function AnimatedLogo() {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Outer ring pulse */}
      <motion.div
        className="absolute -inset-4 rounded-3xl bg-emerald-500/10"
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute -inset-8 rounded-3xl bg-emerald-500/5"
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
      />

      {/* Main logo container */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <TrendingUp className="w-12 h-12 md:w-14 md:h-14 text-white" />
        </motion.div>

        {/* Corner accent dots */}
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-white/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </div>
    </motion.div>
  );
}

// ─── Feature Card ───────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-emerald-500/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Main Landing Page ─────────────────────────────────
export function LandingPage() {
  const { setAuthStep } = useTradingStore();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      <FloatingParticles />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-3xl mx-auto text-center">
        {/* Logo */}
        <AnimatedLogo />

        {/* Title */}
        <motion.h1
          className="mt-8 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Neural
          </span>
          <span className="text-foreground">Trade</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-4 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          AI-Powered Stock Trading Bot
          <br />
          <span className="text-sm">Reinforcement Learning &bull; Real-Time Signals &bull; Auto Trading</span>
        </motion.p>

        {/* Get Started Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8"
        >
          <Button
            size="lg"
            className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
            onClick={() => setAuthStep('auth')}
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <FeatureCard
            icon={Brain}
            title="Q-Learning AI"
            desc="RL agent that learns optimal trading strategies"
            delay={1.0}
          />
          <FeatureCard
            icon={Zap}
            title="Auto Trading"
            desc="24/7 autonomous AI trading engine"
            delay={1.1}
          />
          <FeatureCard
            icon={Shield}
            title="Risk Control"
            desc="Stop-loss, take-profit & daily loss limits"
            delay={1.2}
          />
          <FeatureCard
            icon={LineChart}
            title="Live Signals"
            desc="Real-time market analysis & predictions"
            delay={1.3}
          />
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>7 Stocks Tracked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <span>6 AI Strategies</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real-Time Analysis</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
