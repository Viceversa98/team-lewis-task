import { create } from "zustand";

export type AccountMode = "register" | "sign-in";
export type RevealPhase = "idle" | "writing" | "shown";

type BenchStore = {
  file: File | null;
  previewUrl: string | null;
  dragging: boolean;
  accountMode: AccountMode;
  revealPhase: RevealPhase;
  setFile: (file: File | null) => void;
  setDragging: (dragging: boolean) => void;
  setAccountMode: (accountMode: AccountMode) => void;
  setRevealPhase: (revealPhase: RevealPhase) => void;
};

const revokePreview = (url: string | null) => {
  if (!url) return;
  URL.revokeObjectURL(url);
};

export const useBenchStore = create<BenchStore>((set, get) => ({
  file: null,
  previewUrl: null,
  dragging: false,
  accountMode: "register",
  revealPhase: "idle",
  setFile: (file) => {
    revokePreview(get().previewUrl);
    set({
      file,
      previewUrl: file ? URL.createObjectURL(file) : null,
      revealPhase: "idle",
      dragging: false,
    });
  },
  setDragging: (dragging) => set({ dragging }),
  setAccountMode: (accountMode) => set({ accountMode }),
  setRevealPhase: (revealPhase) => set({ revealPhase }),
}));
