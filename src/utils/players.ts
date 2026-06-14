import { createPlayerSource } from "@/config/allowedPlayerHosts";
import { PlayersProps } from "@/types";

/**
 * Generates a list of movie players with their respective titles and source URLs.
 * Each player is constructed using the provided movie ID.
 *
 * @param {string | number} id - The ID of the movie to be embedded in the player URLs.
 * @param {number} [startAt] - The start position in seconds to be embedded in the player URLs. Optional.
 * @returns {PlayersProps[]} - An array of objects, each containing
 * the title of the player and the corresponding source URL.
 */
export const getMoviePlayers = (id: string | number, startAt?: number): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: createPlayerSource(
        "https://vidlink.pro",
        `/movie/${id}?player=jw&primaryColor=006fee&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false&startAt=${startAt || ""}`,
      ),
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidLink 2",
      source: createPlayerSource(
        "https://vidlink.pro",
        `/movie/${id}?primaryColor=006fee&autoplay=false&startAt=${startAt}`,
      ),
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidKing",
      // NOTE: VidKing has a known issue with the `progress` query parameter where it stuck at that timestamp.
      // Currently, this player can save playback progress but cannot resume from a specific timestamp.
      // The `progress` parameter is commented out in the source URL until this is resolved.
      source: createPlayerSource(
        "https://www.vidking.net",
        `/embed/movie/${id}?color=006fee&autoplay=false`,
      ), //&progress=${startAt || ""}`,
      recommended: true,
      fast: true,
      resumable: true,
    },
    {
      title: "FilmKu",
      source: createPlayerSource("https://filmku.stream", `/embed/${id}`),
      ads: true,
    },
  ];
};

/**
 * Generates a list of TV show players with their respective titles and source URLs.
 * Each player is constructed using the provided TV show ID, season, and episode.
 *
 * @param {string | number} id - The ID of the TV show to be embedded in the player URLs.
 * @param {string | number} [season] - The season number of the TV show episode to be embedded.
 * @param {string | number} [episode] - The episode number of the TV show episode to be embedded.
 * @param {number} [startAt] - The start position in seconds to be embedded in the player URLs. Optional.
 * @returns {PlayersProps[]} - An array of objects, each containing
 * the title of the player and the corresponding source URL.
 */
export const getTvShowPlayers = (
  id: string | number,
  season: number,
  episode: number,
  startAt?: number,
): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: createPlayerSource(
        "https://vidlink.pro",
        `/tv/${id}/${season}/${episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false&startAt=${startAt || ""}`,
      ),
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidLink 2",
      source: createPlayerSource(
        "https://vidlink.pro",
        `/tv/${id}/${season}/${episode}?primaryColor=f5a524&autoplay=false&startAt=${startAt}`,
      ),
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidKing",
      // NOTE: VidKing has a known issue with the `progress` query parameter where it stuck at that timestamp.
      // Currently, this player can save playback progress but cannot resume from a specific timestamp.
      // The `progress` parameter is commented out in the source URL until this is resolved.
      source: createPlayerSource(
        "https://www.vidking.net",
        `/embed/tv/${id}/${season}/${episode}?color=f5a524&autoplay=false`,
      ), //&progress=${startAt || ""}`,
      recommended: true,
      fast: true,
      resumable: true,
    },
    {
      title: "FilmKu",
      source: createPlayerSource(
        "https://filmku.stream",
        `/embed/series?tmdb=${id}&sea=${season}&epi=${episode}`,
      ),
      ads: true,
    },
  ];
};