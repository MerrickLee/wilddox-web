/* ── WILDDOX 3D MODEL BUILDERS (low-poly) ── */
import * as THREE from 'three'

export const mat = (color, rough=.95, opts={}) =>
  new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:0, flatShading:true, ...opts })

/* terrain height function — shared so engine can sample ground height */
export function terrainH(x, z){
  return Math.sin(x*.08)*Math.cos(z*.07)*1.4
       + Math.sin(x*.23+1.7)*Math.cos(z*.19)*0.5
}

export function buildTerrain(size=140, seg=64){
  const geo = new THREE.PlaneGeometry(size, size, seg, seg)
  const pos = geo.attributes.position
  for(let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i)
    pos.setZ(i, terrainH(x, -y))
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(0x4A8A30, 1))
  m.rotation.x = -Math.PI/2
  m.receiveShadow = true
  return m
}

export function pine(scale=1){
  const g = new THREE.Group()
  const trunkH = 1.1*scale
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13*scale,.18*scale,trunkH,5), mat(0x5A3A18))
  trunk.position.y = trunkH/2; trunk.castShadow = true; g.add(trunk)
  const greens = [0x2A6E2A,0x358030,0x1E5A20,0x3A8A38]
  const col = greens[Math.floor(Math.random()*greens.length)]
  let y = trunkH*.8
  const tiers = 2+Math.floor(Math.random()*2)
  for(let i=0;i<tiers;i++){
    const r=(1.15-i*.3)*scale, h=(1.5-i*.2)*scale
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r,h,6), mat(col))
    cone.position.y = y+h/2; cone.castShadow = true; cone.receiveShadow = true
    cone.rotation.y = Math.random()*Math.PI
    g.add(cone); y += h*.55
  }
  g.rotation.y = Math.random()*Math.PI*2
  g.scale.setScalar(.85+Math.random()*.4)
  return g
}

export function mountain(w,h,color=0x3A5278){
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.ConeGeometry(w,h,5), mat(color,1))
  body.position.y = h/2; g.add(body)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(w*.34,h*.3,5), mat(0xE8F0FA,.8))
  cap.position.y = h-((h*.3)/2); g.add(cap)
  g.rotation.y = Math.random()*Math.PI
  return g
}

export function rock(s=1){
  const r = new THREE.Mesh(new THREE.IcosahedronGeometry(s,0), mat(0x6A7280,1))
  r.scale.y = .6+Math.random()*.3
  r.rotation.set(Math.random(),Math.random(),Math.random())
  r.castShadow = true; r.receiveShadow = true
  return r
}

export function flowers(n=6){
  const g = new THREE.Group()
  const cols = [0xF0D040,0xE06080,0xF8F8F0,0x9060D0]
  for(let i=0;i<n;i++){
    const f = new THREE.Mesh(new THREE.SphereGeometry(.06,4,3), mat(cols[i%cols.length],.7))
    f.position.set((Math.random()-.5)*1.2,.12,(Math.random()-.5)*1.2)
    g.add(f)
  }
  return g
}

export function grassTuft(){
  const g = new THREE.Group()
  for(let i=0;i<3;i++){
    const b = new THREE.Mesh(new THREE.ConeGeometry(.08,.55+Math.random()*.3,4), mat(0x5AA838,.9))
    b.position.set((Math.random()-.5)*.4,.27,(Math.random()-.5)*.4)
    b.rotation.z = (Math.random()-.5)*.3
    g.add(b)
  }
  return g
}

export function cloud(){
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color:0xFFFFFF, roughness:1, flatShading:true })
  const n = 2+Math.floor(Math.random()*3)
  for(let i=0;i<n;i++){
    const s = new THREE.Mesh(new THREE.SphereGeometry(.8+Math.random()*.7,6,4), m)
    s.position.set(i*1.1-(n*.5), Math.random()*.3, 0)
    s.scale.y = .55; g.add(s)
  }
  return g
}

