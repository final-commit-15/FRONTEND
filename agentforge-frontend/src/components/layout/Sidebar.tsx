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

  return (
    <div className="h-full flex flex-col bg-base-900/80 backdrop-blur-md border-r border-base-800">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-base-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          {!collapsed && <span className="text-white font-semibold text-lg">AgentForge</span>}
        </div>
        <button
          onClick={onToggle}
          className="text-base-400 hover:text-white transition-colors p-1 rounded-md"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2 px-3 py-2 bg-base-800/50 border border-base-700 rounded-lg text-sm text-base-400 hover:text-white hover:border-base-600 transition-colors"
        >
          <Search size={16} />
          {!collapsed && <span className="flex-1 text-left">Search...</span>}
          <kbd className="text-xs text-base-500 bg-base-800 border border-base-700 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-base-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-electric-600/10 text-electric-400 border border-electric-500/20'
                        : 'text-base-400 hover:text-white hover:bg-base-800',
                      collapsed && 'justify-center px-2'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-base-800">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-electric-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-base-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-base-500 hover:text-error-500 transition-colors"
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