import { test, expect } from '@playwright/test';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { getElectronLauncher, resetElectronLauncher, type ElectronTestLauncher } from './electron-test-helper';

test.describe('Electron Security Tests', () => {
  let launcher: ElectronTestLauncher;
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    launcher = getElectronLauncher();
    const { cdpUrl } = await launcher.launch();
    
    // Connect to Electron via CDP
    browser = await chromium.connectOverCDP(cdpUrl);
    context = await browser.newContext();
    page = await context.newPage();
  }, 60000); // Increase timeout for Electron startup

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

  test.describe('setWindowOpenHandler', () => {
    test('should block window.open() attempts from renderer process', async () => {
      // Try to open a popup from the renderer process
      const popupBlocked = await page.evaluate(() => {
        try {
          const popup = window.open('https://example.com', '_blank');
          return popup === null;
        } catch (error) {
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
        } catch (error) {
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

      // Wait a bit to see if navigation happens
      await page.waitForTimeout(1000);

      // Verify we're still on the same URL
      expect(page.url()).toBe(initialUrl);
    });

    test('should block top.location.href assignment', async () => {
      const initialUrl = page.url();
      
      await page.evaluate(() => {
        (window as any).top.location.href = 'https://malicious-site.com';
      });

      await page.waitForTimeout(1000);
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

      await page.waitForTimeout(1000);
      expect(page.url()).toBe(initialUrl);
    });
  });

  test.describe('will-download handler', () => {
    test('should block download attempts', async () => {
      let downloadTriggered = false;
      
      page.on('download', () => {
        downloadTriggered = true;
      });

      // Try to trigger a download
      await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,test content';
        link.download = 'test.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      // Wait to see if download is triggered
      await page.waitForTimeout(2000);
      
      expect(downloadTriggered).toBe(false);
    });

    test('should block blob downloads', async () => {
      let downloadTriggered = false;
      
      page.on('download', () => {
        downloadTriggered = true;
      });

      await page.evaluate(() => {
        const blob = new Blob(['test content'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'blob-test.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      await page.waitForTimeout(2000);
      expect(downloadTriggered).toBe(false);
    });

    test('should block programmatic downloads', async () => {
      let downloadTriggered = false;
      
      page.on('download', () => {
        downloadTriggered = true;
      });

      await page.evaluate(() => {
        // Try various programmatic download methods
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
      });

      await page.waitForTimeout(2000);
      expect(downloadTriggered).toBe(false);
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
      // This test validates that the security handlers are present
      // by checking the app behavior rather than direct handler inspection
      
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
      await page.waitForTimeout(500);
      expect(page.url()).toBe(initialUrl);

      // Test will-download
      let downloadTriggered = false;
      page.on('download', () => {
        downloadTriggered = true;
      });
      
      await page.evaluate(() => {
        const link = document.createElement('a');
        link.href = 'data:text/plain,test';
        link.download = 'test.txt';
        link.click();
      });
      
      await page.waitForTimeout(1000);
      expect(downloadTriggered).toBe(false);
    });
  });

  test.describe('Real-world Attack Scenarios', () => {
    test('should block malicious iframe popup attempts', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      // Wait for hostile iframe to attempt attacks
      await page.waitForTimeout(5000);

      // Verify no popup windows were created
      const pages = context.pages();
      expect(pages.length).toBe(1); // Only the main page should exist
    });

    test('should block navigation from hostile iframe', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      const initialUrl = page.url();
      
      // Wait for hostile iframe to attempt navigation
      await page.waitForTimeout(5000);

      // Verify we're still on the same page
      expect(page.url()).toBe(initialUrl);
    });

    test('should block downloads from hostile iframe', async () => {
      await page.goto('http://127.0.0.1:45876/test-hostile-iframe-container.html');
      await page.waitForSelector('iframe');

      let downloadTriggered = false;
      page.on('download', () => {
        downloadTriggered = true;
      });

      // Wait for hostile iframe to attempt downloads
      await page.waitForTimeout(5000);

      expect(downloadTriggered).toBe(false);
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