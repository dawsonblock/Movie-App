# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security Tests >> Iframe Security >> should have sandbox attribute on player iframe
- Location: e2e/security.spec.ts:208:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/movie/550/player", waiting until "load"

```

# Test source

```ts
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
  144 |       expect(alertHandled).toBe(false);
  145 |     });
  146 | 
  147 |     test('should handle special characters in URLs', async ({ page }) => {
  148 |       // Try to access a URL with special characters
  149 |       await page.goto('/movie/550?param=<script>alert(1)</script>');
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
> 209 |       await page.goto('/movie/550/player');
      |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
```