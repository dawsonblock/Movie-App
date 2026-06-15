import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IS_WIN = process.platform === 'win32';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const TEST_PORT = 45876; // Must match the port in electron/main.cjs
const CDP_PORT_RANGE = { min: 9200, max: 9300 }; // Range for CDP ports

class ElectronTestLauncher {
  private electronProcess: ReturnType<typeof spawn> | null = null;
  private cdpPort: number | null = null;
  private isReady: boolean = false;
  private startTime: number | null = null;

  /**
   * Find an available CDP port in the specified range
   */
  private async findAvailableCDPPort(): Promise<number> {
    for (let port = CDP_PORT_RANGE.min; port <= CDP_PORT_RANGE.max; port++) {
      try {
        await this.checkPortAvailable(port);
        return port;
      } catch (_error) {
        // Port is in use, try next one
        continue;
      }
    }
    throw new Error('No available CDP port found in range 9200-9300');
  }

  

  /**
   * Check if a port is available
   */
  private checkPortAvailable(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = createConnection({ host: '127.0.0.1', port });
      
      socket.once('connect', () => {
        socket.destroy();
        reject(new Error(`Port ${port} is in use`));
      });
      
      socket.once('error', () => {
        socket.destroy();
        resolve();
      });
      
      socket.setTimeout(1000, () => {
        socket.destroy();
        reject(new Error('Port check timeout'));
      });
    });
  }

  /**
   * Wait for the Electron app's CDP endpoint to be available
   */
  private async waitForCDP(port: number, timeoutMs: number = 30000): Promise<void> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const check = () => {
        const socket = createConnection({ host: '127.0.0.1', port });

        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });

        socket.once('error', () => {
          socket.destroy();

          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Timed out waiting for CDP on port ${port}`));
            return;
          }

          setTimeout(check, 500);
        });
      };

      check();
    });
  }

  /**
   * Poll the app HTTP endpoint until it responds with 200 OK.
   * This avoids a fixed sleep and returns as soon as the server is ready.
   */
  private async waitForHttpReady(port: number, timeoutMs: number = 10000): Promise<void> {
    const startedAt = Date.now();
    const url = `http://127.0.0.1:${port}`;

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (res.status === 200) return;
      } catch {
        // Not ready yet — keep polling
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    throw new Error(`Timed out waiting for HTTP ready on port ${port}`);
  }

  /**
   * Launch the Electron app in test mode
   */
  async launch(): Promise<{ cdpUrl: string; appUrl: string }> {
    if (this.electronProcess) {
      throw new Error('Electron app is already running');
    }

    this.startTime = Date.now();
    this.cdpPort = await this.findAvailableCDPPort();

    console.log(`[Electron Test Helper] Launching Electron app with CDP port ${this.cdpPort}`);

    // Use the electron CLI wrapper which handles module loading correctly
    const electronBin = IS_WIN ? 'electron.cmd' : 'electron';
    const electronCli = path.join(PROJECT_ROOT, 'node_modules', '.bin', electronBin);

    // Launch Electron with remote debugging enabled
    const electronArgs = [
      path.join(PROJECT_ROOT, 'electron', 'main.cjs'),
      `--remote-debugging-port=${this.cdpPort}`,
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ];

    console.log(`[Electron Test Helper] Launching with electron CLI: ${electronCli}`);
    console.log(`[Electron Test Helper] Args: ${electronArgs.join(' ')}`);

    this.electronProcess = spawn(electronCli, electronArgs, {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        ELECTRON_TEST_MODE: 'true',
        NODE_ENV: 'test',
        // Prevent ELECTRON_RUN_AS_NODE from leaking into test Electron processes.
        // If set, Electron runs as plain Node.js and built-in modules (app, etc.) are unavailable.
        ELECTRON_RUN_AS_NODE: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: IS_WIN,
    });

    // Log Electron output for debugging
    this.electronProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Electron stdout] ${output}`);
      }
    });

    this.electronProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`[Electron stderr] ${output}`);
      }
    });

    this.electronProcess.on('exit', (code: number, signal: string) => {
      console.log(`[Electron Test Helper] Electron process exited with code ${code}, signal ${signal}`);
      this.electronProcess = null;
      this.isReady = false;
    });

    // Wait for CDP to be available
    try {
      await this.waitForCDP(this.cdpPort);
      console.log(`[Electron Test Helper] CDP available on port ${this.cdpPort}`);
      
      // Wait deterministically for the app HTTP server to respond instead of a blind sleep
      await this.waitForHttpReady(TEST_PORT);
      
      this.isReady = true;
      console.log(`[Electron Test Helper] Electron app ready in ${Date.now() - this.startTime}ms`);
      
      return {
        cdpUrl: `http://127.0.0.1:${this.cdpPort}`,
        appUrl: `http://127.0.0.1:${TEST_PORT}`,
      };
    } catch (error) {
      this.kill();
      throw new Error(`Failed to launch Electron app: ${(error as Error).message}`);
    }
  }

  /**
   * Kill the Electron process
   */
  kill(): void {
    if (!this.electronProcess) return;

    console.log('[Electron Test Helper] Killing Electron process');
    const proc = this.electronProcess;
    const pid = proc.pid;

    if (IS_WIN && pid) {
      // Windows does not support Unix signals; use taskkill to terminate the tree
      spawn('taskkill', ['/pid', String(pid), '/f', '/t'], { shell: true, stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
      // Force-kill fallback (Unix only)
      setTimeout(() => {
        try {
          if (pid && !proc.killed) {
            console.log('[Electron Test Helper] Force killing Electron process');
            process.kill(pid, 'SIGKILL');
          }
        } catch {
          // Already dead — ignore
        }
      }, 5000);
    }

    this.electronProcess = null;
    this.isReady = false;
  }

  /**
   * Check if the Electron app is still running
   */
  isRunning(): boolean {
    return this.electronProcess !== null && this.isReady;
  }

  /**
   * Get the CDP connection URL for Playwright
   */
  getCDPUrl(): string {
    if (!this.cdpPort) {
      throw new Error('Electron app is not running');
    }
    return `http://127.0.0.1:${this.cdpPort}`;
  }
}

// Export a singleton instance
let launcherInstance: ElectronTestLauncher | null = null;

export function getElectronLauncher(): ElectronTestLauncher {
  if (!launcherInstance) {
    launcherInstance = new ElectronTestLauncher();
  }
  return launcherInstance;
}

export function resetElectronLauncher(): void {
  if (launcherInstance) {
    launcherInstance.kill();
    launcherInstance = null;
  }
}

// Export the class for testing
export { ElectronTestLauncher };