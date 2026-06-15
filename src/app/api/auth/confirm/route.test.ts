import { describe, expect, it, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

// vi.mock is hoisted before variable declarations — use vi.hoisted to share refs
const { mockRedirect, mockVerifyOtp } = vi.hoisted(() => {
  const mockVerifyOtp = vi.fn();
  const mockRedirect = vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
    throw err;
  });
  return { mockRedirect, mockVerifyOtp };
});

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { verifyOtp: mockVerifyOtp } })
  ),
}));

import { GET } from "./route";

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/auth/confirm");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString()) as unknown as NextRequest;
}

function captureRedirect(fn: () => Promise<unknown>): Promise<string> {
  return fn().then(
    () => { throw new Error("Expected a redirect but none was thrown"); },
    (err: Error) => {
      if (err.message.startsWith("NEXT_REDIRECT:")) {
        return err.message.slice("NEXT_REDIRECT:".length);
      }
      throw err;
    }
  );
}

describe("/api/auth/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply the throwing behaviour after clearAllMocks resets the implementation
    mockRedirect.mockImplementation((url: string) => {
      const err = new Error(`NEXT_REDIRECT:${url}`);
      (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
      throw err;
    });
  });

  describe("GET endpoint", () => {
    it("should redirect to /auth?error=true when token_hash is missing", async () => {
      const dest = await captureRedirect(() =>
        GET(makeRequest({ type: "signup" }))
      );
      expect(dest).toBe("/auth?error=true");
    });

    it("should redirect to /auth?error=true when type is missing", async () => {
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123" }))
      );
      expect(dest).toBe("/auth?error=true");
    });

    it("should redirect to /auth?error=true when OTP verification fails", async () => {
      mockVerifyOtp.mockResolvedValue({ error: { message: "Invalid OTP" } });
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123", type: "signup" }))
      );
      expect(dest).toBe("/auth?error=true");
    });

    it("should redirect to / on successful verification (default next)", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123", type: "signup" }))
      );
      expect(dest).toBe("/");
    });

    it("should redirect to next param on successful verification", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123", type: "signup", next: "/profile" }))
      );
      expect(dest).toBe("/profile");
    });

    it("should sanitise an open-redirect next param (external URL)", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123", type: "signup", next: "https://evil.com" }))
      );
      expect(dest).toBe("/");
    });

    it("should sanitise a protocol-relative open-redirect next param", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const dest = await captureRedirect(() =>
        GET(makeRequest({ token_hash: "abc123", type: "signup", next: "//evil.com" }))
      );
      expect(dest).toBe("/");
    });
  });
});
