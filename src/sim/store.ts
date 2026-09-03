import { create } from "zustand";
import { DURATION } from "./constants";
import { EPOCHS, epochAt } from "./epochs";

export type SimState = {
  intro: boolean;
  playing: boolean;
  speed: number;
  time: number;
  epochIndex: number;
  autoCamera: boolean;
  constantsOpen: boolean;
  theoryOpen: boolean;
  start: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
  seek: (t: number) => void;
  jumpEpoch: (i: number) => void;
  advance: (dt: number) => void;
  setAutoCamera: (v: boolean) => void;
  setConstantsOpen: (v: boolean) => void;
  setTheoryOpen: (v: boolean) => void;
  replay: () => void;
};

export const useSim = create<SimState>((set, get) => ({
  intro: true,
  playing: false,
  speed: 1,
  time: 4,
  epochIndex: 0,
  autoCamera: true,
  constantsOpen: false,
  theoryOpen: false,
  start: () =>
    set({
      intro: false,
      playing: true,
      time: 0,
      epochIndex: 0,
      autoCamera: true,
    }),
  togglePlay: () => {
    if (get().intro) return;
    set({ playing: !get().playing });
  },
  setSpeed: (speed) => set({ speed }),
  seek: (t) => {
    const time = Math.min(DURATION - 0.01, Math.max(0, t));
    set({ time, epochIndex: epochAt(time), intro: false });
  },
  jumpEpoch: (i) => {
    const e = EPOCHS[Math.max(0, Math.min(EPOCHS.length - 1, i))];
    set({
      time: e.t0 + 0.05,
      epochIndex: e.index,
      intro: false,
      playing: true,
      autoCamera: true,
    });
  },
  advance: (dt) => {
    if (!get().playing || get().intro) return;
    let time = get().time + dt;
    if (time >= DURATION) time = time % DURATION;
    const epochIndex = epochAt(time);
    set({ time, epochIndex });
  },
  setAutoCamera: (autoCamera) => set({ autoCamera }),
  setConstantsOpen: (constantsOpen) => set({ constantsOpen }),
  setTheoryOpen: (theoryOpen) => set({ theoryOpen }),
  replay: () =>
    set({
      intro: false,
      playing: true,
      time: 0,
      epochIndex: 0,
      autoCamera: true,
    }),
}));
