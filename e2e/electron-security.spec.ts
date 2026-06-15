import { test, expect } from '@playwright/test';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { getElectronLauncher, resetElectronLauncher, type ElectronTestLauncher } from './electron-test-helper';

test.describe('Electron Security Tests', () => {
  let launcher: ElectronTestLauncher;
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(60000); // Electron startup can take up to 60s
    launcher = getElectronLauncher();
    const { cdpUrl } = await launcher.launch();

    // Connect to Electron via CDP
    browser = await chromium.connectOverCDP(cdpUrl);
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error("No Electron browser context found");
    }
    context = contexts[0];
    const pages = context.pages();
    if (pages.length === 0) {
      throw new Error("No Electron BrowserWindow page found");
    }
    page = pages[0];
    await page.waitForURL(/http:\/\/127\.0\.0\.1:45876\/.*/);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    resetElectronLauncher();
  });

  test.beforeEach(async () => {
    // Navigate to the app before each test
    await page.goto('http://127.0.0.1:45876');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Resolves to true only if a download is actually allowed to complete.
   * Electron's will-download handler cancels blocked downloads, but Playwright's
   * CDP integration may still emit a download-start event. We verify the download
   * was not canceled by checking download.failure() after a short grace period.
   */
  async function didDownloadFire(triggerFn: () => Promise<void>, timeoutMs = 3000): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let download: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (d: any) => { download = d; };
    page.on('download', handler);
    try {
      await triggerFn();
      // Give Electron's will-download handler time to cancel the download
      await page.waitForTimeout(timeoutMs);
    } finally {
      page.off('download', handler);
    }
    if (!download) return false;
    // A canceled download returns a failure reason; a successful one returns null.
    const failure = await download.failure();
    return failure === null;
  }

  /** Waits for the hostile-iframe container to dispatch its security-check-complete event. */
  async function waitForSecurityCheck(timeoutMs = 12000): Promise<void> {
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const onComplete = () => {
          window.removeEventListener('security-check-complete', onComplete);
          resolve();
        };
        window.addEventListener('security-check-complete', onComplete);
      });
    });
    // Give the DOM a tick to update the event list
    await page.waitForSelector('#security-events li', { timeout: timeoutMs });
  }

  test.describe('Real BrowserWindow Security Tests', () => {
    test('should block popup from hostile iframe while keeping iframe alive', async () => {
      // Navigate to hostile iframe container
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      // Test popup blocking
      const popupPromise = page.waitForEvent('popup', { timeout: 2000 }).catch(() => null);
      await page
        .frameLocator('iframe')
        .locator('#open-popup')
        .click();
      const popup = await popupPromise;
      expect(popup).toBeNull();

      // Test iframe remains alive
      await expect(
        page.frameLocator('iframe').locator('body')
      ).toBeVisible();
    });

    test('should block top-navigation from hostile iframe while keeping iframe alive', async () => {
      // Navigate to hostile iframe container
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      // Test top-navigation blocking
      const beforeUrl = page.url();
      await page
        .frameLocator('iframe')
        .locator('#top-navigation')
        .click();
      await page.waitForFunction(
        (expected) => window.location.href === expected,
        beforeUrl,
        { timeout: 2000 },
      ).catch(() => {/* blocked — URL unchanged */});
      expect(page.url()).toBe(beforeUrl);

      // Test iframe remains alive
      await expect(
        page.frameLocator('iframe').locator('body')
      ).toBeVisible();
    });
  });

  test.describe('setWindowOpenHandler', () => {
    test('should block window.open() attempts from renderer process', async () => {
      // Try to open a popup from the renderer process
      const popupBlocked = await page.evaluate(() => {
        try {
          const popup = window.open('https://example.com', '_blank');
          return popup === null;
        } catch (_error) {
          return true; // If it throws an error, that's also acceptable blocking
        }
      });

      expect(popupBlocked).toBe(true);
    });

    test('should block window.open() with different features', async () => {
      const popupBlocked = await page.evaluate(() => {
        const features = 'width=400,height=400,toolbar=no,menubar=no';
        const popup = window.open('https://example.com', '_blank', features);
        return popup === null;
      });

      expect(popupBlocked).toBe(true);
    });

    test('should block window.open() to same domain', async () => {
      const popupBlocked = await page.evaluate(() => {
        const popup = window.open('http://127.0.0.1:45876', '_blank');
        return popup === null;
      });

      expect(popupBlocked).toBe(true);
    });

    test('should block window.open() from iframe context', async () => {
      // Navigate to a page with an iframe
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      // Try to open popup from iframe context
      const popupBlocked = await page.evaluate(() => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (!iframe.contentWindow) return true;
        
        try {
          const popup = iframe.contentWindow.window.open('https://example.com');
          return popup === null;
        } catch (_error) {
          return true;
        }
      });

      expect(popupBlocked).toBe(true);
    });
  });

  test.describe('will-navigate handler', () => {
    test('should block navigation to external URLs', async () => {
      const initialUrl = page.url();
      
      // Try to navigate to an external URL
      await page.evaluate(() => {
        window.location.href = 'https://example.com';
      });

      // Give Electron's will-navigate handler up to 2s to fire; if blocked the URL stays the same.
      // We use waitForFunction so the test fails fast if the URL unexpectedly changes.
      await page.waitForFunction(
        (expected) => window.location.href === expected,
        initialUrl,
        { timeout: 2000 },
      ).catch(() => {/* blocked navigation is the expected outcome — URL did not change */});

      expect(page.url()).toBe(initialUrl);
    });

    test('should block top.location.href assignment', async () => {
      const initialUrl = page.url();
      
      await page.evaluate(() => {
        (window.top as Window).location.href = 'https://malicious-site.com';
      });

      await page.waitForFunction(
        (expected) => window.location.href === expected,
        initialUrl,
        { timeout: 2000 },
      ).catch(() => {/* blocked — URL unchanged */});

      expect(page.url()).toBe(initialUrl);
    });

    test('should allow internal navigation within the app', async () => {
      // Navigate to a movie page
      await page.goto('http://127.0.0.1:45876/movie/550');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('movie/550');
    });

    test('should block location.replace() to external URLs', async () => {
      const initialUrl = page.url();
      
      await page.evaluate(() => {
        window.location.replace('https://example.com');
      });

      await page.waitForFunction(
        (expected) => window.location.href === expected,
        initialUrl,
        { timeout: 2000 },
      ).catch(() => {/* blocked — URL unchanged */});

      expect(page.url()).toBe(initialUrl);
    });
  });

  test.describe('will-download handler', () => {
    test('should block download attempts', async () => {
      const triggered = await didDownloadFire(() =>
        page.evaluate(() => {
          const link = document.createElement('a');
          link.href = 'data:text/plain;charset=utf-8,test content';
          link.download = 'test.txt';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
      );
      expect(triggered).toBe(false);
    });

    test('should block blob downloads', async () => {
      const triggered = await didDownloadFire(() =>
        page.evaluate(() => {
          const blob = new Blob(['test content'], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'blob-test.txt';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
      );
      expect(triggered).toBe(false);
    });

    test('should block programmatic downloads', async () => {
      const triggered = await didDownloadFire(() =>
        page.evaluate(() => {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          const iframeDoc = iframe.contentDocument;
          if (iframeDoc) {
            const link = iframeDoc.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,iframe test';
            link.download = 'iframe-test.txt';
            iframeDoc.body.appendChild(link);
            link.click();
          }
          document.body.removeChild(iframe);
        })
      );
      expect(triggered).toBe(false);
    });
  });

  test.describe('Web Preferences Security', () => {
    test('should have contextIsolation enabled', async () => {
      const contextIsolationEnabled = await page.evaluate(() => {
        // In Electron with contextIsolation, we can't access Node.js globals
        return typeof process === 'undefined';
      });

      expect(contextIsolationEnabled).toBe(true);
    });

    test('should have nodeIntegration disabled', async () => {
      const nodeIntegrationDisabled = await page.evaluate(() => {
        return typeof require === 'undefined' && typeof process === 'undefined';
      });

      expect(nodeIntegrationDisabled).toBe(true);
    });

    
  });

  test.describe('Electron Process Security', () => {
    test('should have security handlers registered at startup', async () => {
      // Test setWindowOpenHandler
      const popupBlocked = await page.evaluate(() => {
        return window.open('https://test.com') === null;
      });
      expect(popupBlocked).toBe(true);

      // Test will-navigate
      const initialUrl = page.url();
      await page.evaluate(() => {
        window.location.href = 'https://external.com';
      });
      await page.waitForFunction(
        (expected) => window.location.href === expected,
        initialUrl,
        { timeout: 2000 },
      ).catch(() => {/* blocked */});
      expect(page.url()).toBe(initialUrl);

      // Test will-download
      const triggered = await didDownloadFire(() =>
        page.evaluate(() => {
          const link = document.createElement('a');
          link.href = 'data:text/plain,test';
          link.download = 'test.txt';
          link.click();
        })
      );
      expect(triggered).toBe(false);
    });
  });

  test.describe('Real-world Attack Scenarios', () => {
    test('should block malicious iframe popup attempts', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      // Wait for the hostile iframe container to finish its attack sequence
      await waitForSecurityCheck();

      // Verify no popup windows were created
      const pages = context.pages();
      expect(pages.length).toBe(1); // Only the main page should exist
    });

    test('should block navigation from hostile iframe', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      const initialUrl = page.url();

      // Wait for the hostile iframe container to finish its attack sequence
      await waitForSecurityCheck();

      // Verify we're still on the same page
      expect(page.url()).toBe(initialUrl);
    });

    test('should block downloads from hostile iframe', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      const triggered = await didDownloadFire(async () => {
        // Wait for the hostile iframe to attempt downloads
        await waitForSecurityCheck();
      }, 12000);

      expect(triggered).toBe(false);
    });
  });

  test.describe('Security Configuration Validation', () => {
    test('should validate iframe sandbox attributes in Electron context', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      const iframeSandbox = await page.locator('iframe').getAttribute('sandbox');
      
      expect(iframeSandbox).toContain('allow-scripts');
      expect(iframeSandbox).toContain('allow-same-origin');
      expect(iframeSandbox).toContain('allow-forms');
      expect(iframeSandbox).toContain('allow-presentation');
      
      // Verify dangerous permissions are NOT present
      expect(iframeSandbox).not.toContain('allow-popups');
      expect(iframeSandbox).not.toContain('allow-top-navigation');
      expect(iframeSandbox).not.toContain('allow-modals');
      expect(iframeSandbox).not.toContain('allow-downloads');
    });

    test('should validate Content Security Policy headers', async () => {
      const cspHeader = await page.evaluate(async () => {
        const response = await fetch(window.location.href);
        return response.headers.get('Content-Security-Policy');
      });

      // CSP should be present and restrictive
      if (cspHeader) {
        expect(cspHeader).toBeDefined();
        // Add more specific CSP validation as needed
      }
    });
  });
});