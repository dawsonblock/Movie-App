import { z } from "zod";
import { syncHistory } from "@/actions/histories";
import { ContentType } from "@/types";
import { diff } from "@/utils/helpers";
import { useDocumentVisibility } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { syncLocalHistory } from "@/utils/localStorage/history";
import { addToast } from "@heroui/react";

// ==================== Schema Definitions ====================

export const PlayerEventTypeSchema = z.enum([
  "play",
  "pause",
  "seeked",
  "ended",
  "timeupdate",
]);
export type PlayerEventType = z.infer<typeof PlayerEventTypeSchema>;

const VidlinkEventSchema = z.object({
  event: PlayerEventTypeSchema,
  currentTime: z.number().min(0).max(86400),
  duration: z.number().min(0).max(86400),
  mtmdbId: z.number(),
  mediaType: z.enum(["movie", "tv"]),
  season: z.number().int().min(0).max(999).optional(),
  episode: z.number().int().min(0).max(999).optional(),
});

const VidkingEventSchema = z.object({
  event: PlayerEventTypeSchema,
  currentTime: z.number().min(0).max(86400),
  duration: z.number().min(0).max(86400),
  id: z.union([z.string(), z.number()]),
  mediaType: z.enum(["movie", "tv"]),
  season: z.number().int().min(0).max(999).optional(),
  episode: z.number().int().min(0).max(999).optional(),
  progress: z.number().optional(),
});

const VidlinkMessageSchema = z.object({
  type: z.literal("PLAYER_EVENT"),
  data: VidlinkEventSchema,
});

const VidkingMessageSchema = z.object({
  type: z.literal("PLAYER_EVENT"),
  data: VidkingEventSchema,
});

// ==================== Type Definitions ====================

export interface UnifiedPlayerEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mediaId: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export interface PlayerAdapter {
  origin: `https://${string}`;
  parse: (raw: unknown) => UnifiedPlayerEventData | null;
}

export type AdapterMap = Record<string, PlayerAdapter>;

// ==================== Player Adapters ====================

export const playerAdapters = {
  vidlink: {
    origin: "https://vidlink.pro",
    parse: (raw: unknown) => {
      const result = VidlinkMessageSchema.safeParse(raw);
      if (!result.success) return null;
      const d = result.data.data;
      return {
        event: d.event,
        currentTime: d.currentTime,
        duration: d.duration,
        mediaId: d.mtmdbId,
        mediaType: d.mediaType,
        season: d.season,
        episode: d.episode,
      };
    },
  } satisfies PlayerAdapter,

  vidking: {
    origin: "https://www.vidking.net",
    parse: (raw: unknown) => {
      const result = VidkingMessageSchema.safeParse(raw);
      if (!result.success) return null;
      const d = result.data.data;
      return {
        event: d.event,
        currentTime: d.currentTime,
        duration: d.duration,
        mediaId: d.id,
        mediaType: d.mediaType,
        season: d.season,
        episode: d.episode,
        progress: d.progress,
      };
    },
  } satisfies PlayerAdapter,
} as const satisfies AdapterMap;

// ==================== Hook Options ====================

export interface UsePlayerEventsOptions {
  media?: {
    id: number;
    title: string;
    backdrop_path: string;
    poster_path?: string | null;
    release_date: string;
    vote_average: number;
    adult: boolean;
  };
  metadata?: { season?: number; episode?: number };
  saveHistory?: boolean;
  onPlay?: (data: UnifiedPlayerEventData) => void;
  onPause?: (data: UnifiedPlayerEventData) => void;
  onSeeked?: (data: UnifiedPlayerEventData) => void;
  onEnded?: (data: UnifiedPlayerEventData) => void;
  onTimeUpdate?: (data: UnifiedPlayerEventData) => void;
}

// ==================== Helper Functions ====================

/**
 * Parse message data from a player iframe
 */