/* ── EXPLORER (player character) ── */
export function explorer({ jacket=0x9A3A20, pants=0x3A4858, skin=0xC89060, pack=0x6A5230, hair=0x2A1A0E }={}){
  const g = new THREE.Group()
  const legs = []
  ;[-1,1].forEach(s=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.85,5), mat(pants,.95))
    leg.position.set(0,.43,.14*s); leg.castShadow = true
    leg.userData.side = s
    g.add(leg); legs.push(leg)
  })
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.3,.26,.9,6), mat(jacket,.9))
  torso.position.y = 1.3; torso.castShadow = true; g.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(.24,6,5), mat(skin,.85))
  head.position.y = 1.98; head.castShadow = true; g.add(head)
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(.25,6,4,0,Math.PI*2,0,Math.PI/2), mat(hair,.95))
  hairM.position.y = 2.03; g.add(hairM)
  const arms = []
  ;[-1,1].forEach(s=>{
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.08,.07,.7,5), mat(jacket,.9))
    arm.position.set(0,1.34,.36*s); arm.rotation.x = .12*s; arm.castShadow = true
    arm.userData.side = s
    g.add(arm); arms.push(arm)
  })
  const bp = new THREE.Mesh(new THREE.BoxGeometry(.22,.5,.4), mat(pack,.95))
  bp.position.set(-.3,1.38,0); bp.castShadow = true; g.add(bp)
  g.userData = { legs, arms }
  return g
}

/* ── GENERIC QUADRUPED ── */
export function quadruped({ body=0xC8651A, belly=0xF0E0C8, ears=true, earLen=.3, tailLen=1, bulk=1, headScale=1, legLen=.85, lowSlung=false }={}){
  const g = new THREE.Group()
  const bm = mat(body,.9)
  const baseY = lowSlung ? .55 : .85
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.42*bulk,.5*bulk,1.5,6), bm)
  torso.rotation.z = Math.PI/2; torso.position.y = baseY; torso.castShadow = true
  g.add(torso)
  const chest = new THREE.Mesh(new THREE.SphereGeometry(.5*bulk,6,5), bm)
  chest.position.set(.65,baseY+.05,0); chest.castShadow = true; g.add(chest)
  const head = new THREE.Group()
  const skull = new THREE.Mesh(new THREE.BoxGeometry(.55,.5,.5), bm)
  skull.castShadow = true; head.add(skull)
  const snout = new THREE.Mesh(new THREE.BoxGeometry(.3,.26,.3), mat(belly,.85))
  snout.position.set(.38,-.07,0); head.add(snout)
  const nose = new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.12), mat(0x202020,.6))
  nose.position.set(.55,-.04,0); head.add(nose)
  ;[-1,1].forEach(s=>{
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.055,5,4), mat(0x141414,.4))
    eye.position.set(.22,.1,.21*s); head.add(eye)
  })
  if(ears){
    ;[-1,1].forEach(s=>{
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.12,earLen,4), bm)
      ear.position.set(-.08,.34,.18*s); ear.rotation.z = -.15; head.add(ear)
    })
  }
  head.scale.setScalar(headScale)
  head.position.set(1.15, baseY+.47, 0)
  g.add(head); g.userData.head = head
  const legPos = [[.55,.28],[.55,-.28],[-.55,.28],[-.55,-.28]]
  const legs = []
  legPos.forEach(([x,z])=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,legLen,5), bm)
    leg.position.set(x, legLen/2, z); leg.castShadow = true; g.add(leg); legs.push(leg)
  })
  g.userData.legs = legs
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.16,1*tailLen,5), bm)
  tail.position.set(-.95,baseY+.2,0); tail.rotation.z = Math.PI/2.4
  tail.castShadow = true; g.add(tail); g.userData.tail = tail
  const bel = new THREE.Mesh(new THREE.SphereGeometry(.36*bulk,6,5), mat(belly,.9))
  bel.position.set(.1,baseY-.23,0); g.add(bel)
  return g
}

