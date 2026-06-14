import { describe, it, expect, vi, beforeEach } from "vitest";
import { signIn, signUp, signOut } from "./auth";

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock migration function
vi.mock("@/utils/migration", () => ({
  performMigration: vi.fn(),
}));

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("should sign in user successfully", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: { username: "testuser" },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const result = await signIn({
        email: "test@example.com",
        password: "password123",
        loginPassword: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Welcome back, testuser");
    });

    it("should return error on sign in failure", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

      const result = await signIn({
        email: "test@example.com",
        password: "wrongpassword",
        loginPassword: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid credentials");
    });

    it("should return error if username fetch fails", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const result = await signIn({
        email: "test@example.com",
        password: "password123",
        loginPassword: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Database error");
    });
  });

  describe("signUp", () => {
    it("should sign up user successfully", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Sign up successful");
    });

    it("should return error on sign up failure", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Email already exists" },
      });

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email already exists");
    });

    it("should return error if user creation fails", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not created. Please try again.");
    });
  });

  describe("signOut", () => {
    it("should sign out user successfully", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.message).toBe("You have been signed out.");
    });

    it("should return error on sign out failure", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: "Sign out failed" },
      });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Sign out failed");
    });
  });
});