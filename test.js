import puppeteer from 'puppeteer';
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('wilddox_save', JSON.stringify({
        player: { name: 'Test', emoji: '🧑' },
        party: [
          { id: 'wolf', name: 'Wolf', hp: 58, maxHp: 58, level: 1, bond: 0, moves: [] }
        ],
        coins: 100, xp: 0, level: 1, cages: [], flags: {}
      }));
    });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.toLowerCase().includes('continue')) { await btn.click(); break; }
    }
    await delay(2000);
    const gBtns = await page.$$('button');
    for (let btn of gBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('🐾')) { await btn.click(); break; }
    }
    await delay(1000);
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Saved screenshot.png');
  } catch (err) { console.error('Script Error:', err); } finally { await browser.close(); }
})();
