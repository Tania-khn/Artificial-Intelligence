'use client';

import { useTradingStore } from '@/store/trading-store';
import { useTheme } from 'next-themes';
import { Bell, Sun, Moon, Search, MessageSquare, LogOut, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { useState } from 'react';
import { cn } from '@/lib/utils-helpers';
import { motion } from 'framer-motion';

export function Header() {
  const { user, logout, notifications, setActivePage, autoTradeRunning } = useTradingStore();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to trading view with searched symbol
      setActivePage('trading');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-xl">
      {/* Search */}
      <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 w-72">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks..."
            className="pl-9 h-9 bg-background/50 border-border/50 text-sm"
          />
        </div>
      </form>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Auto Trading Status */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 gap-1.5 text-xs',
            autoTradeRunning ? 'text-emerald-400 hover:text-emerald-300' : 'text-muted-foreground'
          )}
          onClick={() => setActivePage('auto-trading')}
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">{autoTradeRunning ? 'Auto: ON' : 'Auto: OFF'}</span>
          {autoTradeRunning && (
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </Button>
        {/* Chat Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => {
            const event = new CustomEvent('toggleChat');
            window.dispatchEvent(event);
          }}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
