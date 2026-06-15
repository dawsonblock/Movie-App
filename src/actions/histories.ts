"use server";

import { tmdb } from "@/api/tmdb";
import { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";
import { ActionResponse } from "@/types";
import { HistoryDetail } from "@/types/movie";
import { mutateMovieTitle, mutateTvShowTitle } from "@/utils/movies";
import { createClient } from "@/utils/supabase/server";
import { type MovieDetails, type TvShowDetails } from "tmdb-ts";

export const syncHistory = async (
  data: UnifiedPlayerEventData,
  completed?: boolean,
): ActionResponse => {
  console.info("Saving history:", data);

  if (!data) return { success: false, message: "No data to save" };

  if (data.mediaType === "tv" && (!data.season || !data.episode)) {
    return { success: false, message: "Missing season or episode" };
  }

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
        message: "You must be logged in to save history",
      };
    }

    // Validate required fields
    if (!data.mediaId || !data.mediaType) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    // Validate type
    if (!["movie", "tv"].includes(data.mediaType)) {
      return {
        success: false,
        message: 'Invalid content type. Must be "movie" or "tv"',
      };
    }

    let media;
    try {
      media =
        data.mediaType === "movie"
          ? await tmdb.movies.details(Number(data.mediaId))
          : await tmdb.tvShows.details(Number(data.mediaId));
    } catch (error) {
      console.error("TMDB API error:", error);
      return {
        success: false,
        message: "Failed to fetch media details from TMDB",
      };
    }

    if (!media) {
      return {
        success: false,
        message: "Media not found",
      };
    }

    // Insert or update history
    const { data: history, error } = await supabase
      .from("histories")
      .upsert(
        {
          user_id: user.id,
          media_id: Number(data.mediaId),
          type: data.mediaType,
          season: data.season || 0,
          episode: data.episode || 0,
          duration: data.duration,
          last_position: data.currentTime,
          completed: completed || false,
          adult: data.mediaType === "movie" ? (media as MovieDetails).adult : false,
          backdrop_path: media.backdrop_path,
          poster_path: media.poster_path,
          release_date: data.mediaType === "movie"
            ? (media as MovieDetails).release_date
            : (media as TvShowDetails).first_air_date,
          title: data.mediaType === "movie"
            ? mutateMovieTitle(media as MovieDetails)
            : mutateTvShowTitle(media as TvShowDetails),
          vote_average: media.vote_average,
        },
        {
          onConflict: "user_id,media_id,type,season,episode",
        },
      )
      .select();

    if (error) {
      console.info("History save error:", error);
      return {
        success: false,
        message: "Failed to save history",
      };
    }

    console.info("History saved:", history);

    return {
      success: true,
      message: "History saved",
    };
  } catch (error) {
    console.info("Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
};

export const getUserHistories = async (limit: number = 20): ActionResponse<HistoryDetail[]> => {
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

    const { data, error } = await supabase
      .from("histories")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.info("History fetch error:", error);
      return {
        success: false,
        message: "Failed to fetch history",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.info("Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
};

export const getMovieLastPosition = async (id: number): Promise<number | undefined> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return undefined;
    }

    const { data, error } = await supabase
      .from("histories")
      .select("last_position")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .eq("type", "movie");

    if (error) {
      console.info("History fetch error:", error);
      return undefined;
    }

    return data?.[0]?.last_position;
  } catch (error) {
    console.info("Unexpected error:", error);
    return undefined;
  }
};

export const getTvShowLastPosition = async (
  id: number,
  season: number,
  episode: number,
): Promise<number | undefined> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return undefined;
    }

    const { data, error } = await supabase
      .from("histories")
      .select("last_position")
      .eq("user_id", user.id)
      .eq("media_id", id)
      .eq("type", "tv")
      .eq("season", season)
      .eq("episode", episode);

    if (error) {
      console.info("History fetch error:", error);
      return undefined;
    }

    return data?.[0]?.last_position;
  } catch (error) {
    console.info("Unexpected error:", error);
    return undefined;
  }
};
