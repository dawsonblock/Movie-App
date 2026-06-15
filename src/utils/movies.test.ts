import { describe, expect, it } from "vitest";
import {
  movieDurationString,
  formatDuration,
  timeAgo,
  getImageUrl,
  mutateMovieTitle,
  mutateTvShowTitle,
  getLoadingLabel,
} from "./movies";

describe("movieDurationString", () => {
  it("formats hours and minutes", () => {
    expect(movieDurationString(150)).toBe("2h 30m");
  });

  it("formats minutes only when less than an hour", () => {
    expect(movieDurationString(45)).toBe("45m");
  });

  it("returns N/A when no duration provided", () => {
    expect(movieDurationString(undefined)).toBe("N/A");
    expect(movieDurationString(0)).toBe("N/A");
  });
});

describe("formatDuration", () => {
  it("formats seconds to MM:SS", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("formats hours when present", () => {
    expect(formatDuration(3665)).toBe("1:01:05");
  });

  it("pads single-digit seconds and minutes", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
  });

  it("rounds fractional seconds", () => {
    expect(formatDuration(10.4)).toBe("0:10");
    expect(formatDuration(10.6)).toBe("0:11");
  });
});

describe("timeAgo", () => {
  it("returns 'Just now' for very recent dates", () => {
    const now = new Date();
    expect(timeAgo(now)).toBe("Just now");
  });

  it("returns seconds ago for recent dates", () => {
    const date = new Date(Date.now() - 30000);
    expect(timeAgo(date)).toMatch(/30 seconds ago/);
  });

  it("returns minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(date)).toBe("5 minutes ago");
  });

  it("returns hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe("3 hours ago");
  });

  it("returns yesterday", () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe("yesterday");
  });

  it("returns days ago", () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe("5 days ago");
  });

  it("handles string dates", () => {
    const dateStr = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(dateStr)).toBe("2 days ago");
  });
});

describe("getImageUrl", () => {
  it("constructs TMDB poster URL", () => {
    expect(getImageUrl("/poster.jpg", "poster")).toBe("https://image.tmdb.org/t/p/w500//poster.jpg");
  });

  it("constructs full-size TMDB URL", () => {
    expect(getImageUrl("/backdrop.jpg", "backdrop", true)).toBe(
      "https://image.tmdb.org/t/p/original//backdrop.jpg",
    );
  });

  it("returns fallback for missing poster path", () => {
    expect(getImageUrl(undefined, "poster")).toBe("https://dancyflix.com/placeholder.png");
  });

  it("returns fallback for missing backdrop path", () => {
    expect(getImageUrl(undefined, "backdrop")).toBe("https://wallpapercave.com/wp/wp1945939.jpg");
  });

  it("returns empty string for missing title path", () => {
    expect(getImageUrl(undefined, "title")).toBe("");
  });
});

describe("mutateMovieTitle", () => {
  it("returns original title when language matches", () => {
    const movie = { original_language: "id", original_title: "Judul Asli", title: "English Title" };
    expect(mutateMovieTitle(movie as unknown as Parameters<typeof mutateMovieTitle>[0], "id")).toBe("Judul Asli");
  });

  it("returns translated title when language does not match", () => {
    const movie = { original_language: "en", original_title: "Original", title: "Translated" };
    expect(mutateMovieTitle(movie as unknown as Parameters<typeof mutateMovieTitle>[0], "id")).toBe("Translated");
  });

  it("returns N/A when movie is undefined", () => {
    expect(mutateMovieTitle(undefined)).toBe("N/A");
  });
});

describe("mutateTvShowTitle", () => {
  it("returns original name when language matches", () => {
    const tv = { original_language: "id", original_name: "Nama Asli", name: "English Name" };
    expect(mutateTvShowTitle(tv as unknown as Parameters<typeof mutateTvShowTitle>[0], "id")).toBe("Nama Asli");
  });

  it("returns translated name when language does not match", () => {
    const tv = { original_language: "en", original_name: "Original", name: "Translated" };
    expect(mutateTvShowTitle(tv as unknown as Parameters<typeof mutateTvShowTitle>[0], "id")).toBe("Translated");
  });

  it("returns N/A when tv show is undefined", () => {
    expect(mutateTvShowTitle(undefined)).toBe("N/A");
  });
});

describe("getLoadingLabel", () => {
  it("returns a non-empty string", () => {
    expect(getLoadingLabel().length).toBeGreaterThan(0);
  });

  it("returns a string from the predefined list", () => {
    const label = getLoadingLabel();
    expect(typeof label).toBe("string");
  });

  it("can return different labels on successive calls", () => {
    const labels = new Set<string>();
    for (let i = 0; i < 20; i++) {
      labels.add(getLoadingLabel());
    }
    // With 40+ labels, 20 draws should almost certainly yield at least 2 different ones
    expect(labels.size).toBeGreaterThan(1);
  });
});
