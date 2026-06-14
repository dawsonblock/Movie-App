const electron = require("electron");
const { app, BrowserWindow, Menu } = electron;
const { spawn } = require("node:child_process");
const { createConnection } = require("node:net");
const fs = require("node:fs");
const path = require("node:path");

const __dirname = path.dirname(__filename);
const isTestMode = process.env.ELECTRON_TEST_MODE === 'true';
const PORT = 45876;

// Determine if we're in dev mode after app is ready
let isDev = false;

let mainWindow = null;
let serverProcess = null;

function getStandaloneDir() {
  // In test mode, always use dev location
  if (isTestMode) {
    return path.join(__dirname, "..", ".next", "standalone");
  }
  
  // Check if app is packaged
  isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "..", ".next", "standalone");
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
    loadEnvFile(path.join(__dirname, "..", ".env.local"));
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
  const template = [
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
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        { type: "separator" },
        { role: "front" },
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
      sandbox: true,
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

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const u = new URL(url);
    if (
      !((u.hostname === "127.0.0.1" || u.hostname === "localhost") &&
        u.port === String(PORT))
    ) {
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
