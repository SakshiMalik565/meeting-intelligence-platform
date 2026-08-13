export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
}

export interface TranscriptMatch {
  start_char: number;
  end_char: number;
}

export interface TranscriptSegment {
  id: string;
  speaker_name: string;
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
  order_index: number;
  matches?: TranscriptMatch[];
}

export interface TranscriptSearchResponse {
  segments: TranscriptSegment[];
  match_count: number;
}

export interface Summary {
  id: string;
  overview_text: string;
  generated_at: string; // ISO datetime
}

export interface KeyTopic {
  id: string;
  topic_text: string;
  order_index: number;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  text: string;
  assignee_name: string | null;
  is_completed: boolean;
  created_at: string; // ISO datetime
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO datetime
  duration_seconds: number;
  host_user_id: string;
  media_url: string | null;
  participants: Participant[];
  transcript_segments?: TranscriptSegment[];
  summary?: Summary | null;
  key_topics?: KeyTopic[];
  action_items?: ActionItem[];
  created_at: string;
  updated_at?: string;
}

export interface PaginatedMeetings {
  items: Meeting[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SearchResult {
  meeting_id: string;
  title: string;
  date: string;
  match_type: "title" | "transcript";
  snippet: string | null;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}
