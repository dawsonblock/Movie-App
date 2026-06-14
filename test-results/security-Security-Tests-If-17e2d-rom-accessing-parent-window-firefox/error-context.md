# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security Tests >> Iframe Security >> should prevent iframe from accessing parent window
- Location: e2e/security.spec.ts:249:5

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
  150 |       
  151 |       // Should not execute the script
  152 |       const alertHandled = await page.evaluate(() => {
  153 |         return window.alertTriggered === true;
  154 |       });
  155 |       
  156 |       expect(alertHandled).toBe(false);
  157 |     });
  158 | 
  159 |     test('should validate mediaId parameter', async ({ page }) => {
  160 |       // Try to access with invalid mediaId
  161 |       await page.goto('/movie/invalid/player');
  162 |       
  163 |       // Should show error or redirect
  164 |       await page.waitForTimeout(2000);
  165 |       
  166 |       // Should not crash or show blank page
  167 |       const pageContent = await page.content();
  168 |       expect(pageContent.length).toBeGreaterThan(0);
  169 |     });
  170 |   });
  171 | 
  172 |   test.describe('Authentication Security', () => {
  173 |     test('should protect authenticated routes', async ({ page }) => {
  174 |       // Try to access protected route without authentication
  175 |       await page.goto('/profile');
  176 |       
  177 |       // Should redirect to auth page
  178 |       await expect(page).toHaveURL(/.*\/auth/);
  179 |     });
  180 | 
  181 |     test('should not expose sensitive data in localStorage', async ({ page }) => {
  182 |       await page.goto('/');
  183 |       
  184 |       const localStorageData = await page.evaluate(() => {
  185 |         return JSON.stringify(localStorage);
  186 |       });
  187 |       
  188 |       // Should not contain passwords or tokens
  189 |       expect(localStorageData).not.toContain('password');
  190 |       expect(localStorageData).not.toContain('token');
  191 |     });
  192 | 
  193 |     test('should handle session timeout', async ({ page }) => {
  194 |       // This test would require mocking session expiration
  195 |       // For now, we'll verify the session management structure exists
  196 |       
  197 |       await page.goto('/');
  198 |       
  199 |       const hasSessionManagement = await page.evaluate(() => {
  200 |         return typeof localStorage.getItem === 'function';
  201 |       });
  202 |       
  203 |       expect(hasSessionManagement).toBe(true);
  204 |     });
  205 |   });
  206 | 
  207 |   test.describe('Iframe Security', () => {
  208 |     test('should have sandbox attribute on player iframe', async ({ page }) => {
  209 |       await page.goto('/movie/550/player');
  210 |       
  211 |       await page.waitForSelector('iframe', { timeout: 10000 });
  212 |       
  213 |       const sandbox = await page.locator('iframe').getAttribute('sandbox');
  214 |       
  215 |       expect(sandbox).toContain('allow-scripts');
  216 |       expect(sandbox).toContain('allow-same-origin');
  217 |       expect(sandbox).toContain('allow-forms');
  218 |       expect(sandbox).toContain('allow-presentation');
  219 |       
  220 |       // Verify dangerous permissions are not present
  221 |       expect(sandbox).not.toContain('allow-popups');
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
> 250 |       await page.goto('/movie/550/player');
      |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  322 |       const response = await page.goto('/');
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
```