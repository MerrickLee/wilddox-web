# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pw3.test.js >> debug team menu properly
- Location: pw3.test.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText(/NEW GAME/i).first()
    - locator resolved to <button class="btn btn-gold">NEW GAME — JOHN</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fade-in">TAP TO ENTER</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fade-in">TAP TO ENTER</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    25 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fade-in">TAP TO ENTER</div> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5] [cursor=pointer]: TAP TO ENTER
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]: WILDDOX
      - generic [ref=e9]: Shadows of the Hunt
    - generic [ref=e11]:
      - button "NEW GAME — JOHN" [ref=e12] [cursor=pointer]
      - button "NEW GAME — MAISEY" [ref=e13] [cursor=pointer]
    - generic [ref=e14]: Capture. Bond. Evolve. Explore.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('debug team menu properly', async ({ page }) => {
  4  |   page.on('console', msg => console.log('LOG:', msg.text()));
  5  |   
  6  |   await page.goto('http://localhost:5173');
  7  |   await page.waitForTimeout(1000);
  8  |   
  9  |   // click "NEW GAME - JOHN"
  10 |   const startBtn = await page.getByText(/NEW GAME/i).first();
  11 |   if(startBtn) {
> 12 |      await startBtn.click();
     |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  13 |      console.log('Clicked start button!');
  14 |   }
  15 |   
  16 |   await page.waitForTimeout(1000);
  17 |   
  18 |   // skip dialogue
  19 |   for(let i=0; i<6; i++) {
  20 |     const btn = await page.$('.cs-btn');
  21 |     if(btn) await btn.click();
  22 |     await page.waitForTimeout(500);
  23 |     const starter = await page.$('.evo-btn'); // Fox
  24 |     if(starter) await starter.click();
  25 |     await page.waitForTimeout(500);
  26 |   }
  27 |   
  28 |   await page.waitForTimeout(2000);
  29 |   await page.screenshot({ path: 'screen1.png' });
  30 |   
  31 |   const buttons = await page.$$('.nav-fab');
  32 |   for(const b of buttons) {
  33 |     const text = await b.textContent();
  34 |     if(text.includes('🐾')) {
  35 |       await b.click();
  36 |       console.log('Clicked paws!');
  37 |     }
  38 |   }
  39 |   
  40 |   await page.waitForTimeout(1000);
  41 |   await page.screenshot({ path: 'screen2.png' });
  42 |   
  43 |   const closeBtn = await page.$('.back-btn');
  44 |   if(closeBtn) {
  45 |     await closeBtn.click();
  46 |     console.log('Clicked close!');
  47 |   } else {
  48 |     console.log('NO CLOSE BUTTON');
  49 |   }
  50 |   
  51 |   await page.waitForTimeout(1000);
  52 |   await page.screenshot({ path: 'screen3.png' });
  53 | });
  54 | 
```