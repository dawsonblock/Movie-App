import { describe, expect, it } from "vitest";
import { isAllowedPlayerUrl, createPlayerSource, AllowedPlayerOrigin } from "./allowedPlayerHosts";

describe("createPlayerSource", () => {
  it("creates a valid source with a leading slash", () => {
    const source = createPlayerSource("https://vidlink.pro", "/movie/123");
    expect(source).toBe("https://vidlink.pro/movie/123");
  });

  it("normalizes a path missing the leading slash", () => {
    const source = createPlayerSource("https://vidlink.pro", "movie/123");
    expect(source).toBe("https://vidlink.pro/movie/123");
  });

  it("throws for a non-allowlisted origin", () => {
    expect(() =>
      createPlayerSource("https://evil.com" as AllowedPlayerOrigin, "/movie/123"),
    ).toThrow("Player source is not on the allowlist");
  });
});

describe("isAllowedPlayerUrl", () => {
  it("allows known good providers", () => {
    expect(isAllowedPlayerUrl("https://vidlink.pro/movie/123")).toBe(true);
    expect(isAllowedPlayerUrl("https://www.vidking.net/embed/movie/123")).toBe(true);
    expect(isAllowedPlayerUrl("https://filmku.stream/embed/123")).toBe(true);
    expect(isAllowedPlayerUrl("https://www.youtube.com/embed/abc")).toBe(true);
    expect(isAllowedPlayerUrl("https://player.vimeo.com/video/123")).toBe(true);
  });

  it("blocks removed bad actors", () => {
    expect(isAllowedPlayerUrl("https://embed.su/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://multiembed.mov/directstream.php")).toBe(false);
    expect(isAllowedPlayerUrl("https://autoembed.co/movie/tmdb/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://player.autoembed.cc/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://www.2embed.cc/embed/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://vidsrc.xyz/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://vidsrc.to/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://vidsrc.icu/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://vidsrc.cc/v2/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://www.nontongo.win/embed/movie/123")).toBe(false);
    expect(isAllowedPlayerUrl("https://moviesapi.club/movie/123")).toBe(false);
  });

  it("blocks non-HTTPS URLs", () => {
    expect(isAllowedPlayerUrl("http://vidlink.pro/movie/123")).toBe(false);
  });

  it("blocks unknown domains", () => {
    expect(isAllowedPlayerUrl("https://evil.com/movie/123")).toBe(false);
  });

  it("blocks invalid URLs", () => {
    expect(isAllowedPlayerUrl("not-a-url")).toBe(false);
  });
});
