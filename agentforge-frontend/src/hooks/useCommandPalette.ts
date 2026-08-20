import { useCommandPaletteStore } from '@/store/commandPaletteStore';

export function useCommandPalette() {
  const { isOpen, setOpen, close, open } = useCommandPaletteStore();
  return { isOpen, setOpen, closeCommandPalette: close, openCommandPalette: open };
}