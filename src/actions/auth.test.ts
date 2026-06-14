import { describe, expect, it, vi, beforeEach } from "vitest";
import { signIn, signUp, sendResetPasswordEmail, resetPassword, signOut } from "./auth";

describe("Auth actions error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn error handling", () => {
    it("should handle invalid email format", async () => {
      const result = await signIn({
        email: "invalid-email",
        loginPassword: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("email");
    });

    it("should handle missing password", async () => {
      const result = await signIn({
        email: "test@example.com",
        loginPassword: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("signUp error handling", () => {
    it("should handle password mismatch", async () => {
      const result = await signUp({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirm: "different123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Passwords do not match");
    });

    it("should handle weak password", async () => {
      const result = await signUp({
        username: "testuser",
        email: "test@example.com",
        password: "short",
        confirm: "short",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Password must be at least 8 characters");
    });

    it("should handle invalid username", async () => {
      const result = await signUp({
        username: "ab",
        email: "test@example.com",
        password: "password123",
        confirm: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Username must be at least 3 characters");
    });
  });

  describe("sendResetPasswordEmail error handling", () => {
    it("should handle invalid email", async () => {
      const result = await sendResetPasswordEmail({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("email");
    });

    it("should handle missing email", async () => {
      const result = await sendResetPasswordEmail({
        email: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("resetPassword error handling", () => {
    it("should handle password mismatch", async () => {
      const result = await resetPassword({
        password: "newpassword123",
        confirm: "different123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Passwords do not match");
    });

    it("should handle weak password", async () => {
      const result = await resetPassword({
        password: "short",
        confirm: "short",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Password must be at least 8 characters");
    });
  });
});