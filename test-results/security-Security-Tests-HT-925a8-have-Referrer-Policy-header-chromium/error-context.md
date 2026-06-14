# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security Tests >> HTTP Security Headers >> should have Referrer-Policy header
- Location: e2e/security.spec.ts:321:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "CINE TMA" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e7]:
            - text: CINE
            - img [ref=e9]
            - text: TMA
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Search your favorite movies... CTRL+K" [ref=e14] [cursor=pointer]:
              - /url: /search
              - img [ref=e15]
              - generic [ref=e17]: Search your favorite movies...
              - generic [ref=e18]: CTRL+K
        - list [ref=e19]:
          - listitem [ref=e20]:
            - button [ref=e21] [cursor=pointer]:
              - img [ref=e22]
            - button "Guest" [ref=e25] [cursor=pointer]:
              - paragraph [ref=e26]: Guest
              - img [ref=e28]:
                - img [ref=e29]
    - generic [ref=e31]:
      - complementary [ref=e32]:
        - link "CINE TMA" [ref=e35] [cursor=pointer]:
          - /url: /
          - generic [ref=e36]:
            - text: CINE
            - img [ref=e38]
            - text: TMA
        - navigation [ref=e41]:
          - link "Home" [ref=e42] [cursor=pointer]:
            - /url: /
            - img [ref=e44]
            - generic [ref=e46]: Home
          - link "Discover" [ref=e47] [cursor=pointer]:
            - /url: /discover
            - img [ref=e49]
            - generic [ref=e52]: Discover
          - link "Search" [ref=e53] [cursor=pointer]:
            - /url: /search
            - img [ref=e55]
            - generic [ref=e57]: Search
          - link "Library" [ref=e58] [cursor=pointer]:
            - /url: /library
            - img [ref=e60]
            - generic [ref=e62]: Library
          - link "About" [ref=e63] [cursor=pointer]:
            - /url: /about
            - img [ref=e65]
            - generic [ref=e69]: About
      - main [ref=e71]:
        - generic "Content Type Selection" [ref=e74]:
          - tablist "Content Type Selection" [ref=e75]:
            - tab "Movies" [selected] [ref=e76] [cursor=pointer]:
              - generic [ref=e78]:
                - img [ref=e79]
                - generic [ref=e82]: Movies
            - tab "TV Series" [ref=e83] [cursor=pointer]:
              - generic [ref=e85]:
                - img [ref=e86]
                - generic [ref=e88]: TV Series
  - button "Open Next.js Dev Tools" [ref=e113] [cursor=pointer]:
    - generic [ref=e116]:
      - text: Compiling
      - generic [ref=e117]:
        - generic [ref=e118]: .
        - generic [ref=e119]: .
        - generic [ref=e120]: .
