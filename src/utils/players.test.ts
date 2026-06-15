import { describe, expect, it } from "vitest";
import { getMoviePlayers, getTvShowPlayers } from "./players";

describe("getMoviePlayers", () => {
  it("returns an array of player options", () => {
    const players = getMoviePlayers(550);
    expect(Array.isArray(players)).toBe(true);
    expect(players.length).toBeGreaterThan(0);
  });

  it("includes VidLink as the first option", () => {
    const players = getMoviePlayers(550);
    expect(players[0].title).toBe("VidLink");
    expect(players[0].source).toContain("vidlink.pro");
    expect(players[0].source).toContain("/movie/550");
  });

  it("includes VidLink 2 as the second option", () => {
    const players = getMoviePlayers(550);
    expect(players[1].title).toBe("VidLink 2");
    expect(players[1].source).toContain("vidlink.pro");
  });

  it("includes VidKing as an option", () => {
    const players = getMoviePlayers(550);
    const vidking = players.find((p) => p.title === "VidKing");
    expect(vidking).toBeDefined();
    expect(vidking!.source).toContain("vidking.net");
    expect(vidking!.source).toContain("/embed/movie/550");
  });

  it("includes FilmKu as an option", () => {
    const players = getMoviePlayers(550);
    const filmku = players.find((p) => p.title === "FilmKu");
    expect(filmku).toBeDefined();
    expect(filmku!.source).toContain("filmku.stream");
    expect(filmku!.source).toContain("/embed/550");
  });

  it("embeds startAt parameter when provided", () => {
    const players = getMoviePlayers(550, 120);
    expect(players[0].source).toContain("startAt=120");
  });

  it("marks VidLink and VidKing as recommended", () => {
    const players = getMoviePlayers(550);
    expect(players[0].recommended).toBe(true);
    const vidking = players.find((p) => p.title === "VidKing");
    expect(vidking!.recommended).toBe(true);
  });

  it("marks VidLink as having ads", () => {
    const players = getMoviePlayers(550);
    expect(players[0].ads).toBe(true);
  });

  it("accepts string IDs", () => {
    const players = getMoviePlayers("550");
    expect(players[0].source).toContain("/movie/550");
  });
});

describe("getTvShowPlayers", () => {
  it("returns an array of player options", () => {
    const players = getTvShowPlayers(1396, 1, 1);
    expect(Array.isArray(players)).toBe(true);
    expect(players.length).toBeGreaterThan(0);
  });

  it("includes VidLink with season and episode", () => {
    const players = getTvShowPlayers(1396, 2, 5);
    expect(players[0].title).toBe("VidLink");
    expect(players[0].source).toContain("/tv/1396/2/5");
  });

  it("includes VidLink 2 with season and episode", () => {
    const players = getTvShowPlayers(1396, 1, 1);
    expect(players[1].title).toBe("VidLink 2");
    expect(players[1].source).toContain("/tv/1396/1/1");
  });

  it("includes VidKing with season and episode", () => {
    const players = getTvShowPlayers(1396, 3, 8);
    const vidking = players.find((p) => p.title === "VidKing");
    expect(vidking).toBeDefined();
    expect(vidking!.source).toContain("/embed/tv/1396/3/8");
  });

  it("includes FilmKu with series query params", () => {
    const players = getTvShowPlayers(1396, 1, 1);
    const filmku = players.find((p) => p.title === "FilmKu");
    expect(filmku).toBeDefined();
    expect(filmku!.source).toContain("tmdb=1396");
    expect(filmku!.source).toContain("sea=1");
    expect(filmku!.source).toContain("epi=1");
  });

  it("embeds startAt parameter when provided", () => {
    const players = getTvShowPlayers(1396, 1, 1, 300);
    expect(players[0].source).toContain("startAt=300");
  });

  it("accepts string IDs", () => {
    const players = getTvShowPlayers("1396", 2, 5);
    expect(players[0].source).toContain("/tv/1396/2/5");
  });
});
