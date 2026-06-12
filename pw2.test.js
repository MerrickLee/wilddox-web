import { test, expect } from '@playwright/test';

test('debug team menu', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // click start
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);
  
  // force state by exposing setPhase to window in App.jsx? We can't do that easily without modifying App.jsx.
  // Instead, let's just click the paws button if it exists.
  
  // skip dialogue
  for(let i=0; i<6; i++) {
    const btn = await page.$('.cs-btn');
    if(btn) await btn.click();
    await page.waitForTimeout(500);
    const starter = await page.$('.evo-btn'); // Fox
    if(starter) await starter.click();
    await page.waitForTimeout(500);
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screen1.png' });
  
  const buttons = await page.$$('.nav-fab');
  for(const b of buttons) {
    const text = await b.textContent();
    if(text.includes('🐾')) {
      await b.click();
      console.log('Clicked paws!');
    }
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screen2.png' });
  
  const closeBtn = await page.$('.back-btn');
  if(closeBtn) {
    await closeBtn.click();
    console.log('Clicked close!');
  } else {
    console.log('NO CLOSE BUTTON');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screen3.png' });
});
