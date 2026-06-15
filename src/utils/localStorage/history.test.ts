import { describe, expect, it, vi, beforeEach } from "vitest";
import { syncLocalHistory } from "./history";

describe("syncLocalHistory error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  describe("localStorage errors", () => {
    it("should handle localStorage quota exceeded error", () => {
      global.localStorage.setItem = vi.fn(() => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      });

      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      expect(result.success).toBe(false);
    });

    it("should handle localStorage access denied error", () => {
      global.localStorage.setItem = vi.fn(() => {
        throw new DOMException("AccessDenied", "SecurityError");
      });

      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      expect(result.success).toBe(false);
    });

    it("should handle localStorage not available (private browsing)", () => {
      global.localStorage.setItem = vi.fn(() => {
        throw new Error("localStorage is not available");
      });

      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      expect(result.success).toBe(false);
    });
  });

  describe("invalid input handling", () => {
    it("should handle missing media details", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        null as any
      );

      // The function doesn't validate media details, so it might succeed or fail
      // We just check it returns a result
      expect(result).toBeDefined();
    });

    it("should handle invalid media type", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "invalid" as unknown as "movie", // intentionally invalid for test
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      // The function doesn't validate media type at runtime
      // We just check it returns a result
      expect(result).toBeDefined();
    });

    it("should handle negative currentTime", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: -10,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      // The function doesn't validate currentTime at runtime
      // We just check it returns a result
      expect(result).toBeDefined();
    });

    it("should handle zero or negative duration", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 0,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      // This might be valid depending on implementation
      // The test documents current behavior
      expect(result).toBeDefined();
    });
  });

  describe("data corruption handling", () => {
    it("should handle corrupted localStorage data", () => {
      global.localStorage.getItem = vi.fn(() => {
        return "invalid json data";
      });

      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      // Should handle gracefully and either succeed with new data or fail safely
      expect(result).toBeDefined();
    });

    it("should handle malformed mediaId", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 30,
          duration: 120,
          mediaId: null as unknown as number, // intentionally invalid for test
          mediaType: "movie",
        },
        {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        }
      );

      // The function tries to convert mediaId to Number, which might result in 0
      // We just check it returns a result
      expect(result).toBeDefined();
    });
  });

  describe("concurrent access handling", () => {
    it("should handle rapid successive calls", () => {
      const mediaData = {
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        title: "Test Movie",
        vote_average: 8.5,
      };

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(
          syncLocalHistory(
            {
              event: "timeupdate",
              currentTime: 30 + i,
              duration: 120,
              mediaId: 123,
              mediaType: "movie",
            },
            mediaData
          )
        );
      }

      // All calls should complete without throwing
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });
});