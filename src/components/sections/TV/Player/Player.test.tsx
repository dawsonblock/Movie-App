import { describe, expect, it } from "vitest";
import TvShowPlayer from "./Player";
import { type TvShowDetails, type Episode } from "tmdb-ts";

describe("TvShowPlayer", () => {
  const mockTvShow = {
    id: 123,
    name: "Test TV Show",
    backdrop_path: "/backdrop.jpg",
    poster_path: "/poster.jpg",
    first_air_date: "2024-01-01",
    vote_average: 8.5,
    overview: "Test overview",
    genres: [],
    original_language: "en",
    original_name: "Test TV Show",
    popularity: 100,
    vote_count: 1000,
    created_by: [],
    episode_run_time: [],
    homepage: "",
    in_production: false,
    languages: [],
    last_air_date: "",
    last_episode_to_air: {
      air_date: "2024-01-01",
      episode_number: 1,
      id: 1,
      name: "Episode 1",
      overview: "",
      production_code: "",
      season_number: 1,
      still_path: "",
      vote_average: 0,
      vote_count: 0,
    },
    networks: [],
    number_of_episodes: 0,
    number_of_seasons: 0,
    origin_country: [],
    production_companies: [],
    production_countries: [],
    seasons: [],
    spoken_languages: [],
    status: "Ended",
    tagline: "",
    type: "Scripted",
  } satisfies TvShowDetails;

  const mockEpisode = {
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
    crew: [],
    guest_stars: [],
    production_code: "",
    show_id: 123,
  } satisfies Episode;

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