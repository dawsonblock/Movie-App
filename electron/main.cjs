const electron = require('electron');

if (!electron || typeof electron !== 'object' || !electron.app) {
  console.error(
    '[Electron Fatal] Built-in Electron modules are unavailable.\n' +
    'This usually means ELECTRON_RUN_AS_NODE is set in the environment.\n' +
    'Please unset ELECTRON_RUN_AS_NODE before launching Electron.',
  );
  process.exit(1);
}

const { app, BrowserWindow, Menu } = electron;
const { spawn } = require('node:child_process');
const { createConnection } = require('node:net');
const fs = require('node:fs');
const path = require('node:path');

const isTestMode = process.env.ELECTRON_TEST_MODE === 'true';
const PORT = 45876;

// Determine if we're in dev mode after app is ready
let isDev = false;

let mainWindow = null;
let serverProcess = null;

function getStandaloneDir() {
  // In test mode, always use dev location
  if (isTestMode) {
    return path.join(path.dirname(__filename), "..", ".next", "standalone");
  }
  
  // Check if app is packaged
  isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(path.dirname(__filename), "..", ".next", "standalone");
  }

  return path.join(process.resourcesPath, "standalone");
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const contents = fs.readFileSync(envPath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getServerEntry() {
  const standaloneDir = getStandaloneDir();
  const directEntry = path.join(standaloneDir, "server.js");

  if (fs.existsSync(directEntry)) {
    return { standaloneDir, serverEntry: directEntry };
  }

  const nestedEntries = [];

  function walk(currentDir, depth = 0) {
    if (depth > 6 || !fs.existsSync(currentDir)) return;

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isFile() && entry.name === "server.js") {
        nestedEntries.push(fullPath);
      } else if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      }
    }
  }

  walk(standaloneDir);

  if (nestedEntries.length === 0) {
    throw new Error(`Could not find Next.js server.js in ${standaloneDir}`);
  }

  const serverEntry = nestedEntries[0];
  return { standaloneDir: path.dirname(serverEntry), serverEntry };
}

function waitForServer(port, timeoutMs = 60_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = createConnection({ host: "127.0.0.1", port });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for server on port ${port}`));
          return;
        }

        setTimeout(check, 250);
      });
    };

    check();
  });
}

function startNextServer() {
  const { standaloneDir, serverEntry } = getServerEntry();

  if (isDev || isTestMode) {
    loadEnvFile(path.join(path.dirname(__filename), "..", ".env.local"));
  }

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
    },
    stdio: isDev ? "inherit" : "pipe",
  });

  serverProcess.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Next.js server exited with code ${code}`);
    }
  });
}

function stopNextServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill("SIGTERM");
  serverProcess = null;
}

function buildMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    // macOS-only app menu with roles that only exist on Darwin
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : [
          // Minimal File menu for Windows/Linux
          {
            label: "File",
            submenu: [{ role: "quit" }],
          },
        ]),
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        {
          role: "togglefullscreen",
          accelerator: isMac ? "Cmd+Ctrl+F" : "F11",
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        ...(isMac
          ? [{ type: "separator" }, { role: "front" }]
          : []),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    title: "Cinextma",
    backgroundColor: "#0D0C0F",
    show: !isTestMode, // Don't show window in test mode
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin" ? { trafficLightPosition: { x: 14, y: 14 } } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox must be false for video playback:
      // hardware decoding and DRM (Widevine) require renderer OS access.
      // Third-party embeds are still protected by the iframe sandbox attribute.
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (!isTestMode) {
      mainWindow?.show();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    if (isTestMode) {
      console.log('[Electron Security] setWindowOpenHandler blocked popup attempt');
    }
    return { action: "deny" };
  });

  // Enable fullscreen from the renderer (video player fullscreen button).
  // Without these handlers the HTML5 Fullscreen API requests are silently ignored.
  mainWindow.webContents.on("enter-html-full-screen", () => {
    mainWindow.setFullScreen(true);
  });

  mainWindow.webContents.on("leave-html-full-screen", () => {
    mainWindow.setFullScreen(false);
  });

  // Allow navigation to OAuth providers for login flows (Supabase auth + Google).
  // The Supabase auth endpoint redirects to the provider, which then redirects
  // back to the local app callback URL.
  function isAllowedNavigation(url) {
    const u = new URL(url);
    // Local app server is always allowed
    if (
      (u.hostname === "127.0.0.1" || u.hostname === "localhost") &&
      u.port === String(PORT)
    ) {
      return true;
    }
    // Supabase auth endpoint (e.g. signInWithOAuth redirects here first)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const supabaseHost = new URL(supabaseUrl).hostname;
        if (u.hostname === supabaseHost) return true;
      } catch {
        /* ignore malformed env var */
      }
    }
    // Known OAuth providers
    const allowedOAuthHosts = [
      "accounts.google.com",
    ];
    if (allowedOAuthHosts.includes(u.hostname)) return true;
    return false;
  }

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      if (isTestMode) {
        console.log(`[Electron Security] will-navigate blocked navigation to ${url}`);
      }
      event.preventDefault();
    }
  });

  mainWindow.webContents.session.on("will-download", (event) => {
    if (isTestMode) {
      console.log('[Electron Security] will-download blocked download attempt');
    }
    event.preventDefault();
  });

  if (isTestMode) {
    console.log('[Electron Security] All security handlers registered successfully');
  }

  await mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      startNextServer();
      await waitForServer(PORT);
      await createWindow();
      Menu.setApplicationMenu(buildMenu());
    } catch (error) {
      console.error(error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });

  app.on("before-quit", () => {
    stopNextServer();
  });
}
