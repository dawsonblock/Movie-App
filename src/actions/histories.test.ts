import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncHistory, getUserHistories, getMovieLastPosition, getTvShowLastPosition } from "./histories";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock TMDB API
vi.mock("@/api/tmdb", () => ({
  tmdb: {
    movies: {
      details: vi.fn(),
    },
    tvShows: {
      details: vi.fn(),
    },
  },
}));

vi.mock("@/utils/movies", () => ({
  mutateMovieTitle: vi.fn((movie) => movie.title),
  mutateTvShowTitle: vi.fn((tv) => tv.name),
}));

describe("Histories Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncHistory", () => {
    it("should sync history successfully for movie", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { tmdb } = await import("@/api/tmdb");
      (tmdb.movies.details as any).mockResolvedValue({
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        title: "Test Movie",
        vote_average: 8.5,
      });

      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });
      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await syncHistory({
        event: "timeupdate",
        currentTime: 120,
        duration: 7200,
        mediaId: "123",
        mediaType: "movie",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("History saved");
    });

    it("should sync history successfully for TV show", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { tmdb } = await import("@/api/tmdb");
      (tmdb.tvShows.details as any).mockResolvedValue({
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        first_air_date: "2024-01-01",
        name: "Test TV Show",
        vote_average: 8.5,
      });

      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });
      const mockUpsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await syncHistory({
        event: "timeupdate",
        currentTime: 120,
        duration: 2400,
        mediaId: "456",
        mediaType: "tv",
        season: 1,
        episode: 1,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("History saved");
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await syncHistory({
        event: "timeupdate",
        currentTime: 120,
        duration: 7200,
        mediaId: "123",
        mediaType: "movie",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("You must be logged in to save history");
    });

    it("should return error for TV show without season/episode", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await syncHistory({
        event: "timeupdate",
        currentTime: 120,
        duration: 2400,
        mediaId: "456",
        mediaType: "tv",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Missing season or episode");
    });
  });

  describe("getUserHistories", () => {
    it("should return user's histories", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 1, title: "Test Movie" }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        limit: mockLimit,
      });

      const result = await getUserHistories(20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getUserHistories(20);

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not authenticated");
    });
  });

  describe("getMovieLastPosition", () => {
    it("should return last position for movie", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockEq3 = vi.fn().mockResolvedValue({
        data: [{ last_position: 120 }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      // Chain the eq calls
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        eq: mockEq3,
      });

      const result = await getMovieLastPosition(123);

      expect(result).toBe(120);
    });

    it("should return undefined if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getMovieLastPosition(123);

      expect(result).toBeUndefined();
    });

    it("should return undefined if no history found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockEq3 = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        eq: mockEq3,
      });

      const result = await getMovieLastPosition(123);

      expect(result).toBeUndefined();
    });
  });

  describe("getTvShowLastPosition", () => {
    it("should return last position for TV show episode", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockEq3 = vi.fn().mockReturnThis();
      const mockEq4 = vi.fn().mockReturnThis();
      const mockEq5 = vi.fn().mockResolvedValue({
        data: [{ last_position: 240 }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        eq: mockEq3,
      });
      mockEq3.mockReturnValue({
        eq: mockEq4,
      });
      mockEq4.mockReturnValue({
        eq: mockEq5,
      });

      const result = await getTvShowLastPosition(456, 1, 1);

      expect(result).toBe(240);
    });

    it("should return undefined if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getTvShowLastPosition(456, 1, 1);

      expect(result).toBeUndefined();
    });
  });
});