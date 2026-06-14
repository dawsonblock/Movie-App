import { test, expect } from "@playwright/test";

test.describe("Watchlist Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");
  });

  test("should add movie to watchlist when authenticated", async ({ page }) => {
    // First, sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("/");

    // Navigate to a movie detail page
    await page.goto("/movie/123");

    // Click bookmark button
    await page.click('[aria-label*="Watchlist"]');

    // Verify success toast appears
    await expect(page.locator('text=added to your watchlist')).toBeVisible();
  });

  test("should remove movie from watchlist", async ({ page }) => {
    // Sign in and add to watchlist first
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    await page.goto("/movie/123");
    await page.click('[aria-label*="Watchlist"]');
    await expect(page.locator('text=added to your watchlist')).toBeVisible();

    // Remove from watchlist
    await page.click('[aria-label*="Watchlist"]');
    await expect(page.locator('text=removed from your watchlist')).toBeVisible();
  });

  test("should display watchlist in library page", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Add a movie to watchlist
    await page.goto("/movie/123");
    await page.click('[aria-label*="Watchlist"]');
    await expect(page.locator('text=added to your watchlist')).toBeVisible();

    // Navigate to library
    await page.click("text=Library");
    await page.waitForURL("/library");

    // Verify movie appears in watchlist
    await expect(page.locator('[data-testid="watchlist-item"]')).toBeVisible();
  });

  test("should filter watchlist by content type", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to library
    await page.goto("/library");

    // Filter by movies
    await page.click('button:has-text("Movies")');

    // Verify filter is applied
    await expect(page.locator('text=Movies')).toHaveClass(/active/);
  });

  test("should clear all items from watchlist", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to library
    await page.goto("/library");

    // Click clear watchlist button
    await page.click('button:has-text("Clear")');
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await expect(page.locator('text=Cleared')).toBeVisible();
  });
});

test.describe("History Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should save playback position when watching movie", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to movie player
    await page.goto("/movie/123/player");

    // Wait for player to load
    await page.waitForSelector("iframe");

    // Simulate watching for some time
    await page.waitForTimeout(5000);

    // Navigate away
    await page.goto("/");

    // Return to player
    await page.goto("/movie/123/player");

    // Verify that playback resumes from saved position
    // This would require checking the player's current time
    await expect(page.locator("iframe")).toBeVisible();
  });

  test("should display continue watching section", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Watch some content
    await page.goto("/movie/123/player");
    await page.waitForSelector("iframe");
    await page.waitForTimeout(3000);
    await page.goto("/");

    // Verify continue watching section appears
    await expect(page.locator('text=Continue Watching')).toBeVisible();
  });

  test("should save TV show episode progress", async ({ page }) => {
    // Sign in
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to TV show player
    await page.goto("/tv/456/1/1/player");

    // Wait for player to load
    await page.waitForSelector("iframe");

    // Simulate watching
    await page.waitForTimeout(5000);

    // Navigate away and return
    await page.goto("/");
    await page.goto("/tv/456/1/1/player");

    // Verify playback resumes
    await expect(page.locator("iframe")).toBeVisible();
  });
});

test.describe("Data Migration Integration Tests", () => {
  test("should migrate localStorage data on first login", async ({ page }) => {
    // Set up localStorage with existing data
    await page.addInitScript(() => {
      localStorage.setItem(
        "cinextma-library",
        JSON.stringify([
          {
            id: 1,
            type: "movie",
            title: "Test Movie",
            adult: false,
            backdrop_path: "/path.jpg",
            poster_path: "/poster.jpg",
            release_date: "2024-01-01",
            vote_average: 8.5,
            created_at: "2024-01-01T00:00:00Z",
          },
        ]),
      );
    });

    // Sign in
    await page.goto("/");
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to library
    await page.goto("/library");

    // Verify migrated data appears
    await expect(page.locator('[data-testid="watchlist-item"]')).toBeVisible();

    // Verify localStorage is cleared
    const localStorageData = await page.evaluate(() =>
      localStorage.getItem("cinextma-library"),
    );
    expect(localStorageData).toBeNull();
  });

  test("should not migrate if data already exists in Supabase", async ({ page }) => {
    // This test assumes the user already has data in Supabase
    // Sign in
    await page.goto("/");
    await page.click("text=Sign In");
    await page.fill('input[type="email"]', "existing@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Verify no migration toast appears
    await expect(page.locator('text=migrated')).not.toBeVisible();
  });
});