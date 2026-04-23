import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

// Stamp the theme on <html> as early as possible to avoid FOUC.
// We read from localStorage directly (same key Zustand uses) so the
// attribute is set before the first React paint.
const STORAGE_KEY = 'gs-quad-ui-store';

function getInitialTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: string } };
      if (parsed?.state?.theme === 'dark') return 'dark';
    }
  } catch {
    // ignore
  }
  return 'light';
}

// Run immediately (outside React) so <html> gets the right class before paint.
document.documentElement.setAttribute('data-theme', getInitialTheme());

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
