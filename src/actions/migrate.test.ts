import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  migrateWatchlistFromLocalStorage,
  migrateHistoryFromLocalStorage,
  hasMigratedData,
} from "./migrate";

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

describe("Migration Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("migrateWatchlistFromLocalStorage", () => {
    it("should migrate watchlist data successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const localStorageData = JSON.stringify([
        {
          id: 1,
          type: "movie",
          title: "Test Movie",
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          vote_average: 8.5,
          created_at: "2024-01-01T00:00:00Z",
        },
      ]);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await migrateWatchlistFromLocalStorage(localStorageData);

      expect(result.success).toBe(true);
      expect(result.watchlistMigrated).toBe(1);
      expect(result.message).toContain("Successfully migrated");
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await migrateWatchlistFromLocalStorage("[]");

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not authenticated");
    });

    it("should handle empty localStorage data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await migrateWatchlistFromLocalStorage("[]");

      expect(result.success).toBe(true);
      expect(result.watchlistMigrated).toBe(0);
      expect(result.message).toBe("No watchlist data to migrate");
    });

    it("should handle invalid JSON data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await migrateWatchlistFromLocalStorage("invalid json");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid localStorage data format");
    });
  });

  describe("migrateHistoryFromLocalStorage", () => {
    it("should migrate history data successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const localStorageData = JSON.stringify([
        {
          media_id: 1,
          type: "movie",
          season: 0,
          episode: 0,
          duration: 7200,
          last_position: 120,
          completed: false,
          adult: false,
          backdrop_path: "/path.jpg",
          poster_path: "/poster.jpg",
          release_date: "2024-01-01",
          title: "Test Movie",
          vote_average: 8.5,
          updated_at: "2024-01-01T00:00:00Z",
        },
      ]);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await migrateHistoryFromLocalStorage(localStorageData);

      expect(result.success).toBe(true);
      expect(result.historyMigrated).toBe(1);
      expect(result.message).toContain("Successfully migrated");
    });

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await migrateHistoryFromLocalStorage("[]");

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not authenticated");
    });

    it("should handle empty localStorage data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await migrateHistoryFromLocalStorage("[]");

      expect(result.success).toBe(true);
      expect(result.historyMigrated).toBe(0);
      expect(result.message).toBe("No history data to migrate");
    });
  });

  describe("hasMigratedData", () => {
    it("should return true if user has watchlist data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await hasMigratedData();

      expect(result).toBe(true);
    });

    it("should return true if user has history data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // First call (watchlist) returns empty
      const mockSelect1 = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockLimit1 = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      // Second call (history) returns data
      const mockSelect2 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockLimit2 = vi.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect1,
          eq: mockEq1,
          limit: mockLimit1,
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          eq: mockEq2,
          limit: mockLimit2,
        });

      const result = await hasMigratedData();

      expect(result).toBe(true);
    });

    it("should return false if user has no data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        limit: mockLimit,
      });

      const result = await hasMigratedData();

      expect(result).toBe(false);
    });

    it("should return false if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await hasMigratedData();

      expect(result).toBe(false);
    });
  });
});