import { test, expect } from '@playwright/test';

test.describe('Wilddox Onboarding and Analytics', () => {

  test('New visitor sees PLAY WILDDOX and not CONTINUE', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for the title screen buttons
    await page.waitForSelector('text=PLAY WILDDOX');
    const playBtn = await page.$('text=PLAY WILDDOX');
    expect(playBtn).toBeTruthy();

    const continueBtn = await page.$('text=CONTINUE');
    expect(continueBtn).toBeNull();
  });

  test('Character selection advances correctly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Click Play
    await page.click('text=PLAY WILDDOX');
    
    // Wait for character selection screen
    await page.waitForSelector('text=CHOOSE CHARACTER');
    
    // Select John
    await page.click('text=👦🏽');
    
    // Click Confirm
    await page.click('text=CONFIRM');
    
    // Should proceed to starter screen / cutscene
    await page.waitForSelector('.cs-em');
  });

  test('Localhost does not send GA tracking to production', async ({ page }) => {
    // Intercept all network requests to google-analytics or googletagmanager
    let gaRequestSent = false;
    page.on('request', request => {
      if (request.url().includes('google-analytics.com/g/collect')) {
        gaRequestSent = true;
      }
    });

    await page.goto('http://localhost:5173');
    
    // Wait a bit to see if anything fires
    await page.waitForTimeout(2000);
    
    // We expect no GA requests on localhost
    expect(gaRequestSent).toBe(false);

  });
});
