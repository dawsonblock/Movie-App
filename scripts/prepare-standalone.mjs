import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");

if (!fs.existsSync(standaloneDir)) {
  throw new Error("Missing .next/standalone. Run `next build` first.");
}

if (!fs.existsSync(staticDir)) {
  throw new Error("Missing .next/static. Run `next build` first.");
}

fs.cpSync(staticDir, path.join(standaloneDir, ".next", "static"), { recursive: true });
fs.cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });

const envSource = path.join(root, ".env.local");
const envTarget = path.join(standaloneDir, ".env");

if (fs.existsSync(envSource)) {
  fs.copyFileSync(envSource, envTarget);
  console.log("Copied .env.local into standalone bundle.");
} else {
  console.warn("No .env.local found. The packaged app will need environment variables configured.");
}

console.log("Standalone bundle prepared for Electron.");