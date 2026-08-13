import { create } from "zustand";

interface PlaybackState {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  seekTo: number | null;
  setSeekTo: (time: number | null) => void;
  duration: number;
  setDuration: (duration: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  seekTo: null,
  setSeekTo: (time) => set({ seekTo: time }),
  duration: 0,
  setDuration: (duration) => set({ duration }),
  playbackSpeed: 1.0,
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
