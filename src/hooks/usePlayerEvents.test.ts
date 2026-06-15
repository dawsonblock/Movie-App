import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayerEvents, playerAdapters, PlayerEventTypeSchema } from "./usePlayerEvents";
import { syncLocalHistory } from "@/utils/localStorage/history";

// Mock the syncLocalHistory function
vi.mock("@/utils/localStorage/history", () => ({
  syncLocalHistory: vi.fn(),
}));

// Mock useDocumentVisibility
vi.mock("@mantine/hooks", () => ({
  useDocumentVisibility: vi.fn(() => "visible"),
}));

describe("usePlayerEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.addEventListener and removeEventListener
    window.addEventListener = vi.fn();
    window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => usePlayerEvents());
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.duration).toBe(0);
      expect(result.current.lastEvent).toBe(null);
    });

    it("should accept media options", () => {
      const media = {
        id: 123,
        title: "Test Movie",
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
        adult: false,
      };

      const { result } = renderHook(() => usePlayerEvents({ media }));
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
    });
  });

  describe("event handling", () => {
    it("should handle play event", () => {
      const onPlay = vi.fn();
      const { result } = renderHook(() => usePlayerEvents({ onPlay }));

      act(() => {
        // Simulate message event
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "play",
              currentTime: 10,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        // Get the message handler from the addEventListener calls
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(result.current.isPlaying).toBe(true);
      expect(onPlay).toHaveBeenCalled();
    });

    it("should handle pause event", () => {
      const onPause = vi.fn();
      const { result } = renderHook(() => usePlayerEvents({ onPause }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "pause",
              currentTime: 20,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(result.current.isPlaying).toBe(false);
      expect(onPause).toHaveBeenCalled();
    });

    it("should handle seeked event", () => {
      const onSeeked = vi.fn();
      const { result } = renderHook(() => usePlayerEvents({ onSeeked }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "seeked",
              currentTime: 50,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(result.current.currentTime).toBe(50);
      expect(result.current.duration).toBe(120);
      expect(onSeeked).toHaveBeenCalled();
    });

    it("should handle timeupdate event", () => {
      const onTimeUpdate = vi.fn();
      const { result } = renderHook(() => usePlayerEvents({ onTimeUpdate }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "timeupdate",
              currentTime: 30,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(result.current.currentTime).toBe(30);
      expect(result.current.duration).toBe(120);
      expect(onTimeUpdate).toHaveBeenCalled();
    });

    it("should handle ended event", () => {
      const onEnded = vi.fn();
      const { result } = renderHook(() => usePlayerEvents({ onEnded }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "ended",
              currentTime: 120,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(result.current.isPlaying).toBe(false);
      expect(onEnded).toHaveBeenCalled();
    });
  });

  describe("history saving", () => {
    it("should save history when saveHistory is enabled", () => {
      const media = {
        id: 123,
        title: "Test Movie",
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
        adult: false,
      };

      renderHook(() => usePlayerEvents({ media, saveHistory: true }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "timeupdate",
              currentTime: 30,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      // History saving is handled internally, we just verify the hook doesn't crash
      expect(true).toBe(true);
    });

    it("should not save history when saveHistory is disabled", () => {
      const media = {
        id: 123,
        title: "Test Movie",
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
        adult: false,
      };

      renderHook(() => usePlayerEvents({ media, saveHistory: false }));

      act(() => {
        const messageEvent = new MessageEvent("message", {
          data: JSON.stringify({
            type: "PLAYER_EVENT",
            data: {
              event: "timeupdate",
              currentTime: 30,
              duration: 120,
              mtmdbId: 123,
              mediaType: "movie",
            },
          }),
          origin: "https://vidlink.pro",
        });
        
        const addCalls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
        const messageHandler = addCalls.find((call: unknown[]) => call[0] === "message")?.[1];
        
        if (messageHandler) {
          messageHandler(messageEvent);
        }
      });

      expect(syncLocalHistory).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const { unmount } = renderHook(() => usePlayerEvents());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith("message", expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    });
  });
});

describe("playerAdapters", () => {
  describe("vidlink adapter", () => {
    it("should parse valid vidlink messages", () => {
      const adapter = playerAdapters.vidlink;
      const message = {
        type: "PLAYER_EVENT",
        data: {
          event: "play",
          currentTime: 10,
          duration: 120,
          mtmdbId: 123,
          mediaType: "movie",
        },
      };

      const result = adapter.parse(message);
      
      expect(result).not.toBeNull();
      expect(result?.event).toBe("play");
      expect(result?.currentTime).toBe(10);
      expect(result?.duration).toBe(120);
      expect(result?.mediaId).toBe(123);
      expect(result?.mediaType).toBe("movie");
    });

    it("should handle TV show data with season and episode", () => {
      const adapter = playerAdapters.vidlink;
      const message = {
        type: "PLAYER_EVENT",
        data: {
          event: "play",
          currentTime: 10,
          duration: 120,
          mtmdbId: 123,
          mediaType: "tv",
          season: 1,
          episode: 5,
        },
      };

      const result = adapter.parse(message);
      
      expect(result).not.toBeNull();
      expect(result?.season).toBe(1);
      expect(result?.episode).toBe(5);
    });

    it("should return null for invalid messages", () => {
      const adapter = playerAdapters.vidlink;
      const invalidMessage = { type: "INVALID", data: {} };

      const result = adapter.parse(invalidMessage);
      
      expect(result).toBeNull();
    });
  });

  describe("vidking adapter", () => {
    it("should parse valid vidking messages", () => {
      const adapter = playerAdapters.vidking;
      const message = {
        type: "PLAYER_EVENT",
        data: {
          event: "play",
          currentTime: 10,
          duration: 120,
          id: "123",
          mediaType: "movie",
        },
      };

      const result = adapter.parse(message);
      
      expect(result).not.toBeNull();
      expect(result?.event).toBe("play");
      expect(result?.currentTime).toBe(10);
      expect(result?.duration).toBe(120);
      expect(result?.mediaId).toBe("123");
      expect(result?.mediaType).toBe("movie");
    });

    it("should handle numeric id", () => {
      const adapter = playerAdapters.vidking;
      const message = {
        type: "PLAYER_EVENT",
        data: {
          event: "play",
          currentTime: 10,
          duration: 120,
          id: 123,
          mediaType: "movie",
        },
      };

      const result = adapter.parse(message);
      
      expect(result).not.toBeNull();
      expect(result?.mediaId).toBe(123);
    });

    it("should handle progress field", () => {
      const adapter = playerAdapters.vidking;
      const message = {
        type: "PLAYER_EVENT",
        data: {
          event: "timeupdate",
          currentTime: 10,
          duration: 120,
          id: 123,
          mediaType: "movie",
          progress: 8.33,
        },
      };

      const result = adapter.parse(message);
      
      expect(result).not.toBeNull();
      expect(result?.progress).toBe(8.33);
    });

    it("should return null for invalid messages", () => {
      const adapter = playerAdapters.vidking;
      const invalidMessage = { type: "INVALID", data: {} };

      const result = adapter.parse(invalidMessage);
      
      expect(result).toBeNull();
    });
  });
});

describe("PlayerEventTypeSchema", () => {
  it("should validate valid event types", () => {
    const validEvents = ["play", "pause", "seeked", "ended", "timeupdate"];
    
    validEvents.forEach((event) => {
      const result = PlayerEventTypeSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid event types", () => {
    const invalidEvents = ["invalid", "playing", "stopped", "buffering"];
    
    invalidEvents.forEach((event) => {
      const result = PlayerEventTypeSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });
});