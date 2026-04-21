import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type SidebarState = 'expanded' | 'collapsed' | 'hidden';

interface UIState {
  theme: Theme;
  sidebarState: SidebarState;
  commandPaletteOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarState: (state: SidebarState) => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      theme: 'light',
      sidebarState: 'expanded',
      commandPaletteOpen: false,

      setTheme: (theme) => set({ theme }),

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setSidebarState: (sidebarState) => set({ sidebarState }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      openCommandPalette: () => set({ commandPaletteOpen: true }),

      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'gs-quad-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
      }),
      merge: (persistedState: unknown, currentState: unknown) => {
        const merged = { ...(currentState as object), ...(persistedState as object) } as UIState;
        // Allows both light and dark theme by reading from persisted memory correctly
        return merged;
      },
    }
  )
);
