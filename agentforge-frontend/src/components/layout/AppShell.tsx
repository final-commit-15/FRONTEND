import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = glowRef.current;
        if (!el) return;
        el.style.setProperty('--cursor-x', `${x}px`);
        el.style.setProperty('--cursor-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={glowRef} className="cursor-glow-overlay" aria-hidden="true" />;
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary relative">
      {/* Premium ambient — warm white top wash + golden side orb (pure CSS, no image) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="ambient-orb w-[720px] h-[320px] -top-28 left-1/2 -translate-x-1/2 rounded-full opacity-[0.09]" style={{ background: 'radial-gradient(ellipse at center, rgba(255,246,222,0.18) 0%, rgba(255,246,222,0.06) 42%, transparent 72%)' }} />
        <div className="ambient-orb w-[420px] h-[420px] top-[14%] -right-24 rounded-full opacity-[0.045]" style={{ background: 'radial-gradient(circle, rgba(201,168,106,0.22) 0%, transparent 66%)' }} />
        <div className="ambient-orb w-[520px] h-[260px] bottom-0 left-1/2 -translate-x-1/2 rounded-full opacity-[0.035]" style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 tech-grid-soft opacity-[0.55]" />
        <div className="absolute top-0 inset-x-0 h-px hairline-warm opacity-90" />
      </div>
      <CursorGlow />
      {/* Desktop Sidebar — above ambient */}
      <aside className={`hidden lg:block relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto relative">
          <div className="page-container py-6 md:py-8 lg:py-10 animate-fade-in relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}