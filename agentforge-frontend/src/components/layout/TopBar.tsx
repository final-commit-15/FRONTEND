import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Dropdown } from '@/components/ui/Dropdown';
import { SystemStatusIndicator } from '@/components/dashboard/SystemHealth';

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
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-base-800 bg-base-900/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-base-400 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white">{formattedTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Search */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-base-800/50 border border-base-700 rounded-lg text-sm text-base-400 hover:text-white hover:border-base-600 transition-colors"
        >
          <Search size={16} />
          <span>Search</span>
          <kbd className="text-xs text-base-500 bg-base-800 border border-base-700 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>

        {/* System Status */}
        <SystemStatusIndicator compact />

        {/* Notifications */}
        <Dropdown
          trigger={
            <button className="relative p-2 text-base-400 hover:text-white transition-colors rounded-lg">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
            </button>
          }
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        >
          <div className="w-80 p-2">
            <h3 className="px-3 py-2 text-sm font-semibold text-white">Notifications</h3>
            <div className="space-y-1">
              <div className="px-3 py-2 rounded-lg hover:bg-base-800 text-sm text-base-300">
                <p className="font-medium text-white">Execution completed</p>
                <p className="text-xs text-base-500">Agent "Code Helper" finished task #123</p>
                <p className="text-xs text-base-500 mt-1">2 minutes ago</p>
              </div>
              <div className="px-3 py-2 rounded-lg hover:bg-base-800 text-sm text-base-300">
                <p className="font-medium text-white">New agent created</p>
                <p className="text-xs text-base-500">Agent "Data Analyzer" was created</p>
                <p className="text-xs text-base-500 mt-1">1 hour ago</p>
              </div>
            </div>
          </div>
        </Dropdown>

        {/* User Menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-base-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.[0] || 'U'}
              </div>
            </button>
          }
        >
          <div className="w-56 p-2">
            <div className="px-3 py-2 border-b border-base-800">
              <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
              <p className="text-xs text-base-500">{user?.email || 'No email'}</p>
            </div>
            <div className="mt-2 space-y-1">
              <button className="w-full text-left px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg">
                Profile Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg">
                Preferences
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-error-500 hover:bg-error-700/10 rounded-lg"
              >
                Sign out
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}