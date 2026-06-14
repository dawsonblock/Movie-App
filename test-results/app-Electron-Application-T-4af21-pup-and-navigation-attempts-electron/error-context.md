# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Electron Application Tests >> should block hostile iframe popup and navigation attempts
- Location: e2e/electron/app.spec.ts:185:3

# Error details

```
ReferenceError: require is not defined
```

```
TypeError: Cannot read properties of undefined (reading 'close')
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { ElectronApplication, _electron as electron } from 'playwright';
  3   | 
  4   | test.describe('Electron Application Tests', () => {
  5   |   let electronApp: ElectronApplication;
  6   | 
  7   |   test.beforeAll(async () => {
  8   |     electronApp = await electron.launch({
  9   |       args: ['.'],
  10  |       // Use the electron package directly - Playwright will resolve it
  11  |       executablePath: require.resolve('electron'),
  12  |     });
  13  |   });
  14  | 
  15  |   test.afterAll(async () => {
> 16  |     await electronApp.close();
      |                       ^ TypeError: Cannot read properties of undefined (reading 'close')
  17  |   });
  18  | 
  19  |   test('should launch application', async () => {
  20  |     const window = await electronApp.firstWindow();
  21  |     await window.waitForLoadState('domcontentloaded');
  22  |     
  23  |     expect(await window.title()).toBeTruthy();
  24  |   });
  25  | 
  26  |   test('should have window controls', async () => {
  27  |     const window = await electronApp.firstWindow();
  28  |     
  29  |     // Check for macOS window controls (traffic lights)
  30  |     const hasWindowControls = await window.locator('body').evaluate(() => {
  31  |       // This would check for window control buttons
  32  |       return true; // Placeholder
  33  |     });
  34  |     
  35  |     expect(hasWindowControls).toBe(true);
  36  |   });
  37  | 
  38  |   test('should handle window resizing', async () => {
  39  |     const window = await electronApp.firstWindow();
  40  |     
  41  |     const initialBounds = await window.bounds();
  42  |     
  43  |     // Resize window
  44  |     await window.setSize({ width: 1200, height: 800 });
  45  |     
  46  |     const newBounds = await window.bounds();
  47  |     
  48  |     expect(newBounds.width).toBe(1200);
  49  |     expect(newBounds.height).toBe(800);
  50  |   });
  51  | 
  52  |   test('should handle window minimization', async () => {
  53  |     const window = await electronApp.firstWindow();
  54  |     
  55  |     await window.minimize();
  56  |     
  57  |     // Wait a moment
  58  |     await window.waitForTimeout(1000);
  59  |     
  60  |     // Restore
  61  |     await window.restore();
  62  |     
  63  |     const isVisible = await window.isVisible();
  64  |     expect(isVisible).toBe(true);
  65  |   });
  66  | 
  67  |   test('should handle window maximization', async () => {
  68  |     const window = await electronApp.firstWindow();
  69  |     
  70  |     await window.maximize();
  71  |     
  72  |     const bounds = await window.bounds();
  73  |     
  74  |     // Window should be maximized (bounds will vary by screen)
  75  |     expect(bounds.width).toBeGreaterThan(0);
  76  |     expect(bounds.height).toBeGreaterThan(0);
  77  |   });
  78  | 
  79  |   test('should handle fullscreen', async () => {
  80  |     const window = await electronApp.firstWindow();
  81  |     
  82  |     await window.evaluate(() => {
  83  |       document.documentElement.requestFullscreen();
  84  |     });
  85  |     
  86  |     await window.waitForTimeout(1000);
  87  |     
  88  |     // Exit fullscreen
  89  |     await window.evaluate(() => {
  90  |       document.exitFullscreen();
  91  |     });
  92  |   });
  93  | 
  94  |   test('should handle keyboard shortcuts', async ({ page }) => {
  95  |     const window = await electronApp.firstWindow();
  96  |     
  97  |     // Test common shortcuts
  98  |     await window.keyboard.press('Meta+f'); // Cmd+F on Mac
  99  |     
  100 |     // Should trigger search or focus
  101 |     await window.waitForTimeout(500);
  102 |   });
  103 | 
  104 |   test('should handle menu bar interactions', async () => {
  105 |     const window = await electronApp.firstWindow();
  106 |     
  107 |     // This would test menu bar functionality
  108 |     // Electron apps typically have custom menu bars
  109 |     
  110 |     const hasMenuBar = await window.locator('body').evaluate(() => {
  111 |       // Check for menu bar elements
  112 |       return true; // Placeholder
  113 |     });
  114 |     
  115 |     expect(hasMenuBar).toBe(true);
  116 |   });
```