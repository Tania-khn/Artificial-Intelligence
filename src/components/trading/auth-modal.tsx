'use client';

import { useState } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthModal() {
  const { setUser, setAuthStep } = useTradingStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body: Record<string, string> = {
        action: isLogin ? 'login' : 'signup',
        email: form.email,
        password: form.password,
      };
      if (!isLogin) body.name = form.name;

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // If login fails, try auto-signup (user not found or wrong password)
        if (isLogin) {
          const signupRes = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signup',
              email: form.email,
              password: form.password,
              name: form.name || form.email.split('@')[0],
            }),
          });
          const signupData = await signupRes.json();
          if (signupRes.ok) {
            setUser(signupData.user);
            return;
          }
          // If signup also fails (e.g. email taken with different password), use demo login
          if (signupRes.status === 409) {
            // Email already exists with different password - log in as demo with that email
            setUser({
              id: 'demo-user',
              email: form.email,
              name: form.email.split('@')[0],
              balance: 100000,
            });
            return;
          }
          setError(signupData.error || 'Authentication failed');
          return;
        }
        setError(data.error || 'Authentication failed');
        return;
      }

      setUser(data.user);
    } catch {
      // On network error, set a mock user for demo purposes
      setUser({
        id: 'demo-user',
        email: form.email || 'demo@neuraltrade.ai',
        name: form.name || form.email.split('@')[0] || 'Demo User',
        balance: 100000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setUser({
      id: 'demo-user',
      email: 'demo@neuraltrade.ai',
      name: 'Demo Trader',
      balance: 100000,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px] px-4"
      >
        <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setAuthStep('landing')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl">NeuralTrade AI</CardTitle>
            <p className="text-sm text-muted-foreground">AI-Powered Stock Trading Bot</p>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => { setIsLogin(v === 'login'); setError(''); }}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                      required={!isLogin}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={3}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </Tabs>

            {/* Quick Demo Access */}
            <div className="mt-4">
              <Separator className="mb-4" />
              <Button
                variant="outline"
                className="w-full border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300"
                onClick={handleQuickDemo}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Demo Access
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Skip login & explore with $100,000 virtual balance
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
