'use client';

import { useState, useEffect, useRef } from 'react';
import { useTradingStore, ChatMessage } from '@/store/trading-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Send, Bot, User, Loader2, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils-helpers';

const presetQuestions = [
  { label: 'Analyze AAPL', icon: TrendingUp, query: 'Analyze AAPL stock and give me your prediction' },
  { label: 'Market outlook', icon: BarChart3, query: 'What is the current market outlook?' },
  { label: 'Risk assessment', icon: Shield, query: 'Assess the current risk level of my portfolio' },
];

export function ChatPanel() {
  const { chatMessages, addChatMessage } = useTradingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggleChat', handler);
    return () => window.removeEventListener('toggleChat', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const messages = [...chatMessages, { role: 'user' as const, content: content.trim() }]
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content || 'I apologize, but I could not process your request. Please try again.',
        timestamp: new Date(),
      };
      addChatMessage(aiMsg);
    } catch {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m currently unable to connect to the AI service. Based on current market conditions, I recommend monitoring your positions closely and maintaining your risk management strategy. The market is showing mixed signals with tech stocks leading gains while broader indices remain volatile.',
        timestamp: new Date(),
      };
      addChatMessage(aiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-card/95 backdrop-blur-xl border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Trading Assistant</h3>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Ask me anything about trading!</p>
                <div className="space-y-2">
                  {presetQuestions.map((pq) => (
                    <Button
                      key={pq.label}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => sendMessage(pq.query)}
                    >
                      <pq.icon className="w-3.5 h-3.5" />
                      {pq.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-emerald-500/20 text-foreground'
                        : 'bg-accent text-foreground'
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="bg-accent rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Preset Quick Actions */}
          {chatMessages.length > 0 && (
            <div className="px-4 py-2 border-t border-border/50">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {presetQuestions.map((pq) => (
                  <Button
                    key={pq.label}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-[10px] h-7 gap-1"
                    onClick={() => sendMessage(pq.query)}
                  >
                    <pq.icon className="w-3 h-3" />
                    {pq.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stocks, strategies..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
