import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bot, ListChecks, TerminalSquare,
  BarChart3, Wrench, ShieldCheck, Plug, Activity, Settings,
  ChevronLeft, ChevronRight, Search, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/agents', label: 'Agents', icon: Bot },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
      { to: '/executions', label: 'Executions', icon: TerminalSquare },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/tools', label: 'Tools', icon: Wrench },
      { to: '/permissions', label: 'Permissions', icon: ShieldCheck },
      { to: '/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/activity', label: 'Activity', icon: Activity },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { openCommandPalette } = useCommandPalette();
  const location = useLocation();

  const isActiveRoute = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="h-full flex flex-col bg-canvas border-r border-canvas-border">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-canvas-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <span className="font-logo font-bold text-white text-sm">AF</span>
          </div>
          {!collapsed && <span className="font-heading font-semibold text-lg text-text-heading">AgentForge</span>}
        </div>
        <button
          onClick={onToggle}
          className="text-text-muted hover:text-text-heading transition-colors p-1.5 rounded-lg hover:bg-canvas-surface"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2 px-3 py-2 bg-canvas-surface border border-canvas-border rounded-xl text-sm text-text-muted hover:text-text-heading hover:border-brand-primary/50 transition-colors"
        >
          <Search size={16} />
          {!collapsed && <span className="flex-1 text-left">Search...</span>}
          <kbd className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : 'text-text-muted hover:text-text-heading hover:bg-canvas-surface',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className={cn(isActive && 'text-brand-primary')} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-canvas-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-heading truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-text-muted hover:text-error-600 transition-colors p-1.5 rounded-lg hover:bg-error-50"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}