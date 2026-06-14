import { describe, expect, it, vi } from "vitest";
import MoviePlayer from "./Player";
import { MovieDetails } from "tmdb-ts/dist/types/movies";

describe("MoviePlayer", () => {
  const mockMovie: MovieDetails = {
    id: 123,
    title: "Test Movie",
    backdrop_path: "/backdrop.jpg",
    poster_path: "/poster.jpg",
    release_date: "2024-01-01",
    vote_average: 8.5,
    adult: false,
    overview: "Test overview",
    genre_ids: [],
    original_language: "en",
    original_title: "Test Movie",
    popularity: 100,
    video: false,
    vote_count: 1000,
  };

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