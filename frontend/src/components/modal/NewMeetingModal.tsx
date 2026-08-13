"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewMeetingModal({ isOpen, onClose }: NewMeetingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [durationMinutes, setDurationMinutes] = React.useState("30");
  const [participantInput, setParticipantInput] = React.useState("");
  const [participants, setParticipants] = React.useState<string[]>([
    "Sakshi Malik",
  ]);

  // Mode: "paste" | "upload"
  const [transcriptMode, setTranscriptMode] = React.useState<"paste" | "upload">(
    "paste"
  );
  const [pastedText, setPastedText] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Field Errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [apiError, setApiError] = React.useState<string | null>(null);

  // ── Reset form when opened ──────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDate(new Date().toISOString().split("T")[0]);
      setDurationMinutes("30");
      setParticipantInput("");
      setParticipants(["Sakshi Malik"]);
      setTranscriptMode("paste");
      setPastedText("");
      setSelectedFile(null);
      setErrors({});
      setApiError(null);
    }
  }, [isOpen]);

  // ── Participant Chip Helpers ───────────────────────────────────────
  const addParticipant = (name: string) => {
    const trimmed = name.trim().replace(/,/g, "");
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
    }
    setParticipantInput("");
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleParticipantKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addParticipant(participantInput);
    } else if (
      e.key === "Backspace" &&
      !participantInput &&
      participants.length > 0
    ) {
      removeParticipant(participants.length - 1);
    }
  };

  // ── Create Mutation ────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.createMeeting(formData),
    onSuccess: (newMeeting) => {
      toast.success("Meeting created and summary generated!");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onClose();
      router.push(`/meetings/${newMeeting.id}`);
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to create meeting";
      setApiError(msg);
      toast.error(msg);
    },
  });

  // ── Submit Validation ──────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Meeting title is required";
    }

    if (participants.length === 0) {
      newErrors.participants = "At least one participant is required";
    }

    const durationSec = parseInt(durationMinutes, 10) * 60;
    if (isNaN(durationSec) || durationSec <= 0) {
      newErrors.duration = "Duration must be greater than 0 minutes";
    }

    if (transcriptMode === "paste" && !pastedText.trim()) {
      newErrors.transcript = "Please paste transcript content";
    } else if (transcriptMode === "upload" && !selectedFile) {
      newErrors.transcript = "Please select a transcript file (.txt, .vtt, .json)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("date", new Date(date).toISOString());
    formData.append("duration_seconds", (parseInt(durationMinutes, 10) * 60).toString());
    formData.append("participant_names", participants.join(", "));

    if (transcriptMode === "paste") {
      formData.append("transcript_text", pastedText.trim());
    } else if (selectedFile) {
      formData.append("transcript_file", selectedFile);
    }

    createMutation.mutate(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Meeting"
      className="max-w-xl"
    >
      {/* Loading Overlay */}
      {createMutation.isPending ? (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
          <h3 className="text-base font-bold text-brand-text-primary">
            Creating Meeting & Generating Summary...
          </h3>
          <p className="text-xs text-brand-text-muted max-w-xs">
            Parsing transcript turns and extracting overview, topics, and action items. Please wait...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top API Error Banner */}
          {apiError ? (
            <div className="p-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg text-xs text-brand-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          ) : null}

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Meeting Title <span className="text-brand-danger">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Strategy Sync"
              className={errors.title ? "border-brand-danger" : ""}
            />
            {errors.title ? (
              <p className="text-[11px] text-brand-danger">{errors.title}</p>
            ) : null}
          </div>

          {/* Date and Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-secondary">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text-secondary">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={errors.duration ? "border-brand-danger" : ""}
              />
              {errors.duration ? (
                <p className="text-[11px] text-brand-danger">{errors.duration}</p>
              ) : null}
            </div>
          </div>

          {/* Multi-value Participant Chips Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Participants <span className="text-brand-danger">*</span>
            </label>
            <div
              className={`flex flex-wrap items-center gap-1.5 p-2 bg-brand-bg border rounded-lg min-h-10 ${
                errors.participants ? "border-brand-danger" : "border-brand-border"
              }`}
            >
              {participants.map((p, idx) => (
                <Badge
                  key={idx}
                  variant="accent"
                  className="flex items-center gap-1 text-xs py-0.5"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removeParticipant(idx)}
                    className="hover:text-brand-danger cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={handleParticipantKeyDown}
                onBlur={() => {
                  if (participantInput) addParticipant(participantInput);
                }}
                placeholder={
                  participants.length === 0 ? "Type name and press Enter..." : "Add more..."
                }
                className="flex-1 bg-transparent text-xs text-brand-text-primary focus:outline-none min-w-[120px]"
              />
            </div>
            {errors.participants ? (
              <p className="text-[11px] text-brand-danger">{errors.participants}</p>
            ) : (
              <p className="text-[10px] text-brand-text-muted">
                Type a name and press Enter or comma to add.
              </p>
            )}
          </div>

          {/* Transcript Source Tabs */}
          <div className="space-y-2 pt-2 border-t border-brand-border">
            <label className="text-xs font-semibold text-brand-text-secondary">
              Transcript Source <span className="text-brand-danger">*</span>
            </label>
            <div className="flex gap-2 p-1 bg-brand-bg border border-brand-border rounded-lg">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  transcriptMode === "paste"
                    ? "bg-brand-surface text-brand-accent border border-brand-accent/30"
                    : "text-brand-text-muted hover:text-brand-text-primary"
                }`}
                onClick={() => setTranscriptMode("paste")}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Text
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  transcriptMode === "upload"
                    ? "bg-brand-surface text-brand-accent border border-brand-accent/30"
                    : "text-brand-text-muted hover:text-brand-text-primary"
                }`}
                onClick={() => setTranscriptMode("upload")}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File (.txt/.vtt/.json)
              </button>
            </div>

            {/* Mode 1: Paste Textarea */}
            {transcriptMode === "paste" ? (
              <div className="space-y-1">
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Speaker Name [00:00:10]: Hello team...\nAlex Chen [00:00:25]: We need to review the roadmap.`}
                  className={`h-36 text-xs font-mono ${
                    errors.transcript ? "border-brand-danger" : ""
                  }`}
                />
              </div>
            ) : (
              /* Mode 2: File Upload Dropzone */
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  errors.transcript
                    ? "border-brand-danger bg-brand-danger/5"
                    : selectedFile
                    ? "border-brand-accent/50 bg-brand-accent/5"
                    : "border-brand-border bg-brand-bg hover:border-brand-text-muted"
                }`}
              >
                <input
                  type="file"
                  accept=".txt,.vtt,.json"
                  className="hidden"
                  id="transcript-file-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="transcript-file-input"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-brand-accent" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-brand-text-primary">
                        Click to select a file
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        Supports WebVTT (.vtt), JSON (.json), or Plain Text (.txt)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {errors.transcript ? (
              <p className="text-[11px] text-brand-danger">{errors.transcript}</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              Create Meeting
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
