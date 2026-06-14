import { LIBRARY_STORAGE_KEY, HISTORY_STORAGE_KEY } from "@/utils/constants";
import {
  migrateWatchlistFromLocalStorage,
  migrateHistoryFromLocalStorage,
  hasMigratedWatchlist,
  hasMigratedHistory,
} from "@/actions/migrate";

/**
 * Extract localStorage watchlist data
 */
export function getLocalStorageWatchlist(): string {
  if (typeof window === "undefined") return "[]";
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    return raw || "[]";
  } catch {
    return "[]";
  }
}

/**
 * Extract localStorage history data
 */
export function getLocalStorageHistory(): string {
  if (typeof window === "undefined") return "[]";
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw || "[]";
  } catch {
    return "[]";
  }
}

/**
 * Clear localStorage watchlist data after successful migration
 */
export function clearLocalStorageWatchlist(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LIBRARY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage watchlist:", error);
  }
}

/**
 * Clear localStorage history data after successful migration
 */
export function clearLocalStorageHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage history:", error);
  }
}

/**
 * Clear all localStorage data after successful migration
 */
export function clearLocalStorageData(): void {
  clearLocalStorageWatchlist();
  clearLocalStorageHistory();
}

/**
 * Perform full migration from localStorage to Supabase
 * This should be called after user authentication
 */
export async function performMigration(): Promise<{
  watchlistMigrated: number;
  historyMigrated: number;
  success: boolean;
}> {
  try {
    // Get localStorage data
    const watchlistData = getLocalStorageWatchlist();
    const historyData = getLocalStorageHistory();

    // Check and migrate watchlist
    const hasWatchlistMigrated = await hasMigratedWatchlist();
    let watchlistResult: { success: boolean; watchlistMigrated?: number } = { success: true, watchlistMigrated: 0 };
    
    if (!hasWatchlistMigrated) {
      watchlistResult = await migrateWatchlistFromLocalStorage(watchlistData);
      if (watchlistResult.success) {
        clearLocalStorageWatchlist();
      }
    }

    // Check and migrate history
    const hasHistoryMigrated = await hasMigratedHistory();
    let historyResult: { success: boolean; historyMigrated?: number } = { success: true, historyMigrated: 0 };
    
    if (!hasHistoryMigrated) {
      historyResult = await migrateHistoryFromLocalStorage(historyData);
      if (historyResult.success) {
        clearLocalStorageHistory();
      }
    }

    return {
      watchlistMigrated: watchlistResult.watchlistMigrated || 0,
      historyMigrated: historyResult.historyMigrated || 0,
      success: watchlistResult.success && historyResult.success,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      watchlistMigrated: 0,
      historyMigrated: 0,
      success: false,
    };
  }
}