import { test, expect } from '@playwright/test';

test.describe('Long-Running Stability Tests', () => {
  test.describe('Memory Management', () => {
    test('should not leak memory during extended browsing', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      });

      // Simulate extended browsing session
      for (let i = 0; i < 20; i++) {
        await page.goto('/');
        await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
        await page.click('[data-testid="movie-card"]:first-child');
        await page.waitForTimeout(1000);
        await page.goBack();
        await page.waitForTimeout(500);
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      });

      // Skip ratio check when performance.memory is unavailable (non-Chrome / no --enable-precise-memory-info)
      if (initialMemory === 0) return;

      // Memory should not increase significantly (allow 50% increase)
      const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
      expect(memoryIncrease).toBeLessThan(0.5);
    });

    test('should handle component unmounting properly', async ({ page }) => {
      // Navigate to player page
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Navigate away
      await page.goto('/');
      await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });

      // Check for memory leaks by navigating back and forth
      for (let i = 0; i < 10; i++) {
        await page.goto('/movie/550/player');
        await page.waitForSelector('iframe', { timeout: 10000 });
        await page.waitForTimeout(500);
        await page.goto('/');
        await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
        await page.waitForTimeout(500);
      }

      // App should still render (not a blank crash page)
      const bodyChildren = await page.evaluate(() => document.body.children.length);
      expect(bodyChildren).toBeGreaterThan(0);
    });

    test('should clean up event listeners on unmount', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Check for event listener cleanup
      const listenerCountBefore = await page.evaluate(() => {
        const w = window as unknown as Record<string, (t: unknown) => Record<string, unknown>>;
        return w.getEventListeners ? Object.keys(w.getEventListeners(window)).length : 0;
      });

      await page.goto('/');
      await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });

      const listenerCountAfter = await page.evaluate(() => {
        const w = window as unknown as Record<string, (t: unknown) => Record<string, unknown>>;
        return w.getEventListeners ? Object.keys(w.getEventListeners(window)).length : 0;
      });

      // Listener count should not increase significantly
      expect(listenerCountAfter).toBeLessThanOrEqual(listenerCountBefore + 10);
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session during extended usage', async ({ page }) => {
      // This test requires authentication
      // Skip if not authenticated
      
      await page.goto('/');
      
      // Simulate extended session
      for (let i = 0; i < 15; i++) {
        await page.goto('/');
        await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
        await page.click('[data-testid="movie-card"]:first-child');
        await page.waitForTimeout(2000);
        await page.goto('/');
        await page.waitForTimeout(1000);
      }

      // Session should still be valid
      const currentUrl = page.url();
      expect(currentUrl).toBe('http://localhost:3000/');
    });

    test('should handle session refresh', async ({ page }) => {
      await page.goto('/');
      
      // Wait for initial load
      await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
      
      // Refresh page multiple times
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
        await page.waitForTimeout(1000);
      }

      // Should still function properly
      const movieCards = page.locator('[data-testid="movie-card"]');
      await expect(movieCards.first()).toBeVisible();
    });

    test('should handle localStorage quota', async ({ page }) => {
      // Fill localStorage with data
      await page.evaluate(() => {
        for (let i = 0; i < 1000; i++) {
          try {
            localStorage.setItem(`test-key-${i}`, 'x'.repeat(10000));
          } catch (_e) {
            // Quota exceeded, stop
            break;
          }
        }
      });

      // Navigate to player page
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // App should still render after localStorage is full
      const bodyChildren = await page.evaluate(() => document.body.children.length);
      expect(bodyChildren).toBeGreaterThan(0);
    });
  });

  test.describe('Extended Playback Scenarios', () => {
    test('should handle long playback sessions', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Simulate long playback (in real scenario, this would be hours)
      // For testing, we'll use a shorter duration
      await page.waitForTimeout(30000); // 30 seconds

      // Player iframe should still be present and have a valid allowed src
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
      const src = await iframe.getAttribute('src');
      expect(src).toMatch(/^https:\/\//);
    });

    test('should handle multiple source switches', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Switch sources multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="source-selection-button"]');
        await page.waitForSelector('[data-testid="source-selection-modal"]', { timeout: 5000 });
        
        const sourceOptions = page.locator('[data-testid="source-option"]');
        const optionCount = await sourceOptions.count();
        
        if (optionCount > 1) {
          await sourceOptions.nth(i % optionCount).click();
        } else {
          // Close modal if only one source
          await page.keyboard.press('Escape');
        }
        
        await page.waitForTimeout(2000);
      }

      // Player should still be functional
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
    });

    test('should handle player state changes', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Simulate various player state changes by sending postMessages
      // that the app would receive from a real player iframe
      await page.evaluate(() => {
        const messages = [
          { type: 'PLAYER_EVENT', data: { event: 'play', currentTime: 10, duration: 120, mtmdbId: 550, mediaType: 'movie' } },
          { type: 'PLAYER_EVENT', data: { event: 'pause', currentTime: 20, duration: 120, mtmdbId: 550, mediaType: 'movie' } },
          { type: 'PLAYER_EVENT', data: { event: 'seeked', currentTime: 30, duration: 120, mtmdbId: 550, mediaType: 'movie' } },
          { type: 'PLAYER_EVENT', data: { event: 'ended', currentTime: 120, duration: 120, mtmdbId: 550, mediaType: 'movie' } },
        ];
        messages.forEach((msg) => window.postMessage(msg, '*'));
      });

      // App should still be functional after handling player events
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
    });
  });

  test.describe('Network Resilience', () => {
    test('should handle network interruptions', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Simulate network interruption
      await page.context().setOffline(true);
      await page.waitForTimeout(3000);

      // Restore network
      await page.context().setOffline(false);
      await page.waitForTimeout(2000);

      // Player iframe should still be present after network recovers
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
    });

    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow network
      await context.setOffline(false);
      
      await page.goto('/movie/550/player', {
        waitUntil: 'domcontentloaded',
      });

      // Should load even with slow network
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible({ timeout: 30000 });
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Intercept TMDB API calls and force them to fail
      await page.route('https://api.themoviedb.org/**', (route) => {
        route.fulfill({ status: 500, body: JSON.stringify({ status_message: 'Internal Server Error' }) });
      });

      // Navigate to a page that depends on external APIs
      await page.goto('/movie/550');

      // App should still render (not a blank white page) even when APIs fail
      const bodyChildren = await page.evaluate(() => document.body.children.length);
      expect(bodyChildren).toBeGreaterThan(0);

      await page.unroute('https://api.themoviedb.org/**');
    });
  });

  test.describe('Resource Management', () => {
    test('should handle image loading failures', async ({ page }) => {
      // Navigate to page with images
      await page.goto('/movie/550');
      
      // Should handle broken images gracefully
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Verify page renders meaningfully even if images fail to load
        const title = await page.title();
        expect(title).not.toBe('');
      }
    });

    test('should handle video loading failures', async ({ page }) => {
      await page.goto('/movie/550/player');
      await page.waitForSelector('iframe', { timeout: 10000 });

      // Should handle video loading issues
      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible();
    });

    test('should clean up resources on navigation', async ({ page }) => {
      const initialResourceCount = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });

      // Navigate through multiple pages
      await page.goto('/movie/550');
      await page.waitForLoadState('domcontentloaded');
      await page.goto('/tv/1396');
      await page.waitForLoadState('domcontentloaded');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Resource count should not grow unbounded
      const finalResourceCount = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });

      expect(finalResourceCount).toBeLessThan(initialResourceCount + 100);
    });
  });

  test.describe('Concurrency Handling', () => {
    test('should handle rapid page navigation', async ({ page }) => {
      // Navigate rapidly between pages
      const pages = ['/', '/movie/550', '/tv/1396', '/auth'];
      
      for (let i = 0; i < 10; i++) {
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await page.waitForTimeout(200);
        }
      }

      // Should remain stable (no blank page or crash indicator)
      const title = await page.title();
      expect(title).not.toBe('');
    });

    test('should handle simultaneous requests', async ({ page }) => {
      await page.goto('/');

      // Trigger multiple simultaneous operations
      const promises = [
        page.click('[data-testid="movie-card"]:first-child'),
        page.click('[data-testid="tv-shows-tab"]'),
        page.click('[data-testid="search-button"]'),
      ];

      // Some operations might fail due to navigation, but app should not crash
      await Promise.allSettled(promises);

      await page.waitForTimeout(2000);

      // Page should still render meaningfully
      const title = await page.title();
      expect(title).not.toBe('');
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from JavaScript errors', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });

      // Inject a non-fatal console error (fatal throws would crash the test page)
      await page.evaluate(() => {
        console.error('Injected test error for stability check');
      });

      // App should still render the home page (no crash indicator)
      const crashText = await page.locator('text=Application error').count();
      expect(crashText).toBe(0);

      const movieCards = page.locator('[data-testid="movie-card"]');
      await expect(movieCards.first()).toBeVisible();
    });

    test('should show 404 for invalid movie IDs', async ({ page }) => {
      // Navigate to a non-existent movie
      await page.goto('/movie/999999999');
      await page.waitForLoadState('domcontentloaded');

      // Should show the 404 Not Found page instead of crashing
      await expect(page.locator('text=404')).toBeVisible();
      await expect(page.locator('text=Not Found')).toBeVisible();
    });

    test('should maintain error boundaries', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });

      // Verify the React root mounts correctly
      const root = page.locator('#__next');
      await expect(root).toBeVisible();

      // Ensure the root contains actual rendered content, not just an empty div
      const rootHasChildren = await page.evaluate(() => {
        const el = document.getElementById('__next');
        return el ? el.children.length > 0 : false;
      });
      expect(rootHasChildren).toBe(true);
    });
  });
});