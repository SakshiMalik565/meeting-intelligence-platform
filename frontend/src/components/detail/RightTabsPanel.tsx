"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Sparkles,
  CheckSquare,
  List,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  RefreshCw,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Meeting, ActionItem } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface RightTabsPanelProps {
  meeting: Meeting;
  className?: string;
}

export function RightTabsPanel({ meeting, className }: RightTabsPanelProps) {
  const queryClient = useQueryClient();

  // ── Inline Add Action Item State ─────────────────────────────────────
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newAiText, setNewAiText] = React.useState("");
  const [newAiAssignee, setNewAiAssignee] = React.useState("");

  // ── Inline Edit Action Item State ───────────────────────────────────
  const [editingAiId, setEditingAiId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [editingAssignee, setEditingAssignee] = React.useState("");

  // ── 1. Regenerate Summary Mutation ──────────────────────────────────
  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateSummary(meeting.id),
    onSuccess: () => {
      toast.success("Summary and topics regenerated successfully!");
      queryClient.invalidateQueries({ queryKey: ["meeting", meeting.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to regenerate summary");
    },
  });

  // ── 2. Create Action Item Mutation ──────────────────────────────────
  const createAiMutation = useMutation({
    mutationFn: (data: { text: string; assignee_name?: string }) =>
      api.createActionItem(meeting.id, data),
    onSuccess: () => {
      toast.success("Action item added");
      setNewAiText("");
      setNewAiAssignee("");
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["meeting", meeting.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add action item");
    },
  });

  // ── 3. Toggle Complete / Update Action Item Mutation ────────────────
  const updateAiMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { text?: string; assignee_name?: string | null; is_completed?: boolean };
    }) => api.updateActionItem(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic UI update for completion toggle
      await queryClient.cancelQueries({ queryKey: ["meeting", meeting.id] });
      const previousMeeting = queryClient.getQueryData<Meeting>(["meeting", meeting.id]);

      if (previousMeeting && previousMeeting.action_items) {
        const updatedItems = previousMeeting.action_items.map((ai) =>
          ai.id === id ? { ...ai, ...data } : ai
        );
        queryClient.setQueryData(["meeting", meeting.id], {
          ...previousMeeting,
          action_items: updatedItems,
        });
      }
      return { previousMeeting };
    },
    onError: (err, variables, context) => {
      if (context?.previousMeeting) {
        queryClient.setQueryData(["meeting", meeting.id], context.previousMeeting);
      }
      toast.error(err.message || "Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meeting.id] });
      setEditingAiId(null);
    },
  });

  // ── 4. Delete Action Item Mutation ──────────────────────────────────
  const deleteAiMutation = useMutation({
    mutationFn: (id: string) => api.deleteActionItem(id),
    onSuccess: () => {
      toast.success("Action item deleted");
      queryClient.invalidateQueries({ queryKey: ["meeting", meeting.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete action item");
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAiText.trim()) return;
    createAiMutation.mutate({
      text: newAiText.trim(),
      assignee_name: newAiAssignee.trim() || undefined,
    });
  };

  const startEditAi = (ai: ActionItem) => {
    setEditingAiId(ai.id);
    setEditingText(ai.text);
    setEditingAssignee(ai.assignee_name || "");
  };

  const handleEditSubmit = (id: string) => {
    if (!editingText.trim()) return;
    updateAiMutation.mutate({
      id,
      data: {
        text: editingText.trim(),
        assignee_name: editingAssignee.trim() || null,
      },
    });
  };

  const relativeTime = meeting.summary?.generated_at
    ? formatDistanceToNow(new Date(meeting.summary.generated_at), { addSuffix: true })
    : null;

  return (
    <Card className={className}>
      <Tabs defaultValue="summary">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="summary" className="flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="action_items" className="flex items-center gap-1.5 text-xs">
            <CheckSquare className="w-3.5 h-3.5" />
            Action Items
            {meeting.action_items && meeting.action_items.length > 0 ? (
              <Badge variant="accent" className="text-[9px] px-1.5 py-0 ml-1">
                {meeting.action_items.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="key_topics" className="flex items-center gap-1.5 text-xs">
            <List className="w-3.5 h-3.5" />
            Topics
          </TabsTrigger>
        </TabsList>

        {/* ── Summary Tab ────────────────────────────────────────────── */}
        <TabsContent value="summary" className="p-0">
          <div className="space-y-4">
            <div className="p-4 bg-brand-bg/60 border border-brand-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                  Overview
                </h4>
                {relativeTime ? (
                  <span className="text-[11px] text-brand-text-muted">
                    {relativeTime}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                {meeting.summary?.overview_text || "No summary overview generated yet."}
              </p>
            </div>

            {/* Regenerate Action */}
            <div className="pt-2 border-t border-brand-border flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">
                Re-analyze transcript text
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5 text-xs"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    regenerateMutation.isPending ? "animate-spin text-brand-accent" : ""
                  }`}
                />
                {regenerateMutation.isPending ? "Generating..." : "Regenerate Summary"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Action Items Tab (Full Interactive CRUD) ───────────────── */}
        <TabsContent value="action_items" className="p-0">
          <div className="space-y-4">
            {/* Header & Add Trigger */}
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                Action Items ({meeting.action_items?.length || 0})
              </span>
              {!showAddForm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1 text-brand-accent hover:bg-brand-accent/10"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </Button>
              ) : null}
            </div>

            {/* Inline Add Action Item Form */}
            {showAddForm ? (
              <form
                onSubmit={handleAddSubmit}
                className="p-3 bg-brand-surface/90 border border-brand-accent/40 rounded-xl space-y-2.5 animate-in fade-in"
              >
                <Input
                  value={newAiText}
                  onChange={(e) => setNewAiText(e.target.value)}
                  placeholder="Task description (e.g. Schedule follow-up)..."
                  className="text-xs h-8"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Input
                    value={newAiAssignee}
                    onChange={(e) => setNewAiAssignee(e.target.value)}
                    placeholder="Assignee (optional)..."
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={createAiMutation.isPending || !newAiText.trim()}
                  >
                    {createAiMutation.isPending ? "Adding..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : null}

            {/* Action Items List */}
            {meeting.action_items && meeting.action_items.length > 0 ? (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {meeting.action_items.map((ai) => {
                  const isEditing = editingAiId === ai.id;

                  return (
                    <div
                      key={ai.id}
                      className={`group p-3 rounded-xl border transition-all ${
                        ai.is_completed
                          ? "bg-brand-bg/40 border-brand-border/40 opacity-70"
                          : "bg-brand-bg/70 border-brand-border hover:border-brand-accent/30"
                      }`}
                    >
                      {isEditing ? (
                        /* Inline Edit View */
                        <div className="space-y-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-xs h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSubmit(ai.id);
                              if (e.key === "Escape") setEditingAiId(null);
                            }}
                            autoFocus
                          />
                          <div className="flex justify-between items-center gap-2">
                            <Input
                              value={editingAssignee}
                              onChange={(e) => setEditingAssignee(e.target.value)}
                              placeholder="Assignee..."
                              className="text-xs h-7 flex-1"
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="primary"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEditSubmit(ai.id)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setEditingAiId(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Standard View Row */
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={ai.is_completed}
                            onChange={(e) =>
                              updateAiMutation.mutate({
                                id: ai.id,
                                data: { is_completed: e.target.checked },
                              })
                            }
                            className="mt-0.5 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent/20 cursor-pointer w-4 h-4"
                          />
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => startEditAi(ai)}
                          >
                            <p
                              className={`text-xs leading-snug transition-all ${
                                ai.is_completed
                                  ? "line-through text-brand-text-muted"
                                  : "text-brand-text-primary hover:text-brand-accent"
                              }`}
                            >
                              {ai.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {ai.assignee_name ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded border border-brand-accent/20">
                                  <User className="w-2.5 h-2.5" />
                                  {ai.assignee_name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-brand-text-muted italic">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditAi(ai)}
                              className="p-1 text-brand-text-muted hover:text-brand-text-primary rounded cursor-pointer"
                              title="Edit action item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteAiMutation.mutate(ai.id)}
                              className="p-1 text-brand-text-muted hover:text-brand-danger rounded cursor-pointer"
                              title="Delete action item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !showAddForm ? (
              <div className="text-center p-6 bg-brand-bg/40 rounded-xl border border-brand-border space-y-2">
                <p className="text-xs text-brand-text-muted">No action items yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Task
                </Button>
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* ── Key Topics Tab (Read-Only Outline) ─────────────────────── */}
        <TabsContent value="key_topics" className="p-0">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
              Discussion Outline ({meeting.key_topics?.length || 0})
            </h4>

            {meeting.key_topics && meeting.key_topics.length > 0 ? (
              <div className="space-y-2">
                {meeting.key_topics.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3 bg-brand-bg/60 border border-brand-border rounded-xl flex items-center gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-brand-text-primary">
                      {t.topic_text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic">No topics extracted.</p>
            )}

            <p className="text-[11px] text-brand-text-muted italic border-t border-brand-border pt-3">
              Note: Key topics are automatically extracted when meeting summaries are generated or regenerated.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
