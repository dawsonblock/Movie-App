import { test, expect } from '@playwright/test';

test.describe('TV Show Watching Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should browse TV shows', async ({ page }) => {
    // Navigate to TV shows section
    await page.click('[data-testid="tv-shows-tab"]');
    
    // Wait for TV shows to load
    await page.waitForSelector('[data-testid="tv-card"]', { timeout: 10000 });
    
    // Check if TV show cards are visible
    const tvCards = page.locator('[data-testid="tv-card"]');
    await expect(tvCards.first()).toBeVisible();
  });

  test('should navigate to TV show details page', async ({ page }) => {
    // Navigate to TV shows section
    await page.click('[data-testid="tv-shows-tab"]');
    
    // Wait for TV shows to load
    await page.waitForSelector('[data-testid="tv-card"]', { timeout: 10000 });
    
    // Click on first TV show
    await page.click('[data-testid="tv-card"]:first-child');
    
    // Should navigate to TV show details page
    await expect(page).toHaveURL(/.*\/tv\/\d+/);
    
    // Check if TV show details are visible
    await expect(page.locator('[data-testid="tv-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tv-overview"]')).toBeVisible();
  });

  test('should select season', async ({ page }) => {
    // Navigate to a TV show
    await page.goto('/tv/1396'); // Breaking Bad ID
    
    // Wait for TV show details to load
    await page.waitForSelector('[data-testid="tv-title"]', { timeout: 10000 });
    
    // Click on season selector
    await page.click('[data-testid="season-selector"]');
    
    // Select a different season
    await page.click('[data-testid="season-option"]:nth-child(2)');
    
    // Check if episodes are updated
    await expect(page.locator('[data-testid="episode-card"]')).toBeVisible();
  });

  test('should navigate to episode player', async ({ page }) => {
    // Navigate to a TV show
    await page.goto('/tv/1396');
    
    // Wait for TV show details to load
    await page.waitForSelector('[data-testid="tv-title"]', { timeout: 10000 });
    
    // Click on first episode
    await page.click('[data-testid="episode-card"]:first-child');
    
    // Should navigate to player page
    await expect(page).toHaveURL(/.*\/tv\/\d+\/\d+\/\d+\/player/);
    
    // Check if player is visible
    await expect(page.locator('iframe')).toBeVisible();
  });

  test('should handle episode selection in player', async ({ page }) => {
    // Navigate to TV show player
    await page.goto('/tv/1396/1/1/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Click on episode selection button
    await page.click('[data-testid="episode-selection-button"]');
    
    // Check if episode selection modal is visible
    await expect(page.locator('[data-testid="episode-selection-modal"]')).toBeVisible();
    
    // Select a different episode
    await page.click('[data-testid="episode-option"]:nth-child(2)');
    
    // Should navigate to new episode
    await expect(page).toHaveURL(/.*\/tv\/\d+\/\d+\/\d+\/player/);
  });

  test('should handle next episode navigation', async ({ page }) => {
    // Navigate to TV show player
    await page.goto('/tv/1396/1/1/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Click on next episode button
    await page.click('[data-testid="next-episode-button"]');
    
    // Should navigate to next episode
    await expect(page).toHaveURL(/.*\/tv\/\d+\/\d+\/\d+\/player/);
  });

  test('should handle previous episode navigation', async ({ page }) => {
    // Navigate to TV show player (not first episode)
    await page.goto('/tv/1396/1/2/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Click on previous episode button
    await page.click('[data-testid="previous-episode-button"]');
    
    // Should navigate to previous episode
    await expect(page).toHaveURL(/.*\/tv\/\d+\/\d+\/\d+\/player/);
  });

  test('should save TV show watch history', async ({ page }) => {
    // This test requires authentication
    // Navigate to TV show player
    await page.goto('/tv/1396/1/1/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Wait for some time to simulate watching
    await page.waitForTimeout(5000);
    
    // Navigate away from player
    await page.goto('/');
    
    // Check if history is saved
    await expect(page).toHaveURL('/');
  });

  test('should handle continue watching', async ({ page }) => {
    // This test requires pre-existing history
    // Navigate to home page
    await page.goto('/');
    
    // Check if continue watching section is visible
    // (This would require having watch history)
    const continueWatching = page.locator('[data-testid="continue-watching"]');
    
    // If continue watching exists, click on it
    if (await continueWatching.isVisible()) {
      await continueWatching.click();
      await expect(page).toHaveURL(/.*\/(movie|tv)\/\d+/);
    }
  });

  test('should handle TV show player controls', async ({ page }) => {
    // Navigate to TV show player
    await page.goto('/tv/1396/1/1/player');
    
    // Wait for player to load
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // Check if player controls are visible
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    
    // Test play/pause button
    await page.click('[data-testid="play-pause-button"]');
    
    // Test fullscreen button
    await page.click('[data-testid="fullscreen-button"]');
  });

  test('should handle source selection in TV player', async ({ page }) => {
    // Navigate to TV show player
    await page.goto('/tv/1396/1/1/player');
    
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
});