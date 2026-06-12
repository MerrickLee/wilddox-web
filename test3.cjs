const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log("Clicking start overlay...");
  await page.mouse.click(100, 100);
  
  // Click through dialogues if any
  for(let i=0; i<5; i++){
    await new Promise(r => setTimeout(r, 1000));
    const btn = await page.$('.cs-btn');
    if(btn){
       console.log("Clicking dialog");
       await btn.click();
    } else {
       // Maybe a starter choice?
       const starter = await page.$('.evo-btn');
       if(starter){
           console.log("Clicking starter");
           await starter.click();
       }
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  console.log("Finding paws button...");
  const buttons = await page.$$('button');
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
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'team_screen.png'});
  
  console.log("Clicking close button...");
  const closeBtn = await page.$('.back-btn');
  if (closeBtn) {
    await closeBtn.click();
    console.log("Clicked Close button");
  } else {
    console.log("Close button not found");
  }
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'after_close.png'});
  
  await browser.close();
})();
