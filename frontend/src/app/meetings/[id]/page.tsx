"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { exportTranscriptAsTxt, exportMeetingAsMarkdown } from "@/lib/export";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MediaPlayer } from "@/components/player/MediaPlayer";
import { TranscriptPanel } from "@/components/transcript/TranscriptPanel";
import { RightTabsPanel } from "@/components/detail/RightTabsPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { NewMeetingModal } from "@/components/modal/NewMeetingModal";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const meetingId = params?.id as string;

  // Modals state
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [kebabOpen, setKebabOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = React.useState("");
  const [editParticipants, setEditParticipants] = React.useState("");

  // ── Fetch Meeting Detail ────────────────────────────────────────────
  const { data: meeting, isLoading, isError } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => api.getMeeting(meetingId),
    enabled: Boolean(meetingId),
  });

  // Populate edit form when meeting loads
  React.useEffect(() => {
    if (meeting) {
      setEditTitle(meeting.title);
      setEditParticipants(
        meeting.participants?.map((p) => p.name).join(", ") || ""
      );
    }
  }, [meeting]);

  // ── Delete Mutation ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteMeeting(meetingId),
    onSuccess: () => {
      toast.success("Meeting deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.push("/");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete meeting");
    },
  });

  // ── Edit Mutation ──────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: () =>
      api.updateMeeting(meetingId, {
        title: editTitle,
        participant_names: editParticipants
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Meeting metadata updated successfully");
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setEditModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update meeting");
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-[450px] w-full rounded-xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-[600px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !meeting) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-16 text-center bg-brand-surface border border-brand-border rounded-xl shadow-sm my-12">
          <div className="w-16 h-16 rounded-full bg-brand-danger/10 text-brand-danger flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-brand-text-primary mb-2">
            Meeting Not Found
          </h2>
          <p className="text-sm text-brand-text-secondary max-w-md mb-6 leading-relaxed">
            The requested meeting transcript ID does not exist or has been deleted.
          </p>
          <Link href="/">
            <Button variant="primary" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const formattedDate = format(new Date(meeting.date), "EEEE, MMMM d, yyyy");
  const minutes = Math.round(meeting.duration_seconds / 60);

  return (
    <DashboardLayout onNewMeetingClick={() => setIsNewMeetingModalOpen(true)}>
      <div className="space-y-6">
        {/* Top Breadcrumb & Metadata Header */}
        <div className="space-y-3 border-b border-brand-border pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-accent transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Meetings
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
                {meeting.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-text-muted" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
                  {minutes} minutes
                </span>
              </div>
            </div>

            {/* Right: Participants, Export & Kebab Options */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center -space-x-2">
                {meeting.participants?.map((p) => (
                  <Avatar
                    key={p.id}
                    name={p.name}
                    src={null}
                    size="sm"
                    className="ring-2 ring-brand-bg"
                  />
                ))}
              </div>

              {/* Export Dropdown Menu */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs px-2.5"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  <Download className="w-3.5 h-3.5 text-brand-accent" />
                  Export
                </Button>

                {exportMenuOpen ? (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-brand-border bg-[#161a25] py-1 shadow-lg z-20">
                    <button
                      onClick={async () => {
                        setExportMenuOpen(false);
                        const transcriptData = await api.getMeetingTranscript(meetingId);
                        exportTranscriptAsTxt(meeting.title, transcriptData.segments);
                        toast.success("Transcript exported as .txt");
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-brand-text-primary hover:bg-brand-surface w-full text-left cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-accent" />
                      Export Transcript (.txt)
                    </button>
                    <button
                      onClick={async () => {
                        setExportMenuOpen(false);
                        const transcriptData = await api.getMeetingTranscript(meetingId);
                        exportMeetingAsMarkdown(meeting, transcriptData.segments);
                        toast.success("Meeting report exported as .md");
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-brand-text-primary hover:bg-brand-surface w-full text-left cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-accent" />
                      Export Full Report (.md)
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Kebab Action Dropdown */}
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-2"
                  onClick={() => setKebabOpen(!kebabOpen)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {kebabOpen ? (
                  <div className="absolute right-0 mt-1 w-40 rounded-lg border border-brand-border bg-[#161a25] py-1 shadow-lg z-20">
                    <button
                      onClick={() => {
                        setKebabOpen(false);
                        setEditModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-brand-text-primary hover:bg-brand-surface w-full text-left cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-brand-accent" />
                      Edit Metadata
                    </button>
                    <button
                      onClick={() => {
                        setKebabOpen(false);
                        setDeleteModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-brand-danger hover:bg-brand-danger/10 w-full text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Meeting
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left/Center Column: Custom Player + Synchronized Transcript Panel */}
          <div className="lg:col-span-2 space-y-6">
            <MediaPlayer mediaUrl={meeting.media_url} title={meeting.title} />
            <TranscriptPanel meetingId={meeting.id} />
          </div>

          {/* Right Column: Tab Shell for Summary, Action Items & Topics */}
          <div className="lg:col-span-1">
            <RightTabsPanel meeting={meeting} className="h-[730px]" />
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Meeting Metadata"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Meeting Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Meeting Title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Participants (Comma-separated)
            </label>
            <Input
              value={editParticipants}
              onChange={(e) => setEditParticipants(e.target.value)}
              placeholder="e.g. Sarah Kim, Alex Chen"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Meeting Transcript"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-text-secondary leading-relaxed">
          Are you sure you want to delete &quot;{meeting.title}&quot;? This action cannot be undone and will delete all associated transcript segments, summaries, and action items.
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
