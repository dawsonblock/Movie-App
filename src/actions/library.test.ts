import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addToWatchlist, removeFromWatchlist, checkInWatchlist, getWatchlist, removeAllWatchlist } from "./library";

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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Library Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToWatchlist", () => {
    it("should add item to watchlist successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 1, title: "Test Movie" },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await addToWatchlist({
        id: 1,
        type: "movie",
        title: "Test Movie",
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Added to watchlist successfully");
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await addToWatchlist({
        id: 1,
        type: "movie",
        title: "Test Movie",
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be logged in to add items to watchlist");
    });

    it("should handle duplicate item error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "Duplicate key" },
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await addToWatchlist({
        id: 1,
        type: "movie",
        title: "Test Movie",
        adult: false,
        backdrop_path: "/path.jpg",
        poster_path: "/poster.jpg",
        release_date: "2024-01-01",
        vote_average: 8.5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("This item is already in your watchlist");
    });
  });

  describe("removeFromWatchlist", () => {
    it("should remove item from watchlist successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockEq3 = vi.fn().mockResolvedValue({ error: null });
      const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      });

      const result = await removeFromWatchlist(1, "movie");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Removed from watchlist successfully");
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await removeFromWatchlist(1, "movie");

      expect(result.success).toBe(false);
      expect(result.error).toBe("You must be logged in to remove items from watchlist");
    });
  });

  describe("checkInWatchlist", () => {
    it("should return true if item is in watchlist", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await checkInWatchlist(1, "movie");

      expect(result.success).toBe(true);
      expect(result.isInWatchlist).toBe(true);
    });

    it("should return false if item is not in watchlist", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await checkInWatchlist(1, "movie");

      expect(result.success).toBe(true);
      expect(result.isInWatchlist).toBe(false);
    });
  });

  describe("getWatchlist", () => {
    it("should return user's watchlist", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: [{ id: 1, title: "Test Movie" }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange,
      });

      const result = await getWatchlist("all", 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getWatchlist("all", 1, 20);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not authenticated");
    });
  });

  describe("removeAllWatchlist", () => {
    it("should remove all items of specified type", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      });

      const result = await removeAllWatchlist("movie");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Removed items from watchlist successfully");
    });
  });
});