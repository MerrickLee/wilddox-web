import { test, expect } from '@playwright/test';

test('take screenshot of new team menu', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // click anywhere to dismiss TAP TO ENTER
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);
  
  // click "NEW GAME - JOHN"
  const startBtn = await page.getByText(/NEW GAME — JOHN/i).first();
  if(startBtn) {
     await startBtn.click();
     console.log('Clicked start button!');
  } else {
     console.log('Could not find start button!');
  }
  
  await page.waitForTimeout(1000);
  
  // click through dialogue rapidly
  for(let i=0; i<10; i++) {
    await page.mouse.click(100, 100); // Click the screen to advance text
    await page.waitForTimeout(200);
  }
  
  // Try to click the starter fox explicitly if it appears
  const starter = await page.getByText('🦊').first();
  if(starter) {
    await starter.click();
    console.log('Clicked starter');
  }
  
  await page.waitForTimeout(500);
  const chooseBtn = await page.getByText(/CHOOSE FOX/i).first();
  if (chooseBtn) await chooseBtn.click();
  
  await page.waitForTimeout(1000);
  
  // More clicking to skip post-starter dialogue
  for(let i=0; i<10; i++) {
    await page.mouse.click(100, 100);
    await page.waitForTimeout(200);
  }
  
  await page.waitForTimeout(2000);
  
  // Click paws button
  const buttons = await page.$$('.nav-fab');
  for(const b of buttons) {
    const text = await b.textContent();
    if(text.includes('🐾')) {
      await b.click();
      console.log('Clicked paws!');
    }
  }
  
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: 'team_screen_new.png' });
  console.log('Screenshot taken!');
});
