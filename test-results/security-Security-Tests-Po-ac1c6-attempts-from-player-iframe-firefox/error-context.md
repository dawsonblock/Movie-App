# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security Tests >> Popup Blocking >> should block popup attempts from player iframe
- Location: e2e/security.spec.ts:38:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/movie/550/player", waiting until "load"

```

# Page snapshot

```yaml
- main [ref=e5]:
  - generic "Loading" [ref=e6]:
    - img [ref=e7]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Security Tests', () => {
  4   |   test.describe('Popup Blocking', () => {
  5   |     test('should block popup attempts from hostile iframe container', async ({ page, context }) => {
  6   |       // Track popup events
  7   |       const popupPromise = context.waitForEvent('popup', { timeout: 10000 }).catch(() => null);
  8   |       
  9   |       // Track download events
  10  |       const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  11  |       
  12  |       // Navigate to hostile iframe container
  13  |       await page.goto('/test-hostile-iframe-container.html');
  14  |       
  15  |       // Wait for the page to load and execute hostile attempts
  16  |       await page.waitForTimeout(10000);
  17  |       
  18  |       // Verify no popup was opened
  19  |       const popup = await popupPromise;
  20  |       expect(popup).toBeNull();
  21  |       
  22  |       // Verify no download was triggered
  23  |       const download = await downloadPromise;
  24  |       expect(download).toBeNull();
  25  |       
  26  |       // Verify we're still on the container page (navigation blocked)
  27  |       expect(page.url()).toContain('/test-hostile-iframe-container.html');
  28  |       
  29  |       // Check that security events were logged
  30  |       const securityEventsCount = await page.locator('#security-events li').count();
  31  |       expect(securityEventsCount).toBeGreaterThan(0);
  32  |       
  33  |       // Verify that blocked events are shown
  34  |       const hasBlockedEvents = await page.locator('#security-events li').filter({ hasText: 'blocked' }).count();
  35  |       expect(hasBlockedEvents).toBeGreaterThan(0);
  36  |     });
  37  | 
  38  |     test('should block popup attempts from player iframe', async ({ page, context }) => {
  39  |       // Track popup events
  40  |       const popupPromise = context.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  41  |       
  42  |       // Navigate to player page
> 43  |       await page.goto('/movie/550/player');
      |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  44  |       
  45  |       // Wait for player to load
  46  |       await page.waitForSelector('iframe', { timeout: 10000 });
  47  |       
  48  |       // Try to trigger popup (this would normally be done by the iframe content)
  49  |       // Since we can't control iframe content directly, we verify the blocking mechanisms
  50  |       
  51  |       // Check that window.open handler is set
  52  |       const hasPopupBlocker = await page.evaluate(() => {
  53  |         return typeof window.open === 'function';
  54  |       });
  55  |       
  56  |       expect(hasPopupBlocker).toBe(true);
  57  |       
  58  |       // Verify no popup was opened
  59  |       const popup = await popupPromise;
  60  |       expect(popup).toBeNull();
  61  |     });
  62  | 
  63  |     test('should block top-level navigation away from app', async ({ page }) => {
  64  |       await page.goto('/movie/550/player');
  65  |       
  66  |       // Wait for player to load
  67  |       await page.waitForSelector('iframe', { timeout: 10000 });
  68  |       
  69  |       // Monitor navigation events
  70  |       let navigationBlocked = false;
  71  |       page.on('framenavigated', (frame) => {
  72  |         if (frame.url().startsWith('http')) {
  73  |           navigationBlocked = true;
  74  |         }
  75  |       });
  76  |       
  77  |       // Wait to ensure no unexpected navigation
  78  |       await page.waitForTimeout(3000);
  79  |       
  80  |       // Verify we're still on the player page
  81  |       expect(page.url()).toContain('/player');
  82  |       expect(navigationBlocked).toBe(false);
  83  |     });
  84  | 
  85  |     test('should block forced downloads', async ({ page, context }) => {
  86  |       // Track download events
  87  |       const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  88  |       
  89  |       await page.goto('/movie/550/player');
  90  |       
  91  |       // Wait for player to load
  92  |       await page.waitForSelector('iframe', { timeout: 10000 });
  93  |       
  94  |       // Verify no download was triggered
  95  |       const download = await downloadPromise;
  96  |       expect(download).toBeNull();
  97  |     });
  98  |   });
  99  | 
  100 |   test.describe('Content Security Policy', () => {
  101 |     test('should have CSP headers', async ({ page }) => {
  102 |       const response = await page.goto('/');
  103 |       const cspHeader = await response.headerValue('Content-Security-Policy');
  104 |       
  105 |       expect(cspHeader).toBeDefined();
  106 |       expect(cspHeader).toContain('default-src');
  107 |       expect(cspHeader).toContain('script-src');
  108 |       expect(cspHeader).toContain('style-src');
  109 |     });
  110 | 
  111 |     test('should not allow unsafe-eval in script-src', async ({ page }) => {
  112 |       const response = await page.goto('/');
  113 |       const cspHeader = await response.headerValue('Content-Security-Policy');
  114 |       
  115 |       expect(cspHeader).toBeDefined();
  116 |       expect(cspHeader).not.toContain('unsafe-eval');
  117 |     });
  118 | 
  119 |     test('should restrict frame sources to allowed domains', async ({ page }) => {
  120 |       const response = await page.goto('/movie/550/player');
  121 |       const cspHeader = await response.headerValue('Content-Security-Policy');
  122 |       
  123 |       expect(cspHeader).toBeDefined();
  124 |       expect(cspHeader).toContain('frame-src');
  125 |     });
  126 |   });
  127 | 
  128 |   test.describe('Input Validation', () => {
  129 |     test('should sanitize user input in search', async ({ page }) => {
  130 |       await page.goto('/');
  131 |       
  132 |       // Try to inject script via search
  133 |       await page.fill('[data-testid="search-input"]', '<script>alert("XSS")</script>');
  134 |       await page.press('[data-testid="search-input"]', 'Enter');
  135 |       
  136 |       // Wait for search results
  137 |       await page.waitForTimeout(2000);
  138 |       
  139 |       // Verify no alert was triggered (XSS prevented)
  140 |       const alertHandled = await page.evaluate(() => {
  141 |         return window.alertTriggered === true;
  142 |       });
  143 |       
```