import { syncLocalHistory } from "@/utils/localStorage/history";
import { ContentType } from "@/types";
import { diff } from "@/utils/helpers";
import { useDocumentVisibility } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";

export type PlayerEventType = "play" | "pause" | "seeked" | "ended" | "timeupdate";

export interface BasePlayerEventEnvelope<T> {
  type: "PLAYER_EVENT" | "MEDIA_DATA";
  data: T;
}

export interface VidlinkEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mtmdbId: number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
}

export type VidlinkPlayerMessage = BasePlayerEventEnvelope<VidlinkEventData>;

export interface VidkingEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  id: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export type VidkingPlayerMessage = BasePlayerEventEnvelope<VidkingEventData>;

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

export interface PlayerAdapter<RawMessage extends BasePlayerEventEnvelope<any>> {
  origin: `https://${string}`;
  parse: (raw: RawMessage) => UnifiedPlayerEventData | null;
}

export type AdapterMap = Record<string, PlayerAdapter<any>>;

export const playerAdapters = {
  vidlink: {
    origin: "https://vidlink.pro",
    parse: (raw) => {
      if (raw.type !== "PLAYER_EVENT") return null;
      const d = raw.data;
      return {
        ...d,
        mediaId: d.mtmdbId,
      };
    },
  } satisfies PlayerAdapter<VidlinkPlayerMessage>,

  vidking: {
    origin: "https://www.vidking.net",
    parse: (raw) => {
      if (raw.type !== "PLAYER_EVENT") return null;
      const d = raw.data;
      return {
        ...d,
        mediaId: d.id,
      };
    },
  } satisfies PlayerAdapter<VidkingPlayerMessage>,
} as const satisfies AdapterMap;

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

export function usePlayerEvents(options: UsePlayerEventsOptions = {}) {
  const documentState = useDocumentVisibility();
  const { media, metadata, saveHistory, onPlay, onPause, onSeeked, onEnded, onTimeUpdate } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastEvent, setLastEvent] = useState<PlayerEventType | null>(null);
  const lastCurrentTimeRef = useRef(0);

  const eventDataRef = useRef<UnifiedPlayerEventData | null>(null);

  // Use refs to avoid stale closures in the message handler
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const syncToStorage = (data: UnifiedPlayerEventData, completed?: boolean) => {
    const opts = optionsRef.current;
    if (!opts.saveHistory || !opts.media) return;
    if (diff(data.currentTime, lastCurrentTimeRef.current) <= 5) return;

    const payload: UnifiedPlayerEventData = {
      ...data,
      season: data.season || opts.metadata?.season || 0,
      episode: data.episode || opts.metadata?.episode || 0,
    };

    const result = syncLocalHistory(
      payload,
      {
        adult: opts.media.adult,
        backdrop_path: opts.media.backdrop_path,
        poster_path: opts.media.poster_path,
        release_date: opts.media.release_date,
        title: opts.media.title,
        vote_average: opts.media.vote_average,
      },
      completed,
    );
    if (result.success) lastCurrentTimeRef.current = data.currentTime;
    else console.error("Save history failed:", result.message);
  };

  useEffect(() => {
    if (!optionsRef.current.saveHistory || !optionsRef.current.media) return;
    if (documentState === "visible") return;
    if (!eventDataRef.current) return;
    syncToStorage(eventDataRef.current);
  }, [documentState]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const opts = optionsRef.current;
      if (!opts.saveHistory || !opts.media || !eventDataRef.current) return;
      syncLocalHistory(
        eventDataRef.current,
        {
          adult: opts.media.adult,
          backdrop_path: opts.media.backdrop_path,
          poster_path: opts.media.poster_path,
          release_date: opts.media.release_date,
          title: opts.media.title,
          vote_average: opts.media.vote_average,
        },
        eventDataRef.current.event === "ended",
      );
    };

    const handleMessage = (event: MessageEvent) => {
      const adapter = Object.values(playerAdapters).find((a) => a.origin === event.origin);
      if (!adapter) return;

      let rawData: any;
      try {
        rawData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch (err) {
        console.warn("Invalid JSON from player:", err);
        return;
      }

      const parsed = adapter.parse(rawData);
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
          syncToStorage(parsed, true);
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

    window.addEventListener("message", handleMessage);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (eventDataRef.current) handleBeforeUnload();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return { isPlaying, currentTime, duration, lastEvent };
}
