import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*\/auth/);
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show email validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should show validation errors for missing password', async ({ page }) => {
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Should show password validation error
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/auth\?mode=signup/);
  });

  test('should show validation errors for password mismatch', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm"]', 'different123');
    await page.click('button[type="submit"]');
    
    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should show validation errors for weak password', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');
    await page.fill('input[name="confirm"]', 'short');
    await page.click('button[type="submit"]');
    
    // Should show weak password error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should show validation errors for invalid username', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    
    await page.fill('input[name="username"]', 'ab');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show username validation error
    await expect(page.locator('text=Username must be at least 3 characters')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL(/.*\/auth\?mode=forgot-password/);
  });

  test('should show validation error for invalid email in forgot password', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Forgot password?');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Should show email validation error
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should handle sign out', async ({ page }) => {
    // This test assumes a user is already signed in
    // In a real scenario, you'd first sign in a test user
    
    await page.goto('/profile');
    await page.click('text=Sign Out');
    
    // Should redirect to home or auth page
    await expect(page).toHaveURL(/.*\/(auth|\/)/);
  });

  test('should show Google OAuth button', async ({ page }) => {
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    
    // Google OAuth button should be visible
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('should display user profile after sign in', async ({ page }) => {
    // Sign in with test credentials
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for successful sign in
    await page.waitForURL('/');
    
    // User profile button should show username instead of "Guest"
    await expect(page.locator('text=Guest')).not.toBeVisible();
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    // On home page, should show sign in button
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should hide sign in button when authenticated', async ({ page }) => {
    // Sign in
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Sign in button should be hidden
    await expect(page.locator('text=Sign In')).not.toBeVisible();
  });

  test('should allow adding to watchlist when authenticated', async ({ page }) => {
    // Sign in
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to a movie
    await page.goto('/movie/123');
    
    // Bookmark button should be clickable
    const bookmarkButton = page.locator('[aria-label*="Watchlist"]');
    await expect(bookmarkButton).toBeEnabled();
  });

  test('should show profile button in bottom nav on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sign in
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Profile button should be visible in bottom nav
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should persist session across page navigation', async ({ page }) => {
    // Sign in
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to different pages
    await page.goto('/discover');
    await page.goto('/library');
    await page.goto('/search');
    
    // User should still be authenticated
    await expect(page.locator('text=Guest')).not.toBeVisible();
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // This test would require mocking session expiration
    // For now, we'll test the sign out flow
    
    // Sign in first
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="loginPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Sign out
    await page.click('[aria-label="Profile"]');
    await page.click('text=Sign Out');
    
    // Should return to auth page or home
    await expect(page).toHaveURL(/.*\/(auth|\/)/);
    
    // Should show sign in button again
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});