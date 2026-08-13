import {
  User,
  Meeting,
  PaginatedMeetings,
  TranscriptSearchResponse,
  ActionItem,
  GlobalSearchResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function fetchJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // ── User ────────────────────────────────────────────────────────────
  async getCurrentUser(): Promise<User> {
    return fetchJson<User>("/me");
  },

  // ── Meetings ────────────────────────────────────────────────────────
  async getMeetings(params: {
    search?: string;
    participant?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedMeetings> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.participant) query.append("participant", params.participant);
    if (params.date_from) query.append("date_from", params.date_from);
    if (params.date_to) query.append("date_to", params.date_to);
    if (params.sort) query.append("sort", params.sort);
    if (params.page) query.append("page", params.page.toString());
    if (params.per_page) query.append("per_page", params.per_page.toString());

    const queryString = query.toString();
    return fetchJson<PaginatedMeetings>(
      `/meetings${queryString ? `?${queryString}` : ""}`
    );
  },

  async getMeeting(id: string): Promise<Meeting> {
    return fetchJson<Meeting>(`/meetings/${id}`);
  },

  async createMeeting(formData: FormData): Promise<Meeting> {
    return fetchJson<Meeting>("/meetings", {
      method: "POST",
      body: formData,
      // Note: do not set Content-Type header when sending FormData;
      // the browser needs to set it automatically to include the boundary.
    });
  },

  async updateMeeting(
    id: string,
    data: { title?: string; participant_names?: string[] }
  ): Promise<Meeting> {
    return fetchJson<Meeting>(`/meetings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  async deleteMeeting(id: string): Promise<void> {
    await fetchJson<void>(`/meetings/${id}`, {
      method: "DELETE",
    });
  },

  async getMeetingTranscript(
    id: string,
    query?: string
  ): Promise<TranscriptSearchResponse> {
    const path = `/meetings/${id}/transcript${
      query ? `?query=${encodeURIComponent(query)}` : ""
    }`;
    return fetchJson<TranscriptSearchResponse>(path);
  },

  async regenerateSummary(id: string): Promise<Meeting> {
    return fetchJson<Meeting>(`/meetings/${id}/regenerate-summary`, {
      method: "POST",
    });
  },

  // ── Action Items ────────────────────────────────────────────────────
  async createActionItem(
    meetingId: string,
    data: { text: string; assignee_name?: string | null }
  ): Promise<ActionItem> {
    return fetchJson<ActionItem>(`/meetings/${meetingId}/action-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  async updateActionItem(
    id: string,
    data: { text?: string; assignee_name?: string | null; is_completed?: boolean }
  ): Promise<ActionItem> {
    return fetchJson<ActionItem>(`/action-items/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  async deleteActionItem(id: string): Promise<void> {
    await fetchJson<void>(`/action-items/${id}`, {
      method: "DELETE",
    });
  },

  // ── Global Search ───────────────────────────────────────────────────
  async globalSearch(query: string): Promise<GlobalSearchResponse> {
    return fetchJson<GlobalSearchResponse>(
      `/search?query=${encodeURIComponent(query)}`
    );
  },
};
