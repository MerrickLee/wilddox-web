import { test, expect } from '@playwright/test';

test('debug team menu properly', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // click "NEW GAME - JOHN"
  const startBtn = await page.getByText(/NEW GAME/i).first();
  if(startBtn) {
     await startBtn.click();
     console.log('Clicked start button!');
  }
  
  await page.waitForTimeout(1000);
  
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
