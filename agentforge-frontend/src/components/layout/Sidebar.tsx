import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Workflow, ListChecks, CalendarDays,
  Users, GitBranch, BookOpen, Settings,
  ChevronLeft, ChevronRight, Search, LogOut,
  FolderKanban, BarChart3, Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

// Single source of truth for left nav — exactly one entry per top-level
// router path. No duplicates, no dead links.
const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/ai-intake', label: 'AI Project Intake', icon: Workflow },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
      { to: '/sprints', label: 'Sprints', icon: CalendarDays },
      { to: '/teams', label: 'Teams', icon: Users },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/monitor', label: 'Monitor', icon: Monitor },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/github-reviews', label: 'GitHub Reviews', icon: GitBranch },
    ],
  },
  {
    title: 'Knowledge & System',
    items: [
      { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// Build-time guard: fail fast if a `to` is ever duplicated.
const allNavPaths = navSections.flatMap((s) => s.items.map((i) => i.to));
if (new Set(allNavPaths).size !== allNavPaths.length) {
  throw new Error(`Duplicate sidebar route detected: ${allNavPaths.join(', ')}`);
}

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
    <div className="h-full flex flex-col bg-[#050508] border-r relative" style={{ borderColor: 'rgba(255,244,220,0.08)', boxShadow: '4px 0 32px rgba(0,0,0,0.55)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.32] tech-grid-soft" />
      <div aria-hidden="true" className="pointer-events-none absolute top-0 inset-x-0 h-px hairline-warm opacity-60" />
      {/* Logo — transparent icon, larger, no purple box */}
      <div className="flex items-center justify-between h-16 px-4 border-b relative" style={{ borderColor: 'rgba(255,244,220,0.07)', background: 'linear-gradient(180deg, rgba(255,244,220,0.03) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3">
          <img
            src="/agentforge-icon.png"
            alt="AgentForge"
            className="h-10 w-auto object-contain shrink-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]"
          />
          {!collapsed && (
            <span className="font-heading font-semibold text-[17px] tracking-tight" style={{ color: '#fefcf5' }}>
              Agent<span className="font-light" style={{ color: '#e9cc8b' }}>Forge</span>
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-text-muted hover:text-text-heading transition-colors p-1.5 rounded-lg hover:bg-canvas-surface border border-transparent hover:border-[rgba(255,244,220,0.08)]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search — premium warm */}
      <div className="p-4 relative">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[#0e0e14] border rounded-xl text-sm text-text-muted hover:text-text-heading transition-all"
          style={{ borderColor: 'rgba(255,244,220,0.08)', boxShadow: '0 0 0 1px rgba(255,244,220,0.02) inset' }}
        >
          <Search size={16} className="shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Search...</span>}
          <kbd className="text-xs px-1.5 py-0.5 rounded border font-mono bg-[#14141b] text-text-muted" style={{ borderColor: 'rgba(255,244,220,0.08)' }}>⌘K</kbd>
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent',
                      isActive
                        ? 'nav-active-premium'
                        : 'text-text-muted hover:text-text-heading hover:bg-[rgba(255,244,220,0.04)] hover:border-[rgba(255,244,220,0.06)]',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className={cn(isActive ? 'text-[#e9cc8b]' : 'text-text-muted')} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile — warm */}
      <div className="p-4 border-t relative" style={{ borderColor: 'rgba(255,244,220,0.07)', background: 'linear-gradient(0deg, rgba(255,244,220,0.025) 0%, transparent 100%)' }}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#1a1300] font-semibold text-sm ring-1 ring-[rgba(255,244,220,0.12)]" style={{ background: 'linear-gradient(135deg, #e9cc8b 0%, #c9a86a 100%)', boxShadow: '0 0 14px rgba(201,168,106,0.22)' }}>
            {user?.full_name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-heading truncate">{user?.full_name || 'User'}</p>
                {user?.role === 'admin' && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20 leading-none">
                    Admin
                  </span>
                )}
              </div>
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