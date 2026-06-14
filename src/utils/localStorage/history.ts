import { HISTORY_STORAGE_KEY } from "@/utils/constants";
import { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";

export interface LocalHistoryItem {
  media_id: number;
  type: "movie" | "tv";
  season: number;
  episode: number;
  duration: number;
  last_position: number;
  completed: boolean;
  adult: boolean;
  backdrop_path: string;
  poster_path?: string | null;
  release_date: string;
  title: string;
  vote_average: number;
  updated_at: string;
}

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

function getHistory(): LocalHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: LocalHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function syncLocalHistory(
  data: UnifiedPlayerEventData,
  mediaDetails: {
    adult: boolean;
    backdrop_path: string;
    poster_path?: string | null;
    release_date: string;
    title: string;
    vote_average: number;
  },
  completed?: boolean,
): ActionResponse {
  try {
    const history = getHistory();
    const key = `${data.mediaId}-${data.mediaType}-${data.season || 0}-${data.episode || 0}`;
    const existingIndex = history.findIndex(
      (h) =>
        h.media_id === Number(data.mediaId) &&
        h.type === data.mediaType &&
        h.season === (data.season || 0) &&
        h.episode === (data.episode || 0),
    );

    const item: LocalHistoryItem = {
      media_id: Number(data.mediaId),
      type: data.mediaType,
      season: data.season || 0,
      episode: data.episode || 0,
      duration: data.duration,
      last_position: data.currentTime,
      completed: completed || false,
      adult: mediaDetails.adult,
      backdrop_path: mediaDetails.backdrop_path,
      poster_path: mediaDetails.poster_path || null,
      release_date: mediaDetails.release_date,
      title: mediaDetails.title,
      vote_average: mediaDetails.vote_average,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      history[existingIndex] = item;
    } else {
      history.push(item);
    }

    saveHistory(history);
    return { success: true, message: "History saved" };
  } catch {
    return { success: false, message: "Failed to save history" };
  }
}

export function getUserHistories(limit: number = 20): ActionResponse<LocalHistoryItem[]> {
  try {
    const history = getHistory()
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);
    return { success: true, data: history };
  } catch {
    return { success: false, message: "Failed to fetch history" };
  }
}

export function getMovieLastPosition(id: number): number {
  try {
    const history = getHistory();
    const item = history.find((h) => h.media_id === id && h.type === "movie");
    return item?.last_position || 0;
  } catch {
    return 0;
  }
}

export function getTvShowLastPosition(id: number, season: number, episode: number): number {
  try {
    const history = getHistory();
    const item = history.find(
      (h) => h.media_id === id && h.type === "tv" && h.season === season && h.episode === episode,
    );
    return item?.last_position || 0;
  } catch {
    return 0;
  }
}