```

# Test source

```ts
  222 |       expect(sandbox).not.toContain('allow-top-navigation');
  223 |       expect(sandbox).not.toContain('allow-modals');
  224 |     });
  225 | 
  226 |     test('should only allow whitelisted domains in iframe', async ({ page }) => {
  227 |       await page.goto('/movie/550/player');
  228 |       
  229 |       await page.waitForSelector('iframe', { timeout: 10000 });
  230 |       
  231 |       const iframeSrc = await page.locator('iframe').getAttribute('src');
  232 |       
  233 |       // Should be from allowed domain
  234 |       const allowedDomains = [
  235 |         'vidlink.pro',
  236 |         'vidking.net',
  237 |         'filmku.stream',
  238 |         'youtube.com',
  239 |         'vimeo.com'
  240 |       ];
  241 |       
  242 |       const isAllowed = allowedDomains.some(domain => 
  243 |         iframeSrc?.includes(domain)
  244 |       );
  245 |       
  246 |       expect(isAllowed).toBe(true);
  247 |     });
  248 | 
  249 |     test('should prevent iframe from accessing parent window', async ({ page }) => {
  250 |       await page.goto('/movie/550/player');
  251 |       
  252 |       await page.waitForSelector('iframe', { timeout: 10000 });
  253 |       
  254 |       // Verify cross-origin restrictions
  255 |       const canAccessParent = await page.evaluate(() => {
  256 |         try {
  257 |           const iframe = document.querySelector('iframe');
  258 |           if (!iframe) return false;
  259 |           
  260 |           // Try to access iframe content (should fail due to cross-origin)
  261 |           const iframeWindow = (iframe as any).contentWindow;
  262 |           return iframeWindow !== undefined;
  263 |         } catch (e) {
  264 |           // Expected to fail due to cross-origin restrictions
  265 |           return false;
  266 |         }
  267 |       });
  268 |       
  269 |       // This should be false due to cross-origin restrictions
  270 |       expect(canAccessParent).toBe(false);
  271 |     });
  272 |   });
  273 | 
  274 |   test.describe('Open Redirect Prevention', () => {
  275 |     test('should prevent open redirect via next parameter', async ({ page }) => {
  276 |       // Try to redirect to external site via next parameter
  277 |       await page.goto('/auth/callback?next=https://evil.com');
  278 |       
  279 |       // Should not redirect to external site
  280 |       await page.waitForTimeout(2000);
  281 |       
  282 |       expect(page.url()).not.toContain('evil.com');
  283 |     });
  284 | 
  285 |     test('should sanitize redirect URLs', async ({ page }) => {
  286 |       // Try various redirect attempts
  287 |       const maliciousUrls = [
  288 |         '//evil.com',
  289 |         '///evil.com',
  290 |         'https://evil.com',
  291 |         'http://evil.com',
  292 |       ];
  293 |       
  294 |       for (const url of maliciousUrls) {
  295 |         await page.goto(`/auth/callback?next=${encodeURIComponent(url)}`);
  296 |         await page.waitForTimeout(1000);
  297 |         
  298 |         expect(page.url()).not.toContain('evil.com');
  299 |       }
  300 |     });
  301 |   });
  302 | 
  303 |   test.describe('HTTP Security Headers', () => {
  304 |     test('should have X-Frame-Options header', async ({ page }) => {
  305 |       const response = await page.goto('/');
  306 |       const frameOptions = await response.headerValue('X-Frame-Options');
  307 |       
  308 |       // Should be DENY or SAMEORIGIN
  309 |       if (frameOptions) {
  310 |         expect(['DENY', 'SAMEORIGIN']).toContain(frameOptions);
  311 |       }
  312 |     });
  313 | 
  314 |     test('should have X-Content-Type-Options header', async ({ page }) => {
  315 |       const response = await page.goto('/');
  316 |       const contentTypeOptions = await response.headerValue('X-Content-Type-Options');
  317 |       
  318 |       expect(contentTypeOptions).toBe('nosniff');
  319 |     });
  320 | 
  321 |     test('should have Referrer-Policy header', async ({ page }) => {
> 322 |       const response = await page.goto('/');
      |                                   ^ Error: page.goto: Test timeout of 30000ms exceeded.
  323 |       const referrerPolicy = await response.headerValue('Referrer-Policy');
  324 |       
  325 |       expect(referrerPolicy).toBeDefined();
  326 |     });
  327 |   });
  328 | 
  329 |   test.describe('Error Handling Security', () => {
  330 |     test('should not expose stack traces in error pages', async ({ page }) => {
  331 |       // Navigate to a page that might error
  332 |       await page.goto('/movie/999999999');
  333 |       
  334 |       await page.waitForTimeout(2000);
  335 |       
  336 |       const pageContent = await page.content();
  337 |       
  338 |       // Should not contain stack trace information
  339 |       expect(pageContent).not.toContain('stack trace');
  340 |       expect(pageContent).not.toContain('internal error');
  341 |       expect(pageContent).not.toContain('node_modules');
  342 |     });
  343 | 
  344 |     test('should handle 404 errors gracefully', async ({ page }) => {
  345 |       await page.goto('/non-existent-page');
  346 |       
  347 |       // Should show custom 404 page or redirect
  348 |       await page.waitForTimeout(2000);
  349 |       
  350 |       const pageContent = await page.content();
  351 |       expect(pageContent.length).toBeGreaterThan(0);
  352 |     });
  353 | 
  354 |     test('should handle 500 errors gracefully', async ({ page }) => {
  355 |       // This would require triggering a server error
  356 |       // For now, we'll verify error handling structure
  357 |       
  358 |       await page.goto('/');
  359 |       
  360 |       const hasErrorHandling = await page.evaluate(() => {
  361 |         return typeof window.onerror === 'function' || 
  362 |                typeof window.addEventListener === 'function';
  363 |       });
  364 |       
  365 |       expect(hasErrorHandling).toBe(true);
  366 |     });
  367 |   });
  368 | });
```