import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const guardPath = path.join(__dirname, "security-guard.mjs");

describe("security-guard.mjs", () => {
  it("passes with exit code 0 on clean codebase", () => {
    const result = execSync(`node "${guardPath}"`, { encoding: "utf8" });
    expect(result).toContain("PASS");
  });
});
