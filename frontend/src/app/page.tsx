"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  MoreVertical,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { NewMeetingModal } from "@/components/modal/NewMeetingModal";

export default function MeetingsDashboard() {
  const queryClient = useQueryClient();

  // ── States ──────────────────────────────────────────────────────────
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [participant, setParticipant] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState("recent");
  const [page, setPage] = React.useState(1);
  const perPage = 6; // compact size to show grid layouts

  // Modal control states
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(
    null
  );
  const [activeKebabId, setActiveKebabId] = React.useState<string | null>(null);

  // ── Debounce Search Query ───────────────────────────────────────────
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Fetch Meetings ──────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "meetings",
      debouncedSearch,
      participant,
      dateFrom,
      dateTo,
      sort,
      page,
    ],
    queryFn: () =>
      api.getMeetings({
        search: debouncedSearch || undefined,
        participant: participant || undefined,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
        sort,
        page,
        per_page: perPage,
      }),
  });

  // ── Extract Unique Participant Pool from list response ─────────────
  // This avoids a dedicated participant endpoint by harvesting names
  // from loaded records, as allowed in the specification.
  const allParticipants = React.useMemo(() => {
    if (!data?.items) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    data.items.forEach((meeting) => {
      meeting.participants?.forEach((p) => {
        if (!seen.has(p.name)) {
          seen.add(p.name);
          list.push(p.name);
        }
      });
    });
    return list.sort();
  }, [data?.items]);

  // ── Delete Meeting Mutation ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (meetingId: string) => api.deleteMeeting(meetingId),
    onSuccess: () => {
      toast.success("Meeting deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setDeleteModalOpen(false);
      setSelectedMeetingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete meeting");
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMeetingId(id);
    setDeleteModalOpen(true);
    setActiveKebabId(null);
  };

  const confirmDelete = () => {
    if (selectedMeetingId) {
      deleteMutation.mutate(selectedMeetingId);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setParticipant("");
    setDateFrom("");
    setDateTo("");
    setSort("recent");
    setPage(1);
  };

  // Close kebab menu when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveKebabId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleKebab = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveKebabId(activeKebabId === id ? null : id);
  };

  return (
    <DashboardLayout onNewMeetingClick={() => setIsNewMeetingModalOpen(true)}>
      {/* Filters Bar Area */}
      <section className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Search Title
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Sprint Planning..."
            />
          </div>

          {/* Participant Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Attendee
            </label>
            <Select
              value={participant}
              onChange={(e) => {
                setParticipant(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Attendees</option>
              {allParticipants.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Date From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Date To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Sort & Reset Actions */}
          <div className="flex gap-2 w-full">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary">
                Sort
              </label>
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="recent">Recent First</option>
                <option value="oldest">Oldest First</option>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleResetFilters}
              title="Reset filters"
              className="px-3 shrink-0 h-10 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Grid Meetings Content */}
      <section className="mb-6">
        {isLoading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="flex flex-col gap-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-brand-border">
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          /* Error state with retry action */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-brand-surface border border-brand-border rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-brand-danger/10 text-brand-danger flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-text-primary mb-1">
              Failed to connect to backend api
            </h3>
            <p className="text-sm text-brand-text-secondary max-w-sm mb-6 leading-relaxed">
              Please verify that the FastAPI backend server is running locally on port 8000.
            </p>
            <Button variant="primary" onClick={() => refetch()}>
              Retry Connection
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center p-16 text-center bg-brand-surface border border-brand-border rounded-xl shadow-sm select-none">
            <div className="w-16 h-16 rounded-full bg-brand-border/30 flex items-center justify-center text-brand-text-muted mb-4 border border-brand-border">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary mb-2">
              No meetings found
            </h3>
            <p className="text-sm text-brand-text-secondary max-w-md mb-6 leading-relaxed">
              No recorded transcripts fit your selected filter criteria. Try updating keyword searches, date ranges, or attendees.
            </p>
            <Button variant="secondary" onClick={handleResetFilters}>
              Reset Filter Queries
            </Button>
          </div>
        ) : (
          /* Meeting cards grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((meeting) => {
              const formattedDate = format(new Date(meeting.date), "MMM d, yyyy");
              const minutes = Math.round(meeting.duration_seconds / 60);

              return (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <Card hoverable className="h-full flex flex-col relative group">
                    {/* Header: Title and Actions */}
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="text-base font-bold text-brand-text-primary leading-snug group-hover:text-brand-accent transition-colors line-clamp-2 pr-4">
                        {meeting.title}
                      </h3>
                      
                      {/* Action Menu (Kebab) */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => toggleKebab(meeting.id, e)}
                          className="p-1 rounded-md text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border/40 shrink-0 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeKebabId === meeting.id ? (
                          <div className="absolute right-0 mt-1 w-32 rounded-lg border border-brand-border bg-[#161a25] py-1 shadow-lg z-10">
                            <button
                              onClick={(e) => handleDeleteClick(meeting.id, e)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-danger hover:bg-brand-danger/10 w-full text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Meeting
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="flex items-center gap-4 text-xs text-brand-text-secondary mb-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-text-muted" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
                        {minutes} min
                      </span>
                    </div>

                    {/* Badges/Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      <Badge variant="accent" className="text-[10px]">
                        Transcript
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-brand-accent" />
                        AI Summary
                      </Badge>
                    </div>

                    {/* Bottom: Attendees stack */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border">
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {meeting.participants?.slice(0, 4).map((p) => (
                          <Avatar
                            key={p.id}
                            name={p.name}
                            src={null} // initials fallback triggers
                            size="xs"
                            className="ring-2 ring-brand-surface"
                          />
                        ))}
                        {meeting.participants && meeting.participants.length > 4 ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-border text-[9px] font-bold text-brand-text-primary ring-2 ring-brand-surface">
                            +{meeting.participants.length - 4}
                          </div>
                        ) : null}
                      </div>
                      <span className="text-[11px] font-medium text-brand-text-muted group-hover:text-brand-text-secondary transition-colors">
                        View Note →
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Pagination controls */}
      {data && data.total_pages > 1 ? (
        <section className="flex justify-between items-center border-t border-brand-border pt-4">
          <p className="text-xs text-brand-text-secondary">
            Showing <span className="font-semibold text-brand-text-primary">{data.items.length}</span> of{" "}
            <span className="font-semibold text-brand-text-primary">{data.total}</span> meetings
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center px-3 text-xs font-semibold text-brand-text-secondary">
              Page {data.page} of {data.total_pages}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              disabled={page === data.total_pages}
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedMeetingId(null);
        }}
        title="Delete Meeting Transcript"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedMeetingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          Are you sure you want to delete this meeting transcript? This action is permanent and will cascade-delete the transcript segments, key topics, summaries, and action items associated with it.
        </p>
      </Modal>
      {/* New Meeting Creation Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingModalOpen}
        onClose={() => setIsNewMeetingModalOpen(false)}
      />
    </DashboardLayout>
  );
}
