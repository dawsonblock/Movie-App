import { describe, expect, it } from "vitest";
import { SaveHistoryBodySchema } from "./schema";

describe("SaveHistoryBodySchema boundary tests", () => {
  describe("currentTime validation", () => {
    it("should accept minimum valid currentTime (0)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 0,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid currentTime (86400)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 86400,
        duration: 86400,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject currentTime below minimum (-1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: -1,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject currentTime above maximum (86401)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 86401,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept typical currentTime values", () => {
      const typicalValues = [30, 120, 3600, 7200];
      
      typicalValues.forEach((currentTime) => {
        const result = SaveHistoryBodySchema.safeParse({
          event: "play",
          currentTime,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date: "2024-01-01",
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("duration validation", () => {
    it("should accept minimum valid duration (0)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 0,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid duration (86400)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 86400,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject duration below minimum (-1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: -1,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject duration above maximum (86401)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 86401,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept typical duration values", () => {
      const typicalDurations = [45, 90, 120, 3600, 7200];
      
      typicalDurations.forEach((duration) => {
        const result = SaveHistoryBodySchema.safeParse({
          event: "play",
          currentTime: 30,
          duration,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date: "2024-01-01",
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("season validation", () => {
    it("should accept minimum valid season (0)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 0,
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid season (999)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 999,
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject season below minimum (-1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: -1,
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject season above maximum (1000)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1000,
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer season", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1.5,
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept season when optional", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("episode validation", () => {
    it("should accept minimum valid episode (0)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: 0,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid episode (999)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: 999,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject episode below minimum (-1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: -1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject episode above maximum (1000)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: 1000,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer episode", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: 1.5,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept episode when optional", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("mediaId validation", () => {
    it("should accept numeric mediaId", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept string mediaId with valid format", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: "123",
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject string mediaId with non-numeric characters", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: "abc",
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative numeric mediaId", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: -123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero numeric mediaId", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 0,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("mediaDetails validation", () => {
    it("should accept minimum vote_average (0)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 0,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum vote_average (10)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 10,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject vote_average below minimum (-1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: -1,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject vote_average above maximum (11)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 11,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid date format", () => {
      const validDates = [
        "2024-01-01",
        "2024-12-31",
        "2020-02-29",
        "1999-12-31",
      ];
      
      validDates.forEach((release_date) => {
        const result = SaveHistoryBodySchema.safeParse({
          event: "play",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date,
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid date format", () => {
      const invalidDates = [
        "2024/01/01",    // Wrong separator
        "01-01-2024",    // Wrong order
        "2024-1-1",      // Single digits
        "invalid",       // Not a date
        "2024-01",       // Missing day
        "01-01",         // Missing year
      ];
      
      invalidDates.forEach((release_date) => {
        const result = SaveHistoryBodySchema.safeParse({
          event: "play",
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date,
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(false);
      });
    });

    it("should accept null backdrop_path and poster_path", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: null,
          poster_path: null,
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept missing backdrop_path and poster_path", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("event type validation", () => {
    it("should accept all valid event types", () => {
      const validEvents = ["play", "pause", "seeked", "ended", "timeupdate"];
      
      validEvents.forEach((event) => {
        const result = SaveHistoryBodySchema.safeParse({
          event,
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date: "2024-01-01",
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid event types", () => {
      const invalidEvents = ["playing", "stopped", "buffering", "invalid"];
      
      invalidEvents.forEach((event) => {
        const result = SaveHistoryBodySchema.safeParse({
          event,
          currentTime: 30,
          duration: 120,
          mediaId: 123,
          mediaType: "movie",
          mediaDetails: {
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date: "2024-01-01",
            title: "Test Movie",
            vote_average: 8.5,
          },
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("mediaType validation", () => {
    it("should accept movie mediaType", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept tv mediaType", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: 5,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid mediaType", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "invalid",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("completed validation", () => {
    it("should accept completed when true", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "ended",
        currentTime: 120,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        completed: true,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept completed when false", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        completed: false,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept when completed is not provided", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("title validation", () => {
    it("should accept minimum valid title length (1)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "A",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid title length (300)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "A".repeat(300),
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding maximum length (301)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "A".repeat(301),
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("release_date validation", () => {
    it("should accept valid date format", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept date at minimum year (1900)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "1900-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept date at maximum year (2100)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2100-12-31",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024/01/01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject date with invalid year (1899)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "1899-12-31",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject date with invalid year (2101)", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2101-01-01",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject nonsense date like 9999-99-99", () => {
      const result = SaveHistoryBodySchema.safeParse({
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "9999-99-99",
          title: "Test Movie",
          vote_average: 8.5,
        },
      });
      expect(result.success).toBe(false);
    });
  });
});