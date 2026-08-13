"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Calendar, MessageSquare, ArrowRight, X } from "lucide-react";

import { api } from "@/lib/api";
import { usePlaybackStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

import { SearchResultItem } from "@/types";

export function CommandPalette() {
  const router = useRouter();
  const setSeekTo = usePlaybackStore((s) => s.setSeekTo);

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Listen for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Debounce input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => api.globalSearch(debouncedQuery),
    enabled: Boolean(debouncedQuery.trim() && isOpen),
  });

  const titleMatches: SearchResultItem[] = data?.title_matches || [];
  const transcriptMatches: SearchResultItem[] = data?.transcript_matches || [];
  const totalCount = titleMatches.length + transcriptMatches.length;

  const handleSelectMeeting = (meetingId: string, timestamp?: number) => {
    if (timestamp !== undefined) {
      setSeekTo(timestamp);
    }
    setIsOpen(false);
    setQuery("");
    router.push(`/meetings/${meetingId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-brand-border bg-brand-surface p-4 shadow-2xl transition-all flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
          <Search className="w-5 h-5 text-brand-accent shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search meetings, participants, or transcript snippets..."
            className="flex-1 bg-transparent text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-brand-text-muted bg-brand-bg border border-brand-border rounded">
            ESC
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="text-brand-text-muted hover:text-brand-text-primary p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto flex-1 pt-3 space-y-4 pr-1">
          {!debouncedQuery.trim() ? (
            <div className="py-8 text-center text-xs text-brand-text-muted space-y-1">
              <p className="font-semibold text-brand-text-secondary">
                Search across all meeting titles and multi-speaker transcripts
              </p>
              <p>Type keywords like &quot;roadmap&quot;, &quot;architecture&quot;, or speaker names.</p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center text-xs text-brand-text-muted animate-pulse">
              Searching database index...
            </div>
          ) : totalCount === 0 ? (
            <div className="py-8 text-center text-xs text-brand-text-muted">
              No matching meetings or transcript turns found for &quot;{debouncedQuery}&quot;.
            </div>
          ) : (
            <>
              {/* Title Matches Group */}
              {titleMatches.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted px-2">
                    Meetings by Title ({titleMatches.length})
                  </div>
                  {titleMatches.map((m: SearchResultItem) => (
                    <div
                      key={m.meeting_id}
                      onClick={() => handleSelectMeeting(m.meeting_id)}
                      className="p-3 bg-brand-bg/60 border border-brand-border hover:border-brand-accent/40 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">
                            {m.meeting_title}
                          </h4>
                          <p className="text-[11px] text-brand-text-muted mt-0.5">
                            {new Date(m.date).toLocaleDateString()} • {Math.round(m.duration_seconds / 60)} mins
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-brand-text-muted group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Transcript Matches Group */}
              {transcriptMatches.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted px-2">
                    Transcript Segment Matches ({transcriptMatches.length})
                  </div>
                  {transcriptMatches.map((item: SearchResultItem, i: number) => (
                    <div
                      key={i}
                      onClick={() =>
                        handleSelectMeeting(
                          item.meeting_id,
                          item.segment?.start_time_seconds
                        )
                      }
                      className="p-3 bg-brand-bg/60 border border-brand-border hover:border-brand-accent/40 rounded-xl transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-accent" />
                          <span className="text-xs font-bold text-brand-text-primary">
                            {item.meeting_title}
                          </span>
                        </div>
                        {item.segment ? (
                          <Badge variant="accent" className="text-[9px]">
                            {item.segment.speaker_name} @ {Math.floor(item.segment.start_time_seconds / 60)}:{(Math.floor(item.segment.start_time_seconds % 60)).toString().padStart(2, '0')}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-brand-text-secondary line-clamp-2 italic pl-5 border-l-2 border-brand-accent/40">
                        &quot;{item.snippet}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="pt-3 border-t border-brand-border mt-2 flex items-center justify-between text-[11px] text-brand-text-muted">
          <span>Navigate with mouse or click matching snippet to seek audio</span>
          <span className="font-mono">Cmd + K</span>
        </div>
      </div>
    </div>
  );
}
