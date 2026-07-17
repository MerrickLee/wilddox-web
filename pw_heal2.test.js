import { test, expect } from '@playwright/test';

test('test heal team button', async ({ page }) => {
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  
  // Set localStorage with some injured animals
  await page.evaluate(() => {
    const saveData = {
      player: { name: "John", x: 64, y: 64, dir: "down", outfit: "red" },
      party: [
        { uid: "uid1", id: "fox", name: "Fox", hp: 10, maxHp: 40, level: 8, bond: 25, atk: 12, def: 8, evolved: false },
        { uid: "uid2", id: "wolf", name: "Wolf", hp: 35, maxHp: 45, level: 6, bond: 15, atk: 14, def: 6, evolved: false }
      ],
      coins: 150,
      xp: 20,
      level: 1,
      cages: { 'basic': 5 },
      flags: { intro_done: true },
      questIdx: 0
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
  
  // Look for Heal button
  const healBtn = page.getByText(/Heal \(/i).first();
  if (await healBtn.count() > 0) {
    console.log('Heal button found!');
    await healBtn.click({ force: true });
    console.log('Clicked Heal Button!');
  } else {
    console.log('Heal button not found!');
  }
  
  await page.waitForTimeout(1000);
  console.log('Test finished!');
});
