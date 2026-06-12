import { test, expect } from '@playwright/test';
// Simple playwright test to verify team menu opens and closes without error

test('team menu opens and closes', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  
  // click start
  await page.waitForTimeout(2000);
  await page.mouse.click(100, 100);
  
  // wait for first dialogue
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    // Force skip all cutscenes/evo
    const reactRoot = document.getElementById('root')._reactRootContainer;
    // Just hack the state or we can just click through
  });
  
  // click through
  for(let i=0; i<6; i++) {
    const btn = await page.$('.cs-btn');
    if(btn) await btn.click();
    await page.waitForTimeout(500);
    const starter = await page.$('.evo-btn'); // Fox
    if(starter) await starter.click();
    await page.waitForTimeout(500);
  }
  
  await page.waitForTimeout(2000);
  console.log('Trying to open team menu...');
  // Find paws
  const buttons = await page.$$('.nav-fab');
  for(const b of buttons) {
    const text = await b.textContent();
    if(text.includes('🐾')) {
      await b.click();
      console.log('Clicked paws');
    }
  }
  
  await page.waitForTimeout(1000);
  const closeBtn = await page.$('.back-btn');
  if(closeBtn) {
    console.log('Found close btn, clicking...');
    await closeBtn.click();
    console.log('Clicked close btn.');
  } else {
    console.log('No close btn found!');
  }
  
  await page.waitForTimeout(1000);
  const title = await page.$('.menu-title');
  if(title) {
     console.log('Still on team menu.');
  } else {
     console.log('Successfully closed team menu.');
  }
});
