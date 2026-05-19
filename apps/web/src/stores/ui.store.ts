import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
