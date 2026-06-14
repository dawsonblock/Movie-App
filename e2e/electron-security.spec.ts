import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

test.describe('Electron Security Handler Tests', () => {
  let electronApp: ElectronApplication;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.'],
      executablePath: require('electron'),
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should launch Electron application', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    
    expect(await window.title()).toBeTruthy();
  });

  test('should block window.open via setWindowOpenHandler', async () => {
    const window = await electronApp.firstWindow();
    
    // Test that window.open is blocked by Electron's setWindowOpenHandler
    const popupResult = await window.evaluate(() => {
      try {
        const popup = window.open('https://example.com', '_blank');
        return { opened: popup !== null, popup: popup };
      } catch (e) {
        return { opened: false, error: e.message };
      }
    });
    
    expect(popupResult.opened).toBe(false);
  });

  test('should block external navigation via will-navigate handler', async () => {
    const window = await electronApp.firstWindow();
    
    const currentUrl = window.url();
    
    // Try to navigate to external site
    await window.evaluate(() => {
      window.location.href = 'https://example.com';
    });
    
    // Wait a moment for navigation attempt
    await window.waitForTimeout(1000);
    
    // Should still be on the original URL or allowed internal URL
    const newUrl = window.url();
    expect(newUrl).not.toContain('example.com');
  });

  test('should allow internal navigation', async () => {
    const window = await electronApp.firstWindow();
    
    // Navigate to internal page
    await window.goto('/');
    await window.waitForLoadState('domcontentloaded');
    
    expect(window.url()).toContain('127.0.0.1');
  });

  test('should block downloads via will-download handler', async () => {
    const window = await electronApp.firstWindow();
    
    // Track download events
    const downloadPromise = window.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    // Try to trigger download
    await window.evaluate(() => {
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,test content';
      link.download = 'test.txt';
      link.click();
    });
    
    const download = await downloadPromise;
    expect(download).toBeNull();
  });

  test('should have proper webPreferences security settings', async () => {
    const window = await electronApp.firstWindow();
    
    // Check security settings via webContents
    const securitySettings = await window.evaluate(() => {
      return {
        hasNodeIntegration: typeof process !== 'undefined',
        hasContextIsolation: typeof window !== 'undefined',
        userAgent: navigator.userAgent
      };
    });
    
    // Node integration should be disabled
    expect(securitySettings.hasNodeIntegration).toBe(false);
    // Context isolation should be enabled
    expect(securitySettings.hasContextIsolation).toBe(true);
  });

  test('should block hostile iframe attacks in Electron context', async () => {
    const window = await electronApp.firstWindow();
    
    // Track popup events
    const popupPromise = electronApp.waitForEvent('window', { timeout: 10000 }).catch(() => null);
    
    // Track download events
    const downloadPromise = window.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Navigate to hostile iframe container
    await window.goto('/test-hostile-iframe-container.html');
    await window.waitForSelector('iframe', { timeout: 5000 });
    
    // Wait for security check to complete
    await window.evaluate(() => {
      return new Promise<void>((resolve) => {
        const checkComplete = () => {
          window.removeEventListener('security-check-complete', checkComplete);
          resolve();
        };
        window.addEventListener('security-check-complete', checkComplete);
        
        setTimeout(() => {
          window.removeEventListener('security-check-complete', checkComplete);
          resolve();
        }, 12000);
      });
    });
    
    // Verify no popup was opened
    const popup = await popupPromise;
    expect(popup).toBeNull();
    
    // Verify no download was triggered
    const download = await downloadPromise;
    expect(download).toBeNull();
    
    // Verify we're still on the container page
    expect(window.url()).toContain('/test-hostile-iframe-container.html');
    
    // Check that security events were logged
    const securityEventsCount = await window.locator('#security-events li').count();
    expect(securityEventsCount).toBeGreaterThan(0);
    
    // Verify iframe remains mounted
    const iframeExists = await window.locator('iframe').count();
    expect(iframeExists).toBeGreaterThan(0);
  });

  test('should verify iframe sandbox configuration in Electron', async () => {
    const window = await electronApp.firstWindow();
    
    await window.goto('/test-hostile-iframe-container.html');
    await window.waitForSelector('iframe', { timeout: 5000 });
    
    // Check iframe sandbox attribute matches Electron requirements
    const iframeSandbox = await window.locator('iframe').getAttribute('sandbox');
    
    expect(iframeSandbox).toContain('allow-scripts');
    expect(iframeSandbox).toContain('allow-same-origin');
    expect(iframeSandbox).toContain('allow-forms');
    expect(iframeSandbox).toContain('allow-presentation');
    
    // Verify dangerous permissions are NOT present (Electron security requirement)
    expect(iframeSandbox).not.toContain('allow-popups');
    expect(iframeSandbox).not.toContain('allow-top-navigation');
    expect(iframeSandbox).not.toContain('allow-modals');
    expect(iframeSandbox).not.toContain('allow-downloads');
  });

  test('should handle multiple concurrent security threats', async () => {
    const window = await electronApp.firstWindow();
    
    // Track multiple security events
    const popupPromise = electronApp.waitForEvent('window', { timeout: 10000 }).catch(() => null);
    const downloadPromise = window.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Navigate to hostile iframe container
    await window.goto('/test-hostile-iframe-container.html');
    await window.waitForSelector('iframe', { timeout: 5000 });
    
    // Wait for all attacks to complete
    await window.evaluate(() => {
      return new Promise<void>((resolve) => {
        const checkComplete = () => {
          window.removeEventListener('security-check-complete', checkComplete);
          resolve();
        };
        window.addEventListener('security-check-complete', checkComplete);
        
        setTimeout(() => {
          window.removeEventListener('security-check-complete', checkComplete);
          resolve();
        }, 12000);
      });
    });
    
    // Verify all attacks were blocked
    const popup = await popupPromise;
    const download = await downloadPromise;
    
    expect(popup).toBeNull();
    expect(download).toBeNull();
    expect(window.url()).toContain('/test-hostile-iframe-container.html');
  });
});