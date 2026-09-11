// src/components/layout/TopBar.tsx

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import {
  Menu, Bell, User, ChevronDown,
  CalendarDays, Command,
  Settings, LogOut, Sun, Moon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useSprintStore } from '../../store/sprintStore';
import { requirementsApi } from '../../api/requirements';
import { useQuery } from '@tanstack/react-query';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  const { activeSprintId, sprints, setActiveSprintId, setSprints } = useSprintStore();

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

  const activeSprint =
    sprints.find((s) => s.id === activeSprintId) ||
    sprintList.find((s) => s.id === activeSprintId) ||
    null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    { id: '1', title: 'PR #42 approved', time: '5 min ago', read: false },
    { id: '2', title: 'Sprint 1 started', time: '1 hour ago', read: false },
    { id: '3', title: 'Blocker resolved', time: '3 hours ago', read: true },
    { id: '4', title: 'Feature completed', time: 'Yesterday', read: true },
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-canvas-border bg-canvas/80 backdrop-blur-lg">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Sprint selector — drives the whole dashboard */}
          <div className="flex items-center gap-2" data-testid="sprint-selector">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-text-heading">
                  <CalendarDays className="h-4 w-4 text-brand-primary" />
                  <span className="font-medium">{activeSprint?.name || 'Select Sprint'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-canvas-border">
                  Switch Sprint
                </div>
                {sprints.length === 0 ? (
                  <DropdownMenuItem className="text-text-muted" disabled>No sprints yet</DropdownMenuItem>
                ) : sprints.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    className={cn(
                      'justify-between',
                      s.id === activeSprintId && 'text-brand-primary font-medium'
                    )}
                    onClick={() => setActiveSprintId(s.id)}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-xs capitalize text-text-muted">{s.status}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Command Palette Shortcut */}
          <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 text-xs text-text-muted bg-canvas-surface rounded border border-canvas-border">
            <Command className="h-3 w-3" /> K
          </kbd>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-accent-amber" />
            ) : (
              <Moon className="h-5 w-5 text-brand-primary" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              ref={notificationsButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
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
                  <Button variant="ghost" size="sm" onClick={() => {}}>
                    Mark all read
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-canvas-border hover:bg-canvas-surface/50 ${!notif.read ? 'bg-brand-primary/5' : ''}`}
                    >
                      <p className="text-sm font-medium text-text-heading">{notif.title}</p>
                      <p className="text-xs text-text-muted mt-1">{notif.time}</p>
                    </div>
                  ))}
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
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback>
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>

            {showUserMenu && (
              <div
                ref={userMenuDropdownRef}
                className="absolute right-0 mt-2 w-48 card shadow-lg border border-canvas-border animate-fade-in"
              >
                <div className="p-3 border-b border-canvas-border">
                  <p className="font-medium text-text-heading">{user?.full_name}</p>
                  <p className="text-sm text-text-muted">{user?.email}</p>
                </div>
                <DropdownMenuItem className="px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <div className="border-t border-canvas-border" />
                <DropdownMenuItem className="px-3 py-2 hover:bg-canvas-surface rounded-lg flex items-center gap-2 text-error-600" onClick={() => {}}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}