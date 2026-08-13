import { Meeting, TranscriptSegment } from "@/types";

// Helper: Format seconds to MM:SS
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Trigger browser download for generated blob content
function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Export Plain Text Transcript (.txt) ──────────────────────────────
export function exportTranscriptAsTxt(
  meetingTitle: string,
  segments: TranscriptSegment[]
) {
  const lines: string[] = [
    `TRANSCRIPT: ${meetingTitle}`,
    `Exported from Fireflies.ai Platform Clone`,
    `--------------------------------------------------------------------------------`,
    "",
  ];

  segments.forEach((seg) => {
    lines.push(`[${formatTimestamp(seg.start_time_seconds)}] ${seg.speaker_name}: ${seg.text}`);
  });

  const content = lines.join("\n");
  const sanitizedTitle = meetingTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
  downloadFile(`${sanitizedTitle}_transcript.txt`, content, "text/plain;charset=utf-8");
}

// ── Export Formatted Markdown Summary & Transcript (.md) ────────────
export function exportMeetingAsMarkdown(
  meeting: Meeting,
  segments: TranscriptSegment[]
) {
  const participantsList = meeting.participants?.map((p) => p.name).join(", ") || "N/A";
  const minutes = Math.round(meeting.duration_seconds / 60);

  const lines: string[] = [
    `# ${meeting.title}`,
    "",
    `- **Date:** ${new Date(meeting.date).toLocaleDateString()}`,
    `- **Duration:** ${minutes} minutes`,
    `- **Participants:** ${participantsList}`,
    "",
    "---",
    "",
    "## Executive Summary Overview",
    "",
    meeting.summary?.overview_text || "No summary overview available.",
    "",
    "---",
    "",
    "## Key Discussion Topics",
    "",
  ];

  if (meeting.key_topics && meeting.key_topics.length > 0) {
    meeting.key_topics.forEach((topic, idx) => {
      lines.push(`${idx + 1}. **${topic.topic_text}**`);
    });
  } else {
    lines.push("_No key topics extracted._");
  }

  lines.push("", "---", "", "## Action Items Checklist", "");

  if (meeting.action_items && meeting.action_items.length > 0) {
    meeting.action_items.forEach((ai) => {
      const check = ai.is_completed ? "[x]" : "[ ]";
      const assignee = ai.assignee_name ? ` (Assignee: ${ai.assignee_name})` : "";
      lines.push(`- ${check} ${ai.text}${assignee}`);
    });
  } else {
    lines.push("_No action items recorded._");
  }

  lines.push("", "---", "", "## Full Transcript", "");

  segments.forEach((seg) => {
    lines.push(`**[${formatTimestamp(seg.start_time_seconds)}] ${seg.speaker_name}:** ${seg.text}`);
    lines.push("");
  });

  const content = lines.join("\n");
  const sanitizedTitle = meeting.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
  downloadFile(`${sanitizedTitle}_summary.md`, content, "text/markdown;charset=utf-8");
}
