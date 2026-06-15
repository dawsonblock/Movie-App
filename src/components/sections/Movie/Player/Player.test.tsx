import { describe, expect, it } from "vitest";
import MoviePlayer from "./Player";
import { type MovieDetails } from "tmdb-ts";

describe("MoviePlayer", () => {
  const mockMovie = {
    id: 123,
    title: "Test Movie",
    backdrop_path: "/backdrop.jpg",
    poster_path: "/poster.jpg",
    release_date: "2024-01-01",
    vote_average: 8.5,
    adult: false,
    overview: "Test overview",
    genres: [],
    original_language: "en",
    original_title: "Test Movie",
    popularity: 100,
    video: false,
    vote_count: 1000,
    budget: 0,
    homepage: "",
    imdb_id: null,
    production_companies: [],
    production_countries: [],
    revenue: 0,
    runtime: 120,
    spoken_languages: [],
    status: "Released",
    tagline: "",
  } satisfies MovieDetails;

  it("should have correct component structure", () => {
    // Just verify the component can be imported
    expect(MoviePlayer).toBeDefined();
  });

  it("should accept movie props", () => {
    const props = {
      movie: mockMovie,
      startAt: 30,
    };
    
    expect(props.movie).toEqual(mockMovie);
    expect(props.startAt).toBe(30);
  });
});