function parsePlayerMessage(event: MessageEvent): UnifiedPlayerEventData | null {
  const adapter = Object.values(playerAdapters).find((a) => a.origin === event.origin);
  if (!adapter) return null;

  let rawData: unknown;
  try {
    rawData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch (err) {
    console.warn("Invalid JSON from player:", err);
    return null;
  }

  return adapter.parse(rawData);
}

/**
 * Sync player event data to storage (Supabase with localStorage fallback)
 */
async function syncToStorage(
  data: UnifiedPlayerEventData,
  options: UsePlayerEventsOptions,
  lastCurrentTimeRef: React.MutableRefObject<number>,
  completed?: boolean,
): Promise<void> {
  if (!options.saveHistory || !options.media) return;
  if (diff(data.currentTime, lastCurrentTimeRef.current) <= 5) return;

  const payload: UnifiedPlayerEventData = {
    ...data,
    season: data.season ?? options.metadata?.season ?? 0,
    episode: data.episode ?? options.metadata?.episode ?? 0,
  };

  // Try to sync to Supabase first
  try {
    const result = await syncHistory(payload, completed);
    if (result.success) {
      lastCurrentTimeRef.current = data.currentTime;
    } else {
      console.error("Save history failed:", result.message);
      // Show toast notification for persistent failures
      if (result.message?.includes("logged in")) {
        addToast({
          title: "Sign in to save progress",
          description: "Your viewing progress will be saved locally",
          color: "warning",
        });
      }
    }
  } catch (error) {
    console.error("Server sync failed, falling back to localStorage:", error);
    // Fallback to localStorage if server sync fails
    // This handles cases where user is not authenticated or server is unavailable
    const localResult = syncLocalHistory(
      payload,
      {
        adult: options.media.adult,
        backdrop_path: options.media.backdrop_path,
        poster_path: options.media.poster_path,
        release_date: options.media.release_date,
        title: options.media.title,
        vote_average: options.media.vote_average,
      },
      completed,
    );
    if (localResult.success) lastCurrentTimeRef.current = data.currentTime;
  }
}

// ==================== Main Hook ====================

export function usePlayerEvents(options: UsePlayerEventsOptions = {}) {
  const documentState = useDocumentVisibility();

  // State for player status
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastEvent, setLastEvent] = useState<PlayerEventType | null>(null);

  // Refs to avoid stale closures
  const lastCurrentTimeRef = useRef(0);
  const eventDataRef = useRef<UnifiedPlayerEventData | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Sync history when document becomes hidden (user leaves tab)
  useEffect(() => {
    if (!optionsRef.current.saveHistory || !optionsRef.current.media) return;
    if (documentState === "visible") return;
    if (!eventDataRef.current) return;
    syncToStorage(eventDataRef.current, optionsRef.current, lastCurrentTimeRef);
  }, [documentState]);

  // Handle player events from iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const parsed = parsePlayerMessage(event);
      if (!parsed) return;

      eventDataRef.current = parsed;
      setLastEvent(parsed.event);

      const opts = optionsRef.current;
      switch (parsed.event) {
        case "play":
          setIsPlaying(true);
          opts.onPlay?.(parsed);
          break;
        case "pause":
          setIsPlaying(false);
          opts.onPause?.(parsed);
          break;
        case "ended":
          setIsPlaying(false);
          syncToStorage(parsed, opts, lastCurrentTimeRef, true).catch(console.error);
          opts.onEnded?.(parsed);
          break;
        case "seeked":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          opts.onSeeked?.(parsed);
          break;
        case "timeupdate":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          opts.onTimeUpdate?.(parsed);
          break;
      }
    };

    // Sync history before page unload
    const handleBeforeUnload = () => {
      if (eventDataRef.current) {
        syncToStorage(
          eventDataRef.current,
          optionsRef.current,
          lastCurrentTimeRef,
          eventDataRef.current.event === "ended",
        ).catch(console.error);
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Cleanup: sync history on unmount
      if (eventDataRef.current) {
        syncToStorage(
          eventDataRef.current,
          optionsRef.current,
          lastCurrentTimeRef,
          eventDataRef.current.event === "ended",
        ).catch(console.error);
      }
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return { isPlaying, currentTime, duration, lastEvent };
}