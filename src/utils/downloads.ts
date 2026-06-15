"use client";

export type DownloadSource = {
  name: string;
  url: string;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "+")
    .trim();
}

export function getMovieDownloadSources(title: string, year?: string): DownloadSource[] {
  const query = slugify(title);
  const yearSuffix = year ? `+${year}` : "";
  return [
    {
      name: "1337x",
      url: `https://1337x.to/search/${query}${yearSuffix}/1/`,
    },
    {
      name: "YTS",
      url: `https://yts.mx/browse-movies/${query}`,
    },
    {
      name: "RARBG (mirror)",
      url: `https://rargb.to/search/?search=${query}${yearSuffix}&category[]=movies`,
    },
  ];
}

export function getTvDownloadSources(
  title: string,
  season?: number,
  episode?: number,
): DownloadSource[] {
  const query = slugify(title);
  const seasonSuffix = season ? `+S${String(season).padStart(2, "0")}` : "";
  const episodeSuffix = episode ? `E${String(episode).padStart(2, "0")}` : "";
  return [
    {
      name: "1337x",
      url: `https://1337x.to/search/${query}${seasonSuffix}${episodeSuffix}/1/`,
    },
    {
      name: "EZTV",
      url: `https://eztv.re/search/${query}`,
    },
    {
      name: "RARBG (mirror)",
      url: `https://rargb.to/search/?search=${query}${seasonSuffix}${episodeSuffix}&category[]=tv`,
    },
  ];
}
