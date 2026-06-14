"use client";

import { tmdb } from "@/api/tmdb";
import { getMovieLastPosition } from "@/actions/histories";
import { getMovieLastPosition as getLocalMovieLastPosition } from "@/utils/localStorage/history";
import MoviePlayer from "@/components/sections/Movie/Player/Player";
import { Params } from "@/types";
import { isEmpty } from "@/utils/helpers";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { NextPage } from "next";
import { notFound } from "next/navigation";
import { use } from "react";
import { useEffect, useState } from "react";

const MoviePlayerPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  const [startAt, setStartAt] = useState(0);

  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () => tmdb.movies.details(id),
    queryKey: ["movie-player-detail", id],
  });

  const {
    data: serverStartAt,
    isPending: isPendingStartAt,
  } = useQuery({
    queryFn: () => getMovieLastPosition(id),
    queryKey: ["movie-last-position", id],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    // Use server position if available (authenticated user), otherwise fall back to localStorage
    if (serverStartAt !== undefined) {
      setStartAt(serverStartAt);
    } else {
      setStartAt(getLocalMovieLastPosition(id));
    }
  }, [serverStartAt, id]);

  if (isPending || isPendingStartAt) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || isEmpty(movie)) return notFound();

  return (
    <MoviePlayer
      movie={movie}
      startAt={startAt}
    />
  );
};

export default MoviePlayerPage;
