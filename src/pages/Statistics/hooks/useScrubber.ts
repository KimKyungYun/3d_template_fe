import { create } from 'zustand';

interface ScrubberState {
  /** 히트맵이 보여 주는 칸 — null 이면 기간 전체 */
  index: number | null;
  playing: boolean;
  setIndex: (index: number | null) => void;
  setPlaying: (playing: boolean) => void;
}

/** 시간 스크러버 — 3D 히트맵(HeatDriver)과 스크러버·차트가 같은 칸을 본다 */
export const useScrubber = create<ScrubberState>((set) => ({
  index: null,
  playing: false,
  setIndex: (index) => set({ index }),
  setPlaying: (playing) => set({ playing }),
}));
