import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

type ApiResponse = {
  success: boolean;
  message?: string;
};

const PlayerEventTypeSchema = z.enum([
  "play",
  "pause",
  "seeked",
  "ended",
  "timeupdate",
]);

const SaveHistoryBodySchema = z.object({
  event: PlayerEventTypeSchema,
  currentTime: z.number(),
  duration: z.number(),
  mediaId: z.union([z.string().regex(/^\d+$/, "Invalid mediaId format").transform(Number), z.number().int().positive()]),
  mediaType: z.enum(["movie", "tv"]),
  season: z.number().optional(),
  episode: z.number().optional(),
  completed: z.boolean().optional(),
  mediaDetails: z.object({
    adult: z.boolean(),
    backdrop_path: z.string().nullable().optional(),
    poster_path: z.string().nullable().optional(),
    release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    title: z.string(),
    vote_average: z.number().min(0).max(10),
  }),
});

export const POST = async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Invalid JSON body",
    }, { status: 400 });
  }

  const parsed = SaveHistoryBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "Validation failed",
    }, { status: 422 });
  }

  const { mediaDetails, completed, ...data } = parsed.data;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "You must be logged in to save history",
      }, { status: 401 });
    }

    const { error } = await supabase
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
          adult: mediaDetails.adult,
          backdrop_path: mediaDetails.backdrop_path ?? null,
          poster_path: mediaDetails.poster_path ?? null,
          release_date: mediaDetails.release_date,
          title: mediaDetails.title,
          vote_average: mediaDetails.vote_average,
        },
        {
          onConflict: "user_id,media_id,type,season,episode",
        },
      );

    if (error) {
      console.error("History save error:", error);
      return NextResponse.json<ApiResponse>({
        success: false,
        message: "Failed to save history",
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "History saved",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: "An unexpected error occurred",
    }, { status: 500 });
  }
};
