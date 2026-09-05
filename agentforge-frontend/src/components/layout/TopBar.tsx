import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { SystemStatusIndicator } from '@/components/dashboard/SystemHealth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { openCommandPalette } = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pageTitle = location.pathname.split('/')[1] || 'Dashboard';
  const formattedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'success',
      title: 'Signed out',
      description: 'You have been logged out.',
    });
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-canvas-border bg-canvas/80 backdrop-blur-lg sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-muted hover:text-text-heading transition-colors p-2 rounded-lg hover:bg-canvas-surface"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-semibold text-lg text-text-heading">{formattedTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-canvas-surface border border-canvas-border rounded-xl text-sm text-text-muted hover:text-text-heading hover:border-brand-primary/50 transition-colors"
        >
          <Search size={16} />
          <span>Search</span>
          <kbd className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border font-mono">⌘K</kbd>
        </button>

        {/* System Status */}
        <SystemStatusIndicator compact />

        {/* Notifications */}
        <Dropdown
          trigger={
            <button className="relative p-2 text-text-muted hover:text-text-heading transition-colors rounded-xl hover:bg-canvas-surface">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
            </button>
          }
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        >
          <div className="w-80 p-2">
            <h3 className="px-3 py-2 text-sm font-semibold text-text-heading">Notifications</h3>
            <div className="space-y-1">
              <DropdownItem className="px-3 py-2 rounded-lg hover:bg-canvas-surface text-sm text-text-muted">
                <div>
                  <p className="font-medium text-text-heading">Execution completed</p>
                  <p className="text-xs text-text-muted">Agent "Code Helper" finished task #123</p>
                  <p className="text-xs text-text-muted mt-1">2 minutes ago</p>
                </div>
              </DropdownItem>
              <DropdownItem className="px-3 py-2 rounded-lg hover:bg-canvas-surface text-sm text-text-muted">
                <div>
                  <p className="font-medium text-text-heading">New agent created</p>
                  <p className="text-xs text-text-muted">Agent "Data Analyzer" was created</p>
                  <p className="text-xs text-text-muted mt-1">1 hour ago</p>
                </div>
              </DropdownItem>
            </div>
          </div>
        </Dropdown>

        {/* User Menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-canvas-surface transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.[0] || 'U'}
              </div>
            </button>
          }
        >
          <div className="w-56 p-2">
            <div className="px-3 py-2 border-b border-canvas-border">
              <p className="text-sm font-medium text-text-heading">{user?.full_name || 'User'}</p>
              <p className="text-xs text-text-muted">{user?.email || 'No email'}</p>
            </div>
            <div className="mt-2 space-y-1">
              <DropdownItem>Profile Settings</DropdownItem>
              <DropdownItem>Preferences</DropdownItem>
              <DropdownItem destructive onClick={handleLogout}>Sign out</DropdownItem>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}