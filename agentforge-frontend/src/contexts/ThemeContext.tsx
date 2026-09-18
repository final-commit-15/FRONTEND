import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(next: Theme) {
  // Premium Black is locked — force dark regardless of requested value.
  // Keeps ::selection / colorScheme / legacy light class all on OLED black.
  const locked: Theme = 'dark';
  const root = document.documentElement;
  root.classList.add('dark');
  root.classList.remove('light');
  root.style.colorScheme = locked;
  // persist lock so reloads never flash light
  try { localStorage.setItem('theme', locked); } catch {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force premium black on mount — ignore stored / prefers
    const locked: Theme = 'dark';
    setThemeState(locked);
    applyThemeClass(locked);
  }, []);

  const setTheme = useCallback((_newTheme: Theme) => {
    const locked: Theme = 'dark';
    setThemeState(locked);
    applyThemeClass(locked);
  }, []);

  const toggleTheme = useCallback(() => {
    // no-op: premium black is locked
    const locked: Theme = 'dark';
    setThemeState(locked);
    applyThemeClass(locked);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}