import { test, expect } from '@playwright/test';

test('take screenshot of new team menu with mock data', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  
  // Set localStorage mock save data to bypass intro and populate team
  await page.evaluate(() => {
    const saveData = {
      v: 1,
      ts: Date.now(),
      data: {
        party: [
          { uid: "uid1", id: "fox", name: "Fox", hp: 40, maxHp: 40, level: 8, bond: 25, atk: 12, def: 8, evolved: false },
          { uid: "uid2", id: "wolf", name: "Wolf", hp: 35, maxHp: 45, level: 6, bond: 15, atk: 14, def: 6, evolved: false },
          { uid: "uid3", id: "raccoon", name: "Raccoon", hp: 20, maxHp: 30, level: 4, bond: 5, atk: 8, def: 7, evolved: false },
          { uid: "uid4", id: "deer", name: "Deer", hp: 50, maxHp: 50, level: 9, bond: 40, atk: 9, def: 12, evolved: false }
        ],
        box: [],
        bag: { 'pokeball': 5, 'potion': 2 },
        coins: 150,
        xp: 20,
        flags: { intro_done: true },
        player: { name: "John", x: 64, y: 64, dir: "down", outfit: "red" }
      }
    };
    localStorage.setItem('wilddox_save_v1', JSON.stringify(saveData));
  });
  
  // Reload page to apply the save data
  await page.reload();
  await page.waitForTimeout(1000);
  
  // click anywhere to dismiss TAP TO ENTER
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);
  
  // Click "CONTINUE"
  const continueBtn = await page.getByText(/CONTINUE/i).first();
  if(continueBtn) {
     await continueBtn.click({ force: true });
     console.log('Clicked continue!');
  }
  
  await page.waitForTimeout(1000);
  
  // Click paws button
  const buttons = await page.$$('.nav-fab');
  for(const b of buttons) {
    const text = await b.textContent();
    if(text.includes('🐾')) {
      await b.click({ force: true });
      console.log('Clicked paws!');
    }
  }
  
  await page.waitForTimeout(1000);
  
  // Drag and drop test just to make sure it looks cool (optional, maybe not needed for screenshot but cool if it's mid-drag)
  // Let's just take the screenshot
  await page.screenshot({ path: 'team_screen_new.png' });
  console.log('Screenshot taken!');
});
