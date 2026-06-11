/* ── WILDDOX GAME DATA ── */

export const ANIMALS = {
  fox: { id:'fox', name:'Red Fox', type:'Speed', baseHp:42, atk:10, def:6,
    desc:'Swift and cunning. Excels at hit-and-run tactics.',
    moves:[
      {name:'Quick Bite', pp:20, mpP:20, dmg:9,  acc:95,  cat:'phys', icon:'🦷'},
      {name:'Distract',   pp:15, mpP:15, dmg:0,  acc:100, cat:'stat', icon:'✨'},
      {name:'Dodge Roll', pp:10, mpP:10, dmg:0,  acc:100, cat:'heal', heal:8, icon:'💚'},
      {name:'Pounce',     pp:8,  mpP:8,  dmg:15, acc:85,  cat:'phys', icon:'⚡'},
    ],
    evo:{ name:'Crimson Fox', level:18, desc:'A majestic crimson fox with glowing markings.' }},
  raccoon: { id:'raccoon', name:'Raccoon', type:'Utility', baseHp:50, atk:9, def:8,
    desc:'Crafty and adaptable. Versatile in any situation.',
    moves:[
      {name:'Scratch',    pp:25, mpP:25, dmg:8,  acc:100, cat:'phys', icon:'🔰'},
      {name:'Scavenge',   pp:10, mpP:10, dmg:0,  acc:100, cat:'heal', heal:12, icon:'💚'},
      {name:'Trick',      pp:15, mpP:15, dmg:10, acc:90,  cat:'phys', icon:'🌀'},
      {name:'Night Raid', pp:8,  mpP:8,  dmg:16, acc:80,  cat:'phys', icon:'🌙'},
    ],
    evo:{ name:'Shadow Bandit', level:16, desc:'Near invisible at night.' }},
  wolf: { id:'wolf', name:'Young Wolf', type:'Power', baseHp:58, atk:13, def:7,
    desc:'Raw strength and fierce loyalty.',
    moves:[
      {name:'Bite',         pp:20, mpP:20, dmg:12, acc:95,  cat:'phys', icon:'🦷'},
      {name:'Howl',         pp:10, mpP:10, dmg:0,  acc:100, cat:'buff', icon:'🌕'},
      {name:'Rock Smash',   pp:15, mpP:15, dmg:10, acc:100, cat:'phys', icon:'💢'},
      {name:'Feral Strike', pp:8,  mpP:8,  dmg:18, acc:78,  cat:'phys', icon:'⚡'},
    ],
    evo:{ name:'Alpha Wolf', level:20, desc:'The pack follows without question.' }},
}

export const WILD = [
  { id:'deer',   name:'White-tailed Deer', maxHp:46, atk:8,  cr:55, xp:30, rw:8,
    moves:[{name:'Kick',dmg:9,icon:'🦶'},{name:'Headbutt',dmg:13,icon:'💢'}]},
  { id:'owl',    name:'Barred Owl',        maxHp:38, atk:11, cr:48, xp:38, rw:10,
    moves:[{name:'Talon Swipe',dmg:11,icon:'✂️'},{name:'Silent Strike',dmg:15,icon:'🌙'}]},
  { id:'beaver', name:'Beaver',            maxHp:54, atk:8,  cr:62, xp:24, rw:7,
    moves:[{name:'Gnaw',dmg:8,icon:'🦷'},{name:'Tail Slap',dmg:11,icon:'💥'}]},
  { id:'bear',   name:'Black Bear',        maxHp:72, atk:16, cr:22, xp:65, rw:20,
    moves:[{name:'Swipe',dmg:14,icon:'🐾'},{name:'Maul',dmg:20,icon:'💢'}]},
  { id:'hawk',   name:'Red-tailed Hawk',   maxHp:40, atk:13, cr:38, xp:48, rw:12,
    moves:[{name:'Dive',dmg:13,icon:'⬇️'},{name:'Talon Grab',dmg:16,icon:'✂️'}]},
  { id:'rabbit', name:'Cottontail',        maxHp:28, atk:4,  cr:78, xp:14, rw:4,
    moves:[{name:'Scratch',dmg:4,icon:'🔰'},{name:'Flee Kick',dmg:7,icon:'🦶'}]},
  { id:'otter',  name:'River Otter',       maxHp:44, atk:10, cr:52, xp:28, rw:8,
    moves:[{name:'Slap',dmg:9,icon:'💥'},{name:'Dive Roll',dmg:12,icon:'🌀'}]},
  { id:'snake',  name:'Garter Snake',      maxHp:30, atk:9,  cr:58, xp:22, rw:6,
    moves:[{name:'Constrict',dmg:8,icon:'🔄'},{name:'Venom Spit',dmg:12,icon:'💧'}]},
]

