import { create } from "zustand";

type Gender = "MALE" | "FEMALE" | null;

type MascotState = {
  gender: Gender;
  setGender: (gender: Gender) => void;
};

export const useMascot = create<MascotState>((set) => ({
  gender: null,
  setGender: (gender) => set({ gender }),
}));
