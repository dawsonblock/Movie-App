import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SaveHistoryBodySchema } from "./schema";

type ApiResponse = {
  success: boolean;
  message?: string;
};

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
