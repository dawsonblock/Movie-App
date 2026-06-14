import { z } from "zod";

export const PlayerEventTypeSchema = z.enum([
  "play",
  "pause",
  "seeked",
  "ended",
  "timeupdate",
]);

export const SaveHistoryBodySchema = z.object({
  event: PlayerEventTypeSchema,
  currentTime: z.number().min(0).max(86400),
  duration: z.number().min(0).max(86400),
  mediaId: z.union([z.string().regex(/^\d+$/, "Invalid mediaId format").transform(Number), z.number().int().positive()]),
  mediaType: z.enum(["movie", "tv"]),
  season: z.number().int().min(0).max(999).optional(),
  episode: z.number().int().min(0).max(999).optional(),
  completed: z.boolean().optional(),
  mediaDetails: z.object({
    adult: z.boolean(),
    backdrop_path: z.string().nullable().optional(),
    poster_path: z.string().nullable().optional(),
    release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").refine(
      (date) => {
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return false;
        
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        
        // Check year range
        if (year < 1900 || year > 2100) return false;
        
        // Check valid month
        if (month < 1 || month > 12) return false;
        
        // Check valid day for the month
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) return false;
        
        return true;
      },
      "Invalid date (must be between 1900-2100 and a valid calendar date)"
    ),
    title: z.string().min(1).max(300),
    vote_average: z.number().min(0).max(10),
  }),
});