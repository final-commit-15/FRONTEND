import { create } from 'zustand';

interface CommandPaletteState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));