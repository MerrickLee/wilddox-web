# Wilddox: Shadows of the Hunt

Full 3D wildlife capture RPG — React + Three.js + Tone.js, built for Vercel.

## Features
- Real-time low-poly 3D open world (Northeast Forests region)
- Real movement: WASD / arrow keys on desktop, touch joystick on mobile
- Wild encounters triggered by walking through tall grass zones
- Turn-based battles with a dynamic swinging camera (lunge attacks, impact shake)
- Cage capture system with 3D throw arc + capture/break-free animations
- 12 hand-built 3D animals (fox, wolf, raccoon, deer, owl, beaver, bear, hawk, rabbit, otter, snake, Corrupted Deer)
- Evolution system (level + bond), Mark betrayal arc, Hunter encounters
- Team management, items/cages, US region map, scientists roster
- Procedural audio: ambient forest music, battle theme, full SFX (Tone.js)
- Auto-save to localStorage (works on Vercel)

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Push this folder to a GitHub repo
2. Go to vercel.com → Add New Project → import the repo
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`
4. Deploy — done. No environment variables needed.

## Controls
- **Desktop:** WASD / arrow keys to move
- **Mobile:** drag anywhere on the lower-left half of the screen for the joystick
- Walk into **tall grass patches** to trigger wild encounters
- Sound toggle: speaker button (top-right)

## Project structure
```
src/
  App.jsx          — game state machine + all UI overlays
  styles.css       — navy/gold UI theme
  game/
    engine.js      — Three.js world + battle scenes, movement, camera, animations
    models.js      — all low-poly 3D model builders (terrain, trees, animals, player)
    data.js        — animals, moves, story, cages, regions
    audio.js       — Tone.js music + SFX
```

## Tuning cheatsheet
- Movement speed: `engine.js` → `const speed = 7`
- Encounter rate: `engine.js` → `Math.random() < dt*.6`
- World size: `engine.js` → `WORLD_RADIUS`
- Animal stats/moves: `data.js`
- Colors/theme: `styles.css` `:root` variables