export const HUNTER_ANIMAL = { id:'cdeer', name:'Corrupted Deer', maxHp:62, atk:16, cr:0, xp:0,
  moves:[{name:'Forced Strike',dmg:17,icon:'⚡'},{name:'Serum Burst',dmg:13,icon:'💉'}]}

export const CAGES = [
  { id:'basic',      name:'Basic Cage',  icon:'📦', bonus:0,  desc:'Standard mesh cage', n:10 },
  { id:'reinforced', name:'Reinforced',  icon:'🔒', bonus:18, desc:'+18% catch rate',    n:3 },
  { id:'baited',     name:'Baited Trap', icon:'🍯', bonus:30, desc:'+30% catch rate',    n:2 },
]

export const SCIENTISTS = [
  { id:'sara',    name:'Sara',    emoji:'👩‍🔬', spec:'Forest ecosystems & animal behavior',  region:'NE Forests', ulv:0 },
  { id:'yaarah',  name:"Ya'arah", emoji:'🧑‍🔬', spec:'Expert in arid & desert environments', region:'SW Desert',  ulv:20 },
  { id:'emily',   name:'Emily',   emoji:'👩‍💼', spec:'Studies mountain species & evolution',  region:'Rockies',    ulv:35 },
  { id:'mallory', name:'Mallory', emoji:'🧑‍⚕️', spec:'Focuses on aquatic life & wetlands',   region:'Wetlands',   ulv:50 },
]

export const REGIONS = [
  { id:'ne', name:'Northeast Forests', emoji:'🌲', x:'72%', y:'20%', open:true, curr:true },
  { id:'rm', name:'Rocky Mountains',   emoji:'⛰️', x:'26%', y:'32%', open:false },
  { id:'mw', name:'Midwest Plains',    emoji:'🌾', x:'50%', y:'36%', open:false },
  { id:'sw', name:'Southwest Desert',  emoji:'🌵', x:'22%', y:'58%', open:false },
  { id:'sl', name:'Southern Wetlands', emoji:'🐊', x:'58%', y:'62%', open:false },
  { id:'wc', name:'West Coast',        emoji:'🌊', x:'8%',  y:'42%', open:false },
]

export const TIPS = [
  'Walk through tall grass to find wild animals!',
  'Below 30% HP is the sweet spot for caging.',
  'Bond grows through battles — high bond unlocks evolution.',
  "The Hunters' animals are powerful but unstable.",
  "Black Bears need a Baited Trap — don't waste Basic Cages.",
  'Evolution requires both level AND bond. Train wisely.',
  "Mark is watching. Don't let your guard down.",
]

export const STORY = {
  c1: { sp:'Dr. Sara', em:'👩‍🔬', lines:[
    "Welcome to the Northeast Forests, {p}. I'm Dr. Sara — your guide.",
    'These woods hold dozens of species. And something darker.',
    'An organization called The Hunters has been operating here. Forced evolution. Illegal trapping.',
    'I need your help. Choose your first companion wisely.' ]},
  mark: { sp:'Mark', em:'🧑', lines:[
    "Hey — you must be Sara's new recruit.",
    "I'm Mark. Already caught three animals. Not that we're competing.",
    "Good luck out there, {p}. You'll need it." ]},
  betrayal: { sp:'Mark', em:'🧑', lines:[
    "You're stronger than I expected. That's... a problem.",
    "Sara's methods are too slow. The Hunters reached out to me.",
    'Stay out of my way, {p}. This is still friendly — for now.' ]},
  hunter: { sp:'Hunter Grunt', em:'💀', lines:[
    'Hand over your animals and walk away.',
    'The Director wants specimens. Your fox would fetch a nice price.',
    'Last warning. Then my Corrupted Deer settles this.' ]},
  evo: { sp:'Dr. Sara', em:'👩‍🔬', lines:[
    'Incredible... the bond between you two is extraordinary.',
    "No serums, no force — just trust. This is what The Hunters can't understand.",
    'Your companion evolved through genuine connection.' ]},
}

/* helpers shared by UI + engine */
export const dc = o => JSON.parse(JSON.stringify(o))
export const ri = (a,b) => Math.floor(Math.random()*(b-a+1))+a
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v))
export const pct = (v,m) => Math.round(v/m*100)
export const calcCatch = (hp,mhp,cr,bonus) => clamp(Math.round(cr+(1-hp/mhp)*35+bonus),5,97)
export function mkAnimal(base){
  return { ...dc(base),
    hp: base.baseHp||base.maxHp||40, maxHp: base.baseHp||base.maxHp||40,
    level: base.level||5, bond:10, atk:base.atk||8, def:base.def||6, evolved:false }
}
