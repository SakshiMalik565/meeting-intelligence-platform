"use client";

import * as React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlaybackStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Input";

interface MediaPlayerProps {
  mediaUrl?: string | null;
  title?: string;
  className?: string;
}

export function MediaPlayer({ mediaUrl, title, className }: MediaPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Zustand Store
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    seekTo,
    setSeekTo,
    duration,
    setDuration,
    playbackSpeed,
    setPlaybackSpeed,
  } = usePlaybackStore();

  const [volume, setVolume] = React.useState(1.0);
  const [isMuted, setIsMuted] = React.useState(false);

  // Fallback public domain audio if mediaUrl is missing or fails
  const sourceUrl =
    mediaUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  // ── Sync seekTo trigger from Zustand ────────────────────────────────
  React.useEffect(() => {
    if (seekTo !== null && audioRef.current) {
      audioRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
      setSeekTo(null); // Reset trigger
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [seekTo, setCurrentTime, setSeekTo, isPlaying, setIsPlaying]);

  // ── Sync Playback Speed ─────────────────────────────────────────────
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // ── Format Seconds to MM:SS or HH:MM:SS ─────────────────────────────
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // ── Playback Handlers ───────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      duration || 0
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeToggle = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div
      className={cn(
        "bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm flex flex-col gap-3 select-none",
        className
      )}
    >
      {/* Hidden Native HTML5 Audio Tag */}
      <audio
        ref={audioRef}
        src={sourceUrl}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Top Details (Title & Time) */}
      <div className="flex items-center justify-between text-xs text-brand-text-secondary">
        <span className="font-semibold text-brand-text-primary truncate max-w-[250px]">
          {title || "Audio Playback"}
        </span>
        <span className="font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Draggable Custom Seek Bar */}
      <div className="relative flex items-center group cursor-pointer">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent focus:outline-none"
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Volume control */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVolumeToggle}
            className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary rounded-lg transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-brand-danger" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSkip(-10)}
            className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary rounded-lg transition-colors cursor-pointer"
            title="Skip back 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary rounded-lg transition-colors cursor-pointer"
            title="Skip forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Playback Speed Selector */}
        <div className="flex items-center gap-1">
          <Select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="h-8 text-xs px-2 py-0 w-20 bg-brand-bg border-brand-border"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
