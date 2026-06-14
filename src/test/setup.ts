import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN = "test_token";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test_key";
process.env.PROTECTED_PATHS = "/auth/reset-password,/profile";