/* ── BIRD (owl / hawk) ── */
export function bird({ body=0x8A6E48, belly=0xD8C8A0, wing=0x6A5238, beak=0xE8B030, big=false }={}){
  const g = new THREE.Group()
  const bm = mat(body,.9)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(.5,6,5), bm)
  torso.scale.set(1,1.25,.85); torso.position.y = .9; torso.castShadow = true; g.add(torso)
  const bel = new THREE.Mesh(new THREE.SphereGeometry(.38,6,5), mat(belly,.85))
  bel.scale.set(1,1.2,.8); bel.position.set(.12,.82,0); g.add(bel)
  const head = new THREE.Group()
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.32,6,5), bm)
  skull.castShadow = true; head.add(skull)
  const bk = new THREE.Mesh(new THREE.ConeGeometry(.09,.22,4), mat(beak,.6))
  bk.rotation.z = -Math.PI/2; bk.position.set(.34,0,0); head.add(bk)
  ;[-1,1].forEach(s=>{
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.07,5,4), mat(0xF8D820,.4))
    eye.position.set(.18,.08,.16*s); head.add(eye)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.035,4,3), mat(0x101010,.3))
    pupil.position.set(.24,.08,.16*s); head.add(pupil)
  })
  head.position.y = 1.55; g.add(head); g.userData.head = head
  const wings = []
  ;[-1,1].forEach(s=>{
    const w = new THREE.Mesh(new THREE.ConeGeometry(.22,.9,4), mat(wing,.9))
    w.rotation.x = Math.PI/2*s*.9; w.rotation.z = .4
    w.position.set(-.1,1, .42*s); w.castShadow = true
    g.add(w); wings.push(w)
  })
  g.userData.wings = wings
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.18,.6,4), mat(wing,.9))
  tail.rotation.z = Math.PI/1.7; tail.position.set(-.5,.7,0); g.add(tail)
  g.userData.tail = tail
  ;[-1,1].forEach(s=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.35,4), mat(0xC8A030,.7))
    leg.position.set(0,.35,.14*s); g.add(leg)
  })
  if(big) g.scale.setScalar(1.25)
  g.userData.legs = []
  return g
}

/* ── SNAKE ── */
export function snakeModel(){
  const g = new THREE.Group()
  const bm = mat(0x3A8A48,.85)
  const segs = 7
  for(let i=0;i<segs;i++){
    const r = .18 - i*.012
    const s = new THREE.Mesh(new THREE.SphereGeometry(r,6,5), bm)
    const ang = i*.55
    s.position.set(-i*.3+(segs*.15), .16, Math.sin(ang)*.35)
    s.castShadow = true; g.add(s)
    if(i%2===0){
      const stripe = new THREE.Mesh(new THREE.SphereGeometry(r*.6,5,4), mat(0xE8D060,.8))
      stripe.position.copy(s.position); stripe.position.y += .06
      g.add(stripe)
    }
  }
  const head = new THREE.Group()
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.2,6,5), bm)
  skull.scale.set(1.3,.85,1); skull.castShadow = true; head.add(skull)
  ;[-1,1].forEach(s=>{
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.045,4,3), mat(0xF0C020,.4))
    eye.position.set(.12,.06,.11*s); head.add(eye)
  })
  head.position.set(segs*.15+.25,.2,0)
  g.add(head); g.userData.head = head
  g.userData.legs = []; g.userData.tail = null
  return g
}

