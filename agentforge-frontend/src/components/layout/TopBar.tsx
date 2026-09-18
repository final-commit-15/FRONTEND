// src/components/layout/TopBar.tsx

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, User,
  Command,
  Settings, LogOut, ChevronDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useSprintStore } from '../../store/sprintStore';
import { requirementsApi } from '../../api/requirements';
import { notificationsApi, Notification } from '../../api/notifications';

interface TopBarProps {
  onMenuClick?: () => void;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  const { activeSprintId, setActiveSprintId, setSprints } = useSprintStore();

  const { data: sprintsData } = useQuery({
    queryKey: ['sprints', 'overview-selector'],
    queryFn: () => requirementsApi.listSprints({ limit: 50 }),
    retry: false,
  });

  const sprintList = useMemo(
    () => (Array.isArray(sprintsData) ? sprintsData : (sprintsData?.items || [])),
    [sprintsData]
  );

  useEffect(() => {
    const items = sprintList.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
    }));
    setSprints(items);
    if (!activeSprintId && items.length > 0) {
      const active = items.find((s) => s.status === 'active') || items[0];
      setActiveSprintId(active.id);
    }
  }, [sprintList, activeSprintId, setActiveSprintId, setSprints]);

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000,
    retry: false,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        (old || []).map((n) => ({ ...n, is_read: true }))
      );
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (
        userMenuDropdownRef.current &&
        userMenuButtonRef.current &&
        !userMenuDropdownRef.current.contains(event.target as Node) &&
        !userMenuButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const go = (path: string) => {
    setShowUserMenu(false);
    setShowNotifications(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-bg-primary/70 backdrop-blur-xl" style={{ borderColor: 'rgba(255,244,220,0.08)', boxShadow: '0 1px 0 rgba(255,244,220,0.06) inset, 0 8px 24px rgba(0,0,0,0.55)' }}>
      <div className="h-px w-full absolute bottom-0 left-0 hairline-warm opacity-60 pointer-events-none" />
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4 relative">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center shrink-0">
              {workspace?.name
                ? <div className="w-8 h-8 rounded-xl bg-[#0e0e14] flex items-center justify-center ring-1 ring-[rgba(255,244,220,0.10)]"><span className="text-[11px] font-bold tracking-widest" style={{ color: '#fefcf5' }}>{workspace.name.slice(0, 2).toUpperCase()}</span></div>
                : <img src="/agentforge-icon.png" alt="AgentForge" className="h-9 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.20)]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-heading truncate leading-tight">
                {workspace?.name || 'AgentForge'}
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight hidden md:block">
                Project Management Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Command Palette Shortcut — premium warm */}
          <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 text-[11px] tracking-wide rounded-lg border bg-[#0e0e14] text-text-muted" style={{ borderColor: 'rgba(255,244,220,0.08)' }}>
            <Command className="h-3 w-3" /> K
          </kbd>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowNotifications(!showNotifications); refetchNotifications(); }}
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div
                ref={notificationsDropdownRef}
                className="absolute right-0 mt-2 w-80 card shadow-lg border border-canvas-border animate-fade-in"
              >
                <div className="p-4 border-b border-canvas-border flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-sm text-text-muted">
                      No notifications yet
                    </div>
                  )}
                  {notifications.slice(0, 12).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-canvas-border hover:bg-canvas-surface/50 ${!notif.is_read ? '' : ''}`}
                      style={!notif.is_read ? { background: 'rgba(201,168,106,0.06)' } : undefined}
                    >
                      <p className="text-sm font-medium text-text-heading">{notif.title}</p>
                      {notif.message && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-xs text-text-muted mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-canvas-border">
                  <button
                    onClick={() => go('/activity')}
                    className="w-full text-center text-sm text-brand-primary hover:bg-canvas-surface rounded-lg py-1.5"
                  >
                    View activity feed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              ref={userMenuButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-8 w-8"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name} />
                <AvatarFallback>
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>

            {showUserMenu && (
              <div
                ref={userMenuDropdownRef}
                className="absolute right-0 mt-2 w-56 card shadow-lg border border-canvas-border animate-fade-in"
              >
                <div className="p-3 border-b border-canvas-border">
                  <p className="font-medium text-text-heading">{user?.full_name}</p>
                  <p className="text-sm text-text-muted truncate">{user?.email}</p>
                  {workspace && (
                    <p className="flex items-center gap-1 text-xs text-brand-primary mt-1.5 font-medium">
                      <ChevronDown className="h-3 w-3" /> {workspace.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => go('/settings')}
                  className="w-full px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2 text-text-body hover:text-text-heading text-left transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => go('/settings')}
                  className="w-full px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2 text-text-body hover:text-text-heading text-left transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="border-t border-canvas-border" />
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="w-full px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2 text-error-600 text-left transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}