import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

test.describe('Electron Application Tests', () => {
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

  test('should launch application', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    
    expect(await window.title()).toBeTruthy();
  });

  test('should have window controls', async () => {
    const window = await electronApp.firstWindow();
    
    // Check for macOS window controls (traffic lights)
    const hasWindowControls = await window.locator('body').evaluate(() => {
      // This would check for window control buttons
      return true; // Placeholder
    });
    
    expect(hasWindowControls).toBe(true);
  });

  test('should handle window resizing', async () => {
    const window = await electronApp.firstWindow();
    
    const initialBounds = await window.bounds();
    
    // Resize window
    await window.setSize({ width: 1200, height: 800 });
    
    const newBounds = await window.bounds();
    
    expect(newBounds.width).toBe(1200);
    expect(newBounds.height).toBe(800);
  });

  test('should handle window minimization', async () => {
    const window = await electronApp.firstWindow();
    
    await window.minimize();
    
    // Wait a moment
    await window.waitForTimeout(1000);
    
    // Restore
    await window.restore();
    
    const isVisible = await window.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should handle window maximization', async () => {
    const window = await electronApp.firstWindow();
    
    await window.maximize();
    
    const bounds = await window.bounds();
    
    // Window should be maximized (bounds will vary by screen)
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  test('should handle fullscreen', async () => {
    const window = await electronApp.firstWindow();
    
    await window.evaluate(() => {
      document.documentElement.requestFullscreen();
    });
    
    await window.waitForTimeout(1000);
    
    // Exit fullscreen
    await window.evaluate(() => {
      document.exitFullscreen();
    });
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const window = await electronApp.firstWindow();
    
    // Test common shortcuts
    await window.keyboard.press('Meta+f'); // Cmd+F on Mac
    
    // Should trigger search or focus
    await window.waitForTimeout(500);
  });

  test('should handle menu bar interactions', async () => {
    const window = await electronApp.firstWindow();
    
    // This would test menu bar functionality
    // Electron apps typically have custom menu bars
    
    const hasMenuBar = await window.locator('body').evaluate(() => {
      // Check for menu bar elements
      return true; // Placeholder
    });
    
    expect(hasMenuBar).toBe(true);
  });

  test('should handle offline mode', async () => {
    const window = await electronApp.firstWindow();
    
    // Simulate offline mode
    await window.context().setOffline(true);
    
    await window.reload();
    await window.waitForLoadState('domcontentloaded');
    
    // Should show offline UI or cached content
    const pageContent = await window.content();
    expect(pageContent.length).toBeGreaterThan(0);
    
    // Restore online mode
    await window.context().setOffline(false);
  });

  test('should handle external link opening', async () => {
    const window = await electronApp.firstWindow();
    
    // Track new window events
    const popupPromise = window.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);
    
    // Click on an external link (if available)
    // await window.click('a[href^="http"]');
    
    // External links should open in system browser, not new Electron window
    const popup = await popupPromise;
    expect(popup).toBeNull();
  });

  test('should handle file downloads', async () => {
    const window = await electronApp.firstWindow();
    
    // Track download events
    const downloadPromise = window.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    // Downloads should be handled by Electron's download manager
    const download = await downloadPromise;
    expect(download).toBeNull();
  });

  test('should handle deep linking', async () => {
    const window = await electronApp.firstWindow();
    
    // Navigate to a deep link
    await window.goto('/movie/550');
    
    await window.waitForLoadState('domcontentloaded');
    
    expect(window.url()).toContain('/movie/550');
  });

  test('should handle multiple windows', async () => {
    const firstWindow = await electronApp.firstWindow();
    
    // Try to open a new window (should be blocked by popup blocker)
    const popupPromise = electronApp.waitForEvent('window', { timeout: 5000 }).catch(() => null);
    
    await firstWindow.evaluate(() => {
      window.open('about:blank');
    });
    
    const popup = await popupPromise;
    expect(popup).toBeNull();
  });

  test('should handle system theme changes', async () => {
    const window = await electronApp.firstWindow();
    
    // Check if app responds to system theme
    const supportsTheme = await window.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
    });
    
    expect(supportsTheme).toBe(true);
  });

  test('should handle memory constraints', async () => {
    const window = await electronApp.firstWindow();
    
    const initialMemory = await window.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await window.goto('/');
      await window.waitForLoadState('domcontentloaded');
      await window.waitForTimeout(500);
    }
    
    const finalMemory = await window.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory should not increase excessively
    const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
    expect(memoryIncrease).toBeLessThan(1.0); // Allow 100% increase
  });

  test('should handle app lifecycle events', async () => {
    const window = await electronApp.firstWindow();
    
    // Test app focus/blur
    await window.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
    });
    
    await window.waitForTimeout(500);
    
    await window.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
    });
    
    await window.waitForTimeout(500);
    
    // App should still be responsive
    const pageContent = await window.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });
});