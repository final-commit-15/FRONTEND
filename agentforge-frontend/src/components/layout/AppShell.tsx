import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = glowRef.current;
      if (!el) return;
      el.style.setProperty('--cursor-x', `${e.clientX}px`);
      el.style.setProperty('--cursor-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div ref={glowRef} className="cursor-glow-overlay" aria-hidden="true" />;
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <CursorGlow />
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container py-6 md:py-8 lg:py-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}