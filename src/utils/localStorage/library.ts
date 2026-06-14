import { LIBRARY_STORAGE_KEY } from "@/utils/constants";
import { SavedMovieDetails } from "@/types/movie";

type ContentType = "movie" | "tv";
type FilterType = ContentType | "all";

export interface WatchlistEntry extends SavedMovieDetails {
  created_at: string;
}

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface WatchlistResponse extends ActionResponse<WatchlistEntry[]> {
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  hasNextPage?: boolean;
}

function getLibrary(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLibrary(items: WatchlistEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(items));
}

export function addToLibrary(item: SavedMovieDetails): ActionResponse<WatchlistEntry> {
  try {
    const library = getLibrary();
    const exists = library.some((l) => l.id === item.id && l.type === item.type);
    if (exists) {
      return { success: false, error: "This item is already in your watchlist" };
    }
    const entry: WatchlistEntry = { ...item, created_at: new Date().toISOString() };
    library.push(entry);
    saveLibrary(library);
    return { success: true, data: entry, message: "Added to watchlist successfully" };
  } catch {
    return { success: false, error: "Failed to add item to watchlist" };
  }
}

export function removeFromLibrary(id: number, type: ContentType): ActionResponse {
  try {
    const library = getLibrary().filter((l) => !(l.id === id && l.type === type));
    saveLibrary(library);
    return { success: true, message: "Removed from watchlist successfully" };
  } catch {
    return { success: false, error: "Failed to remove item from watchlist" };
  }
}

export function removeAllLibrary(type: ContentType): ActionResponse {
  try {
    const library = getLibrary().filter((l) => l.type !== type);
    saveLibrary(library);
    return { success: true, message: "Removed items from watchlist successfully" };
  } catch {
    return { success: false, error: "Failed to remove items from watchlist" };
  }
}

export function checkInLibrary(id: number, type: ContentType): ActionResponse & { isInLibrary: boolean } {
  try {
    const library = getLibrary();
    const isInLibrary = library.some((l) => l.id === id && l.type === type);
    return { success: true, isInLibrary };
  } catch {
    return { success: false, isInLibrary: false, error: "Failed to check watchlist status" };
  }
}

export function getLibraryItems(
  filterType: FilterType = "all",
  page: number = 1,
  limit: number = 20,
): WatchlistResponse {
  try {
    const library = getLibrary();
    const filtered =
      filterType === "all" ? library : library.filter((l) => l.type === filterType);

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      success: true,
      data: paginated,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    };
  } catch {
    return { success: false, data: [], error: "Failed to fetch watchlist" };
  }
}
