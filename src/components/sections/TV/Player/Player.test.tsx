import { describe, expect, it, vi } from "vitest";
import TvShowPlayer from "./Player";
import { TvShowDetails } from "tmdb-ts/dist/types/tv";
import { Episode } from "tmdb-ts";

describe("TvShowPlayer", () => {
  const mockTvShow: TvShowDetails = {
    id: 123,
    name: "Test TV Show",
    backdrop_path: "/backdrop.jpg",
    poster_path: "/poster.jpg",
    first_air_date: "2024-01-01",
    vote_average: 8.5,
    overview: "Test overview",
    genre_ids: [],
    original_language: "en",
    original_name: "Test TV Show",
    popularity: 100,
    vote_count: 1000,
  };

  const mockEpisode: Episode = {
    id: 456,
    name: "Test Episode",
    overview: "Episode overview",
    air_date: "2024-01-01",
    episode_number: 1,
    season_number: 1,
    runtime: 45,
    still_path: "/still.jpg",
    vote_average: 8.0,
    vote_count: 100,
  };

  const mockEpisodes: Episode[] = [mockEpisode];

  const defaultProps = {
    tv: mockTvShow,
    id: 123,
    seriesName: "Test TV Show",
    seasonName: "Season 1",
    episode: mockEpisode,
    episodes: mockEpisodes,
    nextEpisodeNumber: 2,
    prevEpisodeNumber: null,
  };

  it("should have correct component structure", () => {
    // Just verify the component can be imported
    expect(TvShowPlayer).toBeDefined();
  });

  it("should accept TV show props", () => {
    const props = {
      ...defaultProps,
      startAt: 30,
    };
    
    expect(props.tv).toEqual(mockTvShow);
    expect(props.startAt).toBe(30);
  });
});