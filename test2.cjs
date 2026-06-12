const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  
  // Wait for the game to initialize and the "Click anywhere" overlay
  await new Promise(r => setTimeout(r, 2000));
  console.log("Clicking to start...");
  await page.mouse.click(100, 100);
  
  // Wait for world UI
  await new Promise(r => setTimeout(r, 2000));
  
  // Find the Paws button
  console.log("Clicking Paws button...");
  const buttons = await page.$$('button.hud-btn');
  let pawsBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('🐾')) {
      pawsBtn = btn;
      break;
    }
  }
  
  if (pawsBtn) {
    await pawsBtn.click();
    console.log("Clicked Paws.");
  } else {
    console.log("Paws button not found");
  }
  
  // Wait for team menu
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'team_screen.png'});
  
  // Try to click the Close button
  console.log("Clicking close button...");
  const closeBtn = await page.$('.back-btn');
  if (closeBtn) {
    await closeBtn.click();
    console.log("Clicked Close button");
  } else {
    console.log("Close button not found");
  }
  
  // Wait to see if phase changes
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'after_close.png'});
  
  await browser.close();
})();
