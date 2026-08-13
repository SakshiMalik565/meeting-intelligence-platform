"use client";

import * as React from "react";
import { Sparkles, CheckSquare, List } from "lucide-react";
import { Meeting } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RightTabsPanelProps {
  meeting: Meeting;
  className?: string;
}

export function RightTabsPanel({ meeting, className }: RightTabsPanelProps) {
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
              <Badge variant="accent" className="text-[9px] px-1 py-0 ml-1">
                {meeting.action_items.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="key_topics" className="flex items-center gap-1.5 text-xs">
            <List className="w-3.5 h-3.5" />
            Topics
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab Preview */}
        <TabsContent value="summary" className="p-0">
          <div className="space-y-4">
            <div className="p-4 bg-brand-bg/60 border border-brand-border rounded-lg">
              <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                Executive Summary Overview
              </h4>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                {meeting.summary?.overview_text || "No summary text generated yet."}
              </p>
            </div>
            <div className="text-xs text-brand-text-muted italic border-t border-brand-border pt-3">
              Full AI summary editor and regeneration tools will be activated in Phase 5.
            </div>
          </div>
        </TabsContent>

        {/* Action Items Tab Preview */}
        <TabsContent value="action_items" className="p-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-brand-border">
              <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                Extracted Tasks ({meeting.action_items?.length || 0})
              </span>
            </div>
            {meeting.action_items && meeting.action_items.length > 0 ? (
              meeting.action_items.map((ai) => (
                <div
                  key={ai.id}
                  className="p-3 bg-brand-bg/60 border border-brand-border rounded-lg flex items-start gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={ai.is_completed}
                    readOnly
                    className="mt-0.5 rounded border-brand-border text-brand-accent focus:ring-brand-accent/20 cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-text-primary leading-snug">
                      {ai.text}
                    </p>
                    {ai.assignee_name ? (
                      <span className="inline-block mt-1 text-[10px] text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">
                        Assignee: {ai.assignee_name}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-text-muted italic">No action items extracted.</p>
            )}
            <div className="text-xs text-brand-text-muted italic border-t border-brand-border pt-3">
              Interactive task toggle, edit, and custom task creation will be activated in Phase 5.
            </div>
          </div>
        </TabsContent>

        {/* Key Topics Tab Preview */}
        <TabsContent value="key_topics" className="p-0">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-2">
              Key Discussion Highlights
            </h4>
            <div className="flex flex-wrap gap-2">
              {meeting.key_topics && meeting.key_topics.length > 0 ? (
                meeting.key_topics.map((t) => (
                  <Badge key={t.id} variant="secondary" className="py-1 px-2.5 text-xs">
                    # {t.topic_text}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-brand-text-muted italic">No topics extracted.</p>
              )}
            </div>
            <div className="text-xs text-brand-text-muted italic border-t border-brand-border pt-3 mt-4">
              Full topic search filtering and topic tag navigation will be activated in Phase 5.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
