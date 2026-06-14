import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("/api/player/save-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST endpoint", () => {
    it("should return 400 for invalid JSON", async () => {
      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid JSON body");
    });

    it("should return 422 for invalid request body", async () => {
      const invalidBody = {
        event: "invalid_event",
        currentTime: "not a number",
        duration: "not a number",
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation failed");
    });

    it("should return 422 for out-of-bounds currentTime", async () => {
      const invalidBody = {
        event: "play",
        currentTime: 100000, // > 86400
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
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for out-of-bounds duration", async () => {
      const invalidBody = {
        event: "play",
        currentTime: 30,
        duration: -10, // < 0
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
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for invalid season number", async () => {
      const invalidBody = {
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1000, // > 999
        episode: 1,
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for invalid episode number", async () => {
      const invalidBody = {
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "tv",
        season: 1,
        episode: -5, // < 0
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Show",
          vote_average: 8.5,
        },
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for invalid date format", async () => {
      const invalidBody = {
        event: "play",
        currentTime: 30,
        duration: 120,
        mediaId: 123,
        mediaType: "movie",
        mediaDetails: {
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024/01/01", // Invalid format
          title: "Test Movie",
          vote_average: 8.5,
        },
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should return 422 for invalid vote_average", async () => {
      const invalidBody = {
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
          vote_average: 15, // > 10
        },
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(invalidBody),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it("should handle valid request structure", async () => {
      const validBody = {
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
      };

      const request = new Request("http://localhost/api/player/save-history", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "Content-Type": "application/json" },
      });

      // The route will handle authentication internally
      // We just verify it doesn't crash on valid structure
      const response = await POST(request);
      expect(response).toBeDefined();
    });
  });
});