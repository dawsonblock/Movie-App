"use server";

import { createClient } from "@/utils/supabase/server";

interface WatchlistItem {
  id: number;
  type: "movie" | "tv";
  adult: boolean;
  backdrop_path: string;
  poster_path?: string | null;
  release_date: string;
  title: string;
  vote_average: number;
  created_at: string;
}

interface HistoryItem {
  media_id: number;
  type: "movie" | "tv";
  season: number;
  episode: number;
  duration: number;
  last_position: number;
  completed: boolean;
  adult: boolean;
  backdrop_path: string;
  poster_path?: string | null;
  release_date: string;
  title: string;
  vote_average: number;
  updated_at: string;
}

interface MigrationResponse {
  success: boolean;
  message?: string;
  watchlistMigrated?: number;
  historyMigrated?: number;
  failedItems?: Array<{ id: number; error: string }>;
}

/**
 * Migrate localStorage watchlist data to Supabase
 * This should be called when a user first logs in
 */
export async function migrateWatchlistFromLocalStorage(
  localStorageData: string,
): Promise<MigrationResponse> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    // Parse localStorage data
    let watchlistData: WatchlistItem[];
    try {
      watchlistData = JSON.parse(localStorageData);
    } catch {
      return {
        success: false,
        message: "Invalid localStorage data format",
      };
    }

    if (!Array.isArray(watchlistData) || watchlistData.length === 0) {
      return {
        success: true,
        message: "No watchlist data to migrate",
        watchlistMigrated: 0,
      };
    }

    // Migrate each item to Supabase
    let migratedCount = 0;
    const failedItems: Array<{ id: number; error: string }> = [];
    
    for (const item of watchlistData) {
      try {
        const { error } = await supabase.from("watchlist").insert({
          user_id: user.id,
          id: item.id,
          type: item.type,
          adult: item.adult || false,
          backdrop_path: item.backdrop_path || "",
          poster_path: item.poster_path || null,
          release_date: item.release_date || new Date().toISOString().split("T")[0],
          title: item.title,
          vote_average: item.vote_average || 0,
          created_at: item.created_at,
        });

        if (!error) {
          migratedCount++;
        } else {
          failedItems.push({ id: item.id, error: error.message || "Unknown error" });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to migrate watchlist item:", item.id, err);
        failedItems.push({ id: item.id, error: errorMessage });
      }
    }

    return {
      success: true,
      message: `Successfully migrated ${migratedCount} watchlist items${failedItems.length > 0 ? ` (${failedItems.length} failed)` : ""}`,
      watchlistMigrated: migratedCount,
      failedItems: failedItems.length > 0 ? failedItems : undefined,
    };
  } catch (error) {
    console.error("Watchlist migration error:", error);
    return {
      success: false,
      message: "Failed to migrate watchlist data",
    };
  }
}

/**
 * Migrate localStorage history data to Supabase
 * This should be called when a user first logs in
 */
export async function migrateHistoryFromLocalStorage(
  localStorageData: string,
): Promise<MigrationResponse> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    // Parse localStorage data
    let historyData: HistoryItem[];
    try {
      historyData = JSON.parse(localStorageData);
    } catch {
      return {
        success: false,
        message: "Invalid localStorage data format",
      };
    }

    if (!Array.isArray(historyData) || historyData.length === 0) {
      return {
        success: true,
        message: "No history data to migrate",
        historyMigrated: 0,
      };
    }

    // Migrate each item to Supabase
    let migratedCount = 0;
    const failedItems: Array<{ id: number; error: string }> = [];
    
    for (const item of historyData) {
      try {
        const { error } = await supabase.from("histories").insert({
          user_id: user.id,
          media_id: item.media_id,
          type: item.type,
          season: item.season,
          episode: item.episode,
          duration: item.duration,
          last_position: item.last_position,
          completed: item.completed,
          adult: item.adult,
          backdrop_path: item.backdrop_path,
          poster_path: item.poster_path,
          release_date: item.release_date,
          title: item.title,
          vote_average: item.vote_average,
          updated_at: item.updated_at,
        });

        if (!error) {
          migratedCount++;
        } else {
          failedItems.push({ id: item.media_id, error: error.message || "Unknown error" });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to migrate history item:", item.media_id, err);
        failedItems.push({ id: item.media_id, error: errorMessage });
      }
    }

    return {
      success: true,
      message: `Successfully migrated ${migratedCount} history items${failedItems.length > 0 ? ` (${failedItems.length} failed)` : ""}`,
      historyMigrated: migratedCount,
      failedItems: failedItems.length > 0 ? failedItems : undefined,
    };
  } catch (error) {
    console.error("History migration error:", error);
    return {
      success: false,
      message: "Failed to migrate history data",
    };
  }
}

/**
 * Check if watchlist migration has been performed for the current user
 */
export async function hasMigratedWatchlist(): Promise<boolean> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    // Check if user has watchlist data in Supabase
    const { data: watchlistData } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    return !!(watchlistData && watchlistData.length > 0);
  } catch {
    return false;
  }
}

/**
 * Check if history migration has been performed for the current user
 */
export async function hasMigratedHistory(): Promise<boolean> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    // Check if user has history data in Supabase
    const { data: historyData } = await supabase
      .from("histories")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    return !!(historyData && historyData.length > 0);
  } catch {
    return false;
  }
}

/**
 * Check if migration has been performed for the current user
 */
export async function hasMigratedData(): Promise<boolean> {
  const watchlistMigrated = await hasMigratedWatchlist();
  const historyMigrated = await hasMigratedHistory();
  return watchlistMigrated || historyMigrated;
}