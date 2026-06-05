'use client';

import { useState, useEffect, useRef } from 'react';
import { useTradingStore, Notification } from '@/store/trading-store';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';
import { timeAgo, cn } from '@/lib/utils-helpers';
import { Bell, TrendingUp, AlertTriangle, Brain, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const typeIcons: Record<string, React.ElementType> = {
  TRADE: TrendingUp,
  ALERT: AlertTriangle,
  AI_SIGNAL: Brain,
  RISK: Shield,
  SYSTEM: Settings,
};

const typeColors: Record<string, string> = {
  TRADE: 'text-emerald-400',
  ALERT: 'text-amber-400',
  AI_SIGNAL: 'text-purple-400',
  RISK: 'text-red-400',
  SYSTEM: 'text-blue-400',
};

export function NotificationsDropdown() {
  const { notifications, setNotifications, markNotificationRead, user } = useTradingStore();
  const [open, setOpen] = useState(false);
  const fetchedRef = useRef(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setNotifications(MOCK_NOTIFICATIONS);
  }, [setNotifications]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.notifications?.length) {
            setNotifications(data.notifications);
          }
        }
      } catch {
        // Keep mock data on error
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, setNotifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500 text-[10px] text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markNotificationRead(notif.id)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer',
                      !notif.read && 'bg-emerald-500/5'
                    )}
                  >
                    <div className={cn('mt-0.5', typeColors[notif.type] || 'text-muted-foreground')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
