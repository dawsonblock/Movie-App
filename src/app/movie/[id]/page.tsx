"use client";

import { Suspense, use } from "react";
import { Spinner } from "@heroui/spinner";
import { useQuery } from "@tanstack/react-query";
import { tmdb } from "@/api/tmdb";
import { Cast } from "tmdb-ts/dist/types/credits";
import { notFound } from "next/navigation";
import { Image } from "tmdb-ts";
import { isEmpty } from "@/utils/helpers";
import dynamic from "next/dynamic";
import { Params } from "@/types";
import { NextPage } from "next";
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const BackdropSection = dynamic(() => import("@/components/sections/Movie/Detail/Backdrop"));
const OverviewSection = dynamic(() => import("@/components/sections/Movie/Detail/Overview"));
const CastsSection = dynamic(() => import("@/components/sections/Movie/Detail/Casts"));
const RelatedSection = dynamic(() => import("@/components/sections/Movie/Detail/Related"));

const MovieDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);

  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () =>
      tmdb.movies.details(id, [
        "images",
        "videos",
        "credits",
        "keywords",
        "recommendations",
        "similar",
        "reviews",
        "watch/providers",
      ]),
    queryKey: ["movie-detail", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || isEmpty(movie)) return notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Suspense fallback={<Spinner size="lg" className="absolute-center" variant="simple" />}>
        <BackdropSection movie={movie} />
        <OverviewSection movie={movie} />
        <div className="relative z-30 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-10">
            <PhotosSection images={movie.images.backdrops as Image[]} />
          </div>
          <div className="flex flex-col gap-10">
            <CastsSection casts={movie.credits.cast as Cast[]} />
            <RelatedSection movie={movie} />
          </div>
        </div>
      </Suspense>
    </div>
  );
};

export default MovieDetailPage;
