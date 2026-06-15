#!/usr/bin/env node
/**
 * Security guard — blocks regression of popup-protection code.
 *
 * Run this in CI or as a pre-commit hook. Exit code 1 means a security
 * regression was detected.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EXCLUDED_DIRS = ["node_modules", ".git", ".next", "dist-electron"];
const INCLUDED_EXTENSIONS = [".ts", ".tsx", ".mjs", ".cjs", ".js", ".jsx", ".html"];
const GUARD_SCRIPT_NAME = "security-guard.mjs";

function getAllowedSandboxConstant() {
  const content = fs.readFileSync(
    path.join(root, "src", "config", "allowedPlayerHosts.ts"),
    "utf8",
  );
  const match = content.match(
    /UNIVERSAL_IFRAME_SANDBOX\s*=\s*["']([^"']+)["']/,
  );
  if (!match) {
    console.error(
      `\x1b[31mFAIL\x1b[0m Could not extract UNIVERSAL_IFRAME_SANDBOX from allowedPlayerHosts.ts`,
    );
    process.exit(1);
  }
  return match[1];
}

const ALLOWED_SANDBOX = getAllowedSandboxConstant();

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        yield* walk(full);
      }
    } else if (
      entry.isFile() &&
      INCLUDED_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
      entry.name !== GUARD_SCRIPT_NAME
    ) {
      yield full;
    }
  }
}

let errors = 0;

// 1. Check for shell.openExternal in source files (not in this guard script)
const shellPattern = /shell\.openExternal\s*\(/;
for (const filePath of walk(root)) {
  const rel = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, "utf8");
  if (shellPattern.test(content)) {
    console.error(
      `\x1b[31mFAIL\x1b[0m ${rel}: shell.openExternal() is forbidden — it routes blocked popups to the system browser`,
    );
    errors++;
  }
}

// 2. Check that no inline sandbox= string attribute differs from the allowed constant
// (JSX expression sandbox={UNIVERSAL_IFRAME_SANDBOX} is handled in step 4)
const inlineSandboxPattern = /sandbox\s*=\s*(?:"|'|`)([^"'`]+)/g;
const forbiddenSandboxTokens =
  /allow-popups|allow-popups-to-escape-sandbox|allow-top-navigation|allow-top-navigation-by-user-activation|allow-downloads/;

function isInsideStringLiteral(content, matchIndex) {
  const lineStart = content.lastIndexOf("\n", matchIndex) + 1;
  const prefix = content.slice(lineStart, matchIndex);
  const dquotes = (prefix.match(/"/g) || []).length;
  const squotes = (prefix.match(/'/g) || []).length;
  const bticks = (prefix.match(/`/g) || []).length;
  return dquotes % 2 !== 0 || squotes % 2 !== 0 || bticks % 2 !== 0;
}

function isInHtmlTagContext(content, matchIndex) {
  const lineStart = content.lastIndexOf("\n", matchIndex) + 1;
  const prefix = content.slice(lineStart, matchIndex);
  const lastOpen = prefix.lastIndexOf("<");
  const lastClose = prefix.lastIndexOf(">");
  return lastOpen !== -1 && (lastClose === -1 || lastClose < lastOpen);
}

for (const filePath of walk(root)) {
  const rel = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, "utf8");
  let match;
  while ((match = inlineSandboxPattern.exec(content)) !== null) {
    if (isInsideStringLiteral(content, match.index)) continue;
    if (!isInHtmlTagContext(content, match.index)) continue;

    const value = match[1].trim();
    if (value !== ALLOWED_SANDBOX) {
      console.error(
        `\x1b[31mFAIL\x1b[0m ${rel}: iframe sandbox must exactly equal "${ALLOWED_SANDBOX}"`,
      );
      errors++;
    }
    if (forbiddenSandboxTokens.test(value)) {
      console.error(
        `\x1b[31mFAIL\x1b[0m ${rel}: sandbox contains forbidden permission(s)`,
      );
      errors++;
    }
  }
}

// 3. Check Electron setWindowOpenHandler unconditionally denies all popups
const electronMainPath = path.join(root, "electron", "main.cjs");
if (fs.existsSync(electronMainPath)) {
  const content = fs.readFileSync(electronMainPath, "utf8");
  const handlerMatch = content.match(/setWindowOpenHandler\s*\(/);
  if (!handlerMatch) {
    console.error(
      `\x1b[31mFAIL\x1b[0m electron/main.cjs: setWindowOpenHandler must be defined`,
    );
    errors++;
  } else {
    const startIdx = handlerMatch.index;
    let parenDepth = 0;
    let blockStart = -1;
    for (let i = startIdx; i < content.length; i++) {
      if (content[i] === "(") parenDepth++;
      else if (content[i] === ")") parenDepth--;
      if (content[i] === "{" && parenDepth === 1 && blockStart === -1) {
        blockStart = i;
        break;
      }
    }
    let blockEnd = content.length;
    if (blockStart !== -1) {
      let depth = 1;
      for (let i = blockStart + 1; i < content.length; i++) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        if (depth === 0) {
          blockEnd = i + 1;
          break;
        }
      }
    }
    const block = content.slice(blockStart, blockEnd);
    const hasDeny = /action\s*:\s*["']deny["']/.test(block);
    const hasAllow = /action\s*:\s*["']allow["']/.test(block);
    if (!hasDeny || hasAllow) {
      console.error(
        `\x1b[31mFAIL\x1b[0m electron/main.cjs: setWindowOpenHandler must unconditionally return { action: 'deny' }`,
      );
      errors++;
    }
  }
}

// 4. Check iframe sandbox constant usage
const allowedPlayerHostsPath = path.join(root, "src", "config", "allowedPlayerHosts.ts");
if (fs.existsSync(allowedPlayerHostsPath)) {
  const content = fs.readFileSync(allowedPlayerHostsPath, "utf8");
  if (!content.includes("UNIVERSAL_IFRAME_SANDBOX")) {
    console.error(
      `\x1b[31mFAIL\x1b[0m src/config/allowedPlayerHosts.ts: UNIVERSAL_IFRAME_SANDBOX constant must be defined`,
    );
    errors++;
  }
}

const iframePattern = /<\s*iframe\b/;
const jsxExprSandboxPattern = /sandbox\s*=\s*\{([\s\S]*?)\}/g;

for (const filePath of walk(root)) {
  const rel = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, "utf8");

  if (!iframePattern.test(content)) continue;

  let hasJsxExprSandbox = false;
  let usesConstant = false;
  let match;

  while ((match = jsxExprSandboxPattern.exec(content)) !== null) {
    hasJsxExprSandbox = true;
    if (match[1].includes("UNIVERSAL_IFRAME_SANDBOX")) {
      usesConstant = true;
    }
  }

  if (hasJsxExprSandbox && !usesConstant) {
    console.error(
      `\x1b[31mFAIL\x1b[0m ${rel}: iframe with JSX sandbox expression must use UNIVERSAL_IFRAME_SANDBOX`,
    );
    errors++;
  }
}

if (errors === 0) {
  console.log("\x1b[32mPASS\x1b[0m Security guard — no regressions detected.");
  process.exit(0);
} else {
  console.error(`\n\x1b[31m${errors} security regression(s) detected.\x1b[0m`);
  process.exit(1);
}
