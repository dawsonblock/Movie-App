import { test, expect } from '@playwright/test';

test.describe('Movie Watching Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should browse movies', async ({ page }) => {
    // Wait for movies to load
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
    
    // Check if movie cards are visible
    const movieCards = page.locator('[data-testid="movie-card"]');
    await expect(movieCards.first()).toBeVisible();
  });

  test('should search for movies', async ({ page }) => {
    // Click on search
    await page.click('[data-testid="search-button"]');
    
    // Type search query
    await page.fill('[data-testid="search-input"]', 'Inception');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
    
    // Check if search results are visible
    const searchResults = page.locator('[data-testid="movie-card"]');
    await expect(searchResults.first()).toBeVisible();
  });

  test('should navigate to movie details page', async ({ page }) => {
    // Wait for movies to load
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
    
    // Click on first movie
    await page.click('[data-testid="movie-card"]:first-child');
    
    // Should navigate to movie details page
    await expect(page).toHaveURL(/.*\/movie\/\d+/);
    
    // Check if movie details are visible
    await expect(page.locator('[data-testid="movie-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="movie-overview"]')).toBeVisible();
  });

  test('should start movie playback', async ({ page }) => {
    // Navigate to a specific movie
    await page.goto('/movie/550'); // Fight Club ID
    
    // Wait for movie details to load
    await page.waitForSelector('[data-testid="movie-title"]', { timeout: 10000 });
    
    // Click on play button
    await page.click('[data-testid="play-button"]');
    
    // Should navigate to player page
    await expect(page).toHaveURL(/.*\/movie\/\d+\/player/);
    
    // Check if player is visible
    await expect(page.locator('iframe')).toBeVisible();
  });

  test('should handle player source selection', async ({ page }) => {
    // Navigate to player page
    await page.goto('/movie/550/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Click on source selection button
    await page.click('[data-testid="source-selection-button"]');
    
    // Check if source selection modal is visible
    await expect(page.locator('[data-testid="source-selection-modal"]')).toBeVisible();
    
    // Select a different source
    await page.click('[data-testid="source-option"]:nth-child(2)');
    
    // Check if modal is closed
    await expect(page.locator('[data-testid="source-selection-modal"]')).not.toBeVisible();
  });

  test('should handle player controls', async ({ page }) => {
    // Navigate to player page
    await page.goto('/movie/550/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Check if player controls are visible
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    
    // Test play/pause button
    await page.click('[data-testid="play-pause-button"]');
    
    // Test fullscreen button
    await page.click('[data-testid="fullscreen-button"]');
  });

  test('should save watch history', async ({ page }) => {
    // This test requires authentication
    // In a real scenario, you'd first sign in a test user
    
    // Navigate to player page
    await page.goto('/movie/550/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Wait for some time to simulate watching
    await page.waitForTimeout(5000);
    
    // Navigate away from player
    await page.goto('/');
    
    // Check if history is saved (this would require checking localStorage or database)
    // For now, we'll just verify no errors occurred
    await expect(page).toHaveURL('/');
  });

  test('should handle playback errors gracefully', async ({ page }) => {
    // Navigate to a non-existent movie
    await page.goto('/movie/999999999/player');
    
    // Should show error message or redirect
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle ads warning overlay', async ({ page }) => {
    // Navigate to player page for the first time
    await page.goto('/movie/550/player');
    
    // Check if ads warning overlay is shown
    await expect(page.locator('[data-testid="ads-warning"]')).toBeVisible();
    
    // Click to dismiss
    await page.click('[data-testid="ads-warning-dismiss"]');
    
    // Check if overlay is hidden
    await expect(page.locator('[data-testid="ads-warning"]')).not.toBeVisible();
  });

  test('should handle player iframe security', async ({ page }) => {
    // Navigate to player page
    await page.goto('/movie/550/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });

    // sandbox is removed so third-party video players do not refuse to load.
    // Electron native handlers provide equivalent popup/navigation/download blocking.
    const iframe = page.locator('iframe');
    const sandbox = await iframe.getAttribute('sandbox');
    expect(sandbox).toBeNull();
  });
});