/* ── BUILD ANY ANIMAL BY ID ── */
export function buildAnimal(id, evolved=false){
  let m
  switch(id){
    case 'fox': {
      m = quadruped({ body: evolved?0xC02818:0xD0641E, belly:0xF4E8D4, bulk:.92, tailLen:1.35, headScale:1.05 })
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.1,.3,5), mat(0xF4F0E6,.85))
      tip.position.set(-1.32,1.36,0); tip.rotation.z = Math.PI/2.4; m.add(tip)
      m.userData.legs.forEach(l=>{
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(.095,.075,.3,5), mat(0x2A1E14,.9))
        sock.position.copy(l.position); sock.position.y = .16; m.add(sock)
      })
      if(evolved){
        for(let i=0;i<5;i++){
          const glow = new THREE.Mesh(new THREE.SphereGeometry(.05,4,3),
            new THREE.MeshStandardMaterial({ color:0xFF6020, emissive:0xFF4010, emissiveIntensity:.9, flatShading:true }))
          glow.position.set((Math.random()-.5)*1.4,.8+Math.random()*.6,(Math.random()>.5?1:-1)*.45)
          m.add(glow)
        }
      }
      m.scale.setScalar(.9); break
    }
    case 'wolf': {
      m = quadruped({ body: evolved?0x4A5664:0x7A8694, belly:0xD8DCE2, bulk: evolved?1.25:1.1, tailLen:1.15 })
      if(evolved){
        const mane = new THREE.Mesh(new THREE.SphereGeometry(.6,6,5), mat(0x3A4452,.95))
        mane.position.set(.7,1,0); mane.scale.set(.8,1,1.05); m.add(mane)
      }
      m.scale.setScalar(evolved?1.05:.95); break
    }
    case 'raccoon': {
      m = quadruped({ body: evolved?0x3A3A44:0x8A8A92, belly:0xD0D0D6, bulk:.95, tailLen:1.1, headScale:1, legLen:.6, lowSlung:true })
      const mask = new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.56), mat(0x26262C,.9))
      mask.position.set(.25,.12,0); m.userData.head.add(mask)
      for(let i=0;i<3;i++){
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.14-.015*i,.05,4,6), mat(0x26262C,.9))
        ring.position.set(-.95-i*.18,.78+i*.16,0); ring.rotation.y = Math.PI/2
        m.add(ring)
      }
      m.scale.setScalar(.78); break
    }
    case 'deer': case 'cdeer': {
      const corrupted = id==='cdeer'
      m = quadruped({ body: corrupted?0x6A2A22:0xA87848, belly: corrupted?0x9A6050:0xE8D8C0, bulk:.85, tailLen:.4, headScale:.9, legLen:1 })
      ;[-1,1].forEach(s=>{
        const a = new THREE.Mesh(new THREE.ConeGeometry(.05,.5,4), mat(corrupted?0x4A2018:0xD8C8A8,.9))
        a.position.set(-.1,.45,.16*s); a.rotation.z = -.4; a.rotation.x = .3*s
        m.userData.head.add(a)
        const a2 = new THREE.Mesh(new THREE.ConeGeometry(.04,.3,4), mat(corrupted?0x4A2018:0xD8C8A8,.9))
        a2.position.set(-.2,.5,.24*s); a2.rotation.z = -.8; a2.rotation.x = .45*s
        m.userData.head.add(a2)
      })
      if(corrupted){
        for(let i=0;i<4;i++){
          const vein = new THREE.Mesh(new THREE.SphereGeometry(.06,4,3),
            new THREE.MeshStandardMaterial({ color:0xC02020, emissive:0xA01010, emissiveIntensity:1, flatShading:true }))
          vein.position.set((Math.random()-.5)*1.3,.7+Math.random()*.6,(Math.random()>.5?1:-1)*.44)
          m.add(vein)
        }
      }
      m.scale.setScalar(.95); break
    }
    case 'bear': {
      m = quadruped({ body:0x3A2C20, belly:0x5A4634, bulk:1.5, tailLen:.25, headScale:1.15, earLen:.18, legLen:.9 })
      m.scale.setScalar(1.15); break
    }
    case 'rabbit': {
      m = quadruped({ body:0xB8A088, belly:0xF0E8DC, bulk:.7, tailLen:.2, headScale:1.1, earLen:.55, legLen:.45, lowSlung:true })
      m.scale.setScalar(.55); break
    }
    case 'otter': {
      m = quadruped({ body:0x6A4E36, belly:0xC8A87E, bulk:.8, tailLen:1.3, headScale:.92, legLen:.4, lowSlung:true })
      m.scale.setScalar(.7); break
    }
    case 'beaver': {
      m = quadruped({ body:0x6A4426, belly:0x9A7048, bulk:1.05, tailLen:.2, headScale:1, legLen:.45, lowSlung:true })
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(.7,.08,.45), mat(0x4A3018,.9))
      paddle.position.set(-1.15,.3,0); m.add(paddle)
      const teeth = new THREE.Mesh(new THREE.BoxGeometry(.06,.12,.14), mat(0xF8F0D8,.6))
      teeth.position.set(.5,-.18,0); m.userData.head.add(teeth)
      m.scale.setScalar(.75); break
    }
    case 'owl':  m = bird({ body:0x8A6E48, belly:0xD8C8A0, wing:0x6A5238 }); break
    case 'hawk': m = bird({ body:0x9A5E2E, belly:0xE0CCA8, wing:0x7A4622, big:true }); break
    case 'snake': m = snakeModel(); break
    default: m = quadruped({})
  }
  m.traverse(o=>{ if(o.isMesh) o.castShadow = true })
  return m
}
