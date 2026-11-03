import { create } from "zustand";

type HeartsModalState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  // Bumped by HeartsModal whenever an ad refill succeeds, so Quiz (which
  // keeps its own `hearts` state frozen from the initial server render) can
  // react via a useEffect keyed on this count instead of comparing objects
  // or functions across the shared store.
  heartsRefillCount: number;
  signalHeartsRefilled: () => void;
};

export const useHeartsModal = create<HeartsModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  heartsRefillCount: 0,
  signalHeartsRefilled: () =>
    set((state) => ({ heartsRefillCount: state.heartsRefillCount + 1 })),
}));
