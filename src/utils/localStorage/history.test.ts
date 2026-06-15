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
    it("should return failure when media details are null", () => {
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

      // Zod validation rejects null media details
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Invalid media details/);
    });

    it("should return failure when media type is invalid", () => {
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

      // Zod enum validation rejects unknown media types
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Invalid data/);
    });

    it("should return failure when currentTime is negative", () => {
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

      // Zod .min(0) rejects negative currentTime
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Invalid data/);
    });

    it("should succeed when duration is zero", () => {
      const result = syncLocalHistory(
        {
          event: "timeupdate",
          currentTime: 0,
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

      // Zero duration is permitted by Zod .min(0)
      expect(result.success).toBe(true);
    });
  });

  describe("data corruption handling", () => {
    it("should succeed and overwrite corrupted localStorage data", () => {
      global.localStorage.getItem = vi.fn(() => "invalid json data");

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

      // getHistory() catches JSON.parse error and returns [], then saves new item
      expect(result.success).toBe(true);
      expect(result.message).toBe("History saved");
    });

    it("should return failure when mediaId is null", () => {
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

      // Zod .int().positive() rejects null (coerced to 0, which fails .positive())
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Invalid data/);
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