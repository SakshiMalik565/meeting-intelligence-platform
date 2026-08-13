"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  ArrowDown,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import { usePlaybackStore } from "@/lib/store";
import { TranscriptSegment, TranscriptMatch } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

interface TranscriptPanelProps {
  meetingId: string;
  className?: string;
}

// Helper: Hash speaker name to deterministic color badge
function getSpeakerColorVariant(name: string): "accent" | "secondary" | "success" | "warning" | "danger" {
  const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants: ("accent" | "secondary" | "success" | "warning" | "danger")[] = [
    "accent",
    "secondary",
    "success",
    "warning",
    "danger",
  ];
  return variants[sum % variants.length];
}

// Helper: Format seconds to MM:SS
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ── Memoized Individual Segment Row (Performance Optimized) ─────────
interface TranscriptRowProps {
  segment: TranscriptSegment;
  isActive: boolean;
  onSegmentClick: (startTime: number) => void;
  matches?: TranscriptMatch[];
  isMatchHighlight?: boolean;
}

const TranscriptRow = React.memo(
  function TranscriptRow({
    segment,
    isActive,
    onSegmentClick,
    matches,
    isMatchHighlight,
  }: TranscriptRowProps) {
    const rowRef = React.useRef<HTMLDivElement | null>(null);

    // Scroll into view if active and requested
    React.useEffect(() => {
      if (isActive && rowRef.current) {
        rowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [isActive]);

    // Render text with highlighted substring matches
    const renderText = () => {
      if (!matches || matches.length === 0) {
        return segment.text;
      }

      const text = segment.text;
      const elements: React.ReactNode[] = [];
      let lastIdx = 0;

      matches.forEach((m, i) => {
        if (m.start_char > lastIdx) {
          elements.push(text.substring(lastIdx, m.start_char));
        }
        elements.push(
          <mark
            key={i}
            className="bg-brand-accent/40 text-brand-text-primary px-0.5 rounded border border-brand-accent/50 font-semibold"
          >
            {text.substring(m.start_char, m.end_char)}
          </mark>
        );
        lastIdx = m.end_char;
      });

      if (lastIdx < text.length) {
        elements.push(text.substring(lastIdx));
      }

      return elements;
    };

    return (
      <div
        ref={rowRef}
        onClick={() => onSegmentClick(segment.start_time_seconds)}
        className={cn(
          "p-3.5 rounded-lg border transition-all cursor-pointer group mb-2.5",
          isActive
            ? "bg-brand-accent/15 border-brand-accent/50 border-l-4 border-l-brand-accent shadow-sm"
            : "bg-brand-surface/60 border-brand-border/60 hover:bg-brand-surface-hover hover:border-brand-border",
          isMatchHighlight && "ring-2 ring-brand-accent"
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge variant={getSpeakerColorVariant(segment.speaker_name)}>
            {segment.speaker_name}
          </Badge>
          <span className="text-xs font-mono text-brand-text-muted group-hover:text-brand-text-secondary">
            {formatTimestamp(segment.start_time_seconds)}
          </span>
        </div>
        <p className="text-sm text-brand-text-primary leading-relaxed">
          {renderText()}
        </p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom memo comparison: only re-render if active state, match count, or highlight changes
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.isMatchHighlight === nextProps.isMatchHighlight &&
      prevProps.matches === nextProps.matches &&
      prevProps.segment.text === nextProps.segment.text
    );
  }
);

// ── Main Transcript Panel ───────────────────────────────────────────
export function TranscriptPanel({ meetingId, className }: TranscriptPanelProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [activeMatchIndex, setActiveMatchIndex] = React.useState(0);
  const [userScrolledAway, setUserScrolledAway] = React.useState(false);

  const { currentTime, setSeekTo } = usePlaybackStore();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setActiveMatchIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch transcript segments (with search query parameter if present)
  const { data, isLoading } = useQuery({
    queryKey: ["transcript", meetingId, debouncedQuery],
    queryFn: () => api.getMeetingTranscript(meetingId, debouncedQuery || undefined),
  });

  const segments = data?.segments || [];
  const totalMatches = data?.match_count || 0;

  // Collect array of segment indices that contain matches for navigation
  const matchingSegmentIndices = React.useMemo(() => {
    const list: number[] = [];
    segments.forEach((seg, idx) => {
      if (seg.matches && seg.matches.length > 0) {
        list.push(idx);
      }
    });
    return list;
  }, [segments]);

  // Determine active segment based on current audio playback time
  const activeSegmentIndex = React.useMemo(() => {
    return segments.findIndex(
      (seg) =>
        currentTime >= seg.start_time_seconds &&
        currentTime < seg.end_time_seconds
    );
  }, [segments, currentTime]);

  // Handle user manual scrolling to pause auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    setUserScrolledAway(true);
  };

  const handleSegmentClick = (startTime: number) => {
    setSeekTo(startTime);
    setUserScrolledAway(false); // Resume auto-scroll when segment clicked
  };

  const handleJumpToActive = () => {
    setUserScrolledAway(false);
  };

  // Match navigation
  const handleNextMatch = () => {
    if (matchingSegmentIndices.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchingSegmentIndices.length;
    setActiveMatchIndex(nextIdx);
    const targetSegIdx = matchingSegmentIndices[nextIdx];
    const targetSeg = segments[targetSegIdx];
    if (targetSeg) {
      setSeekTo(targetSeg.start_time_seconds);
    }
  };

  const handlePrevMatch = () => {
    if (matchingSegmentIndices.length === 0) return;
    const prevIdx =
      (activeMatchIndex - 1 + matchingSegmentIndices.length) %
      matchingSegmentIndices.length;
    setActiveMatchIndex(prevIdx);
    const targetSegIdx = matchingSegmentIndices[prevIdx];
    const targetSeg = segments[targetSegIdx];
    if (targetSeg) {
      setSeekTo(targetSeg.start_time_seconds);
    }
  };

  return (
    <div
      className={cn(
        "bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col h-[580px] relative shadow-sm",
        className
      )}
    >
      {/* Panel Header & In-Transcript Search Bar */}
      <div className="pb-3 border-b border-brand-border mb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-accent" />
            <h3 className="text-sm font-bold text-brand-text-primary">
              Transcript ({segments.length} turns)
            </h3>
          </div>

          {userScrolledAway && activeSegmentIndex !== -1 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleJumpToActive}
              className="text-xs py-1 px-2.5 flex items-center gap-1 text-brand-accent border-brand-accent/30 bg-brand-accent/10"
            >
              <ArrowDown className="w-3 h-3" />
              Jump to current
            </Button>
          ) : null}
        </div>

        {/* Search Input Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-brand-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript text..."
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-brand-text-muted hover:text-brand-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Match Counter & Next/Prev Controls */}
          {debouncedQuery ? (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-brand-text-secondary px-2 font-mono">
                {totalMatches > 0
                  ? `${activeMatchIndex + 1} of ${totalMatches}`
                  : "0 matches"}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="px-1.5 h-8"
                onClick={handlePrevMatch}
                disabled={totalMatches === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="px-1.5 h-8"
                onClick={handleNextMatch}
                disabled={totalMatches === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Segment List Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pr-1 select-text"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary p-6">
            <p className="text-sm">No transcript segments found.</p>
          </div>
        ) : (
          segments.map((segment, idx) => {
            const isActive = idx === activeSegmentIndex;
            const isMatchHighlight =
              matchingSegmentIndices[activeMatchIndex] === idx;

            return (
              <TranscriptRow
                key={segment.id}
                segment={segment}
                isActive={isActive && !userScrolledAway}
                onSegmentClick={handleSegmentClick}
                matches={segment.matches}
                isMatchHighlight={isMatchHighlight}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
