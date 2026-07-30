/* ── WILDDOX GAME DATA ── */

export const ANIMALS = {
  fox: { id:'fox', name:'Red Fox', type:'Speed', baseHp:42, atk:10, def:6,
    desc:'Swift and cunning. Excels at hit-and-run tactics.',
    moves:[
      {name:'Quick Bite', pp:20, mpP:20, dmg:9,  acc:95,  cat:'phys', emoji:'🦷', icon:'bite'},
      {name:'Distract',   pp:15, mpP:15, dmg:0,  acc:100, cat:'stat', emoji:'✨', icon:'spark'},
      {name:'Dodge Roll', pp:10, mpP:10, dmg:0,  acc:100, cat:'heal', heal:8, emoji:'💚', icon:'heal'},
      {name:'Pounce',     pp:8,  mpP:8,  dmg:15, acc:85,  cat:'phys', emoji:'⚡', icon:'bolt'},
    ],
    evo:{ id:'crimson_fox', name:'Crimson Fox', level:18, desc:'A majestic crimson fox with glowing markings.' }},
  raccoon: { id:'raccoon', name:'Raccoon', type:'Utility', baseHp:50, atk:9, def:8,
    desc:'Crafty and adaptable. Versatile in any situation.',
    moves:[
      {name:'Scratch',    pp:25, mpP:25, dmg:8,  acc:100, cat:'phys', emoji:'🔰', icon:'shield'},
      {name:'Scavenge',   pp:10, mpP:10, dmg:0,  acc:100, cat:'heal', heal:12, emoji:'💚', icon:'heal'},
      {name:'Trick',      pp:15, mpP:15, dmg:10, acc:90,  cat:'phys', emoji:'🌀', icon:'swirl'},
      {name:'Night Raid', pp:8,  mpP:8,  dmg:16, acc:80,  cat:'phys', emoji:'🌙', icon:'moon'},
    ],
    evo:{ id:'shadow_bandit', name:'Shadow Bandit', level:16, desc:'Near invisible at night.' }},
  wolf: { id:'wolf', name:'Young Wolf', type:'Power', baseHp:58, atk:13, def:7,
    desc:'Raw strength and fierce loyalty.',
    moves:[
      {name:'Bite',         pp:20, mpP:20, dmg:12, acc:95,  cat:'phys', emoji:'🦷', icon:'bite'},
      {name:'Howl',         pp:10, mpP:10, dmg:0,  acc:100, cat:'buff', emoji:'🌕', icon:'moon-full'},
      {name:'Rock Smash',   pp:15, mpP:15, dmg:10, acc:100, cat:'phys', emoji:'💢', icon:'impact'},
      {name:'Feral Strike', pp:8,  mpP:8,  dmg:18, acc:78,  cat:'phys', emoji:'⚡', icon:'bolt'},
    ],
    evo:{ id:'alpha_wolf', name:'Alpha Wolf', level:20, desc:'The pack follows without question.' }},
}

export const WILD = [
  { id:'deer',   name:'White-tailed Deer', maxHp:46, atk:8,  cr:55, xp:30, rw:8,
    moves:[{name:'Kick',dmg:9,emoji:'🦶',icon:'kick'},{name:'Headbutt',dmg:13,emoji:'💢',icon:'impact'}]},
  { id:'owl',    name:'Barred Owl',        maxHp:38, atk:11, cr:48, xp:38, rw:10,
    moves:[{name:'Talon Swipe',dmg:11,emoji:'✂️',icon:'cut'},{name:'Silent Strike',dmg:15,emoji:'🌙',icon:'moon'}]},
  { id:'beaver', name:'Beaver',            maxHp:54, atk:8,  cr:62, xp:24, rw:7,
    moves:[{name:'Gnaw',dmg:8,emoji:'🦷',icon:'bite'},{name:'Tail Slap',dmg:11,emoji:'💥',icon:'burst'}]},
  { id:'bear',   name:'Black Bear',        maxHp:72, atk:16, cr:22, xp:65, rw:20,
    moves:[{name:'Swipe',dmg:14,emoji:'🐾',icon:'paw'},{name:'Maul',dmg:20,emoji:'💢',icon:'impact'}]},
  { id:'hawk',   name:'Red-tailed Hawk',   maxHp:40, atk:13, cr:38, xp:48, rw:12,
    moves:[{name:'Dive',dmg:13,emoji:'⬇️',icon:'dive'},{name:'Talon Grab',dmg:16,emoji:'✂️',icon:'cut'}]},
  { id:'rabbit', name:'Cottontail',        maxHp:28, atk:4,  cr:78, xp:14, rw:4,
    moves:[{name:'Scratch',dmg:4,emoji:'🔰',icon:'shield'},{name:'Flee Kick',dmg:7,emoji:'🦶',icon:'kick'}]},
  { id:'otter',  name:'River Otter',       maxHp:44, atk:10, cr:52, xp:28, rw:8,
    moves:[{name:'Slap',dmg:9,emoji:'💥',icon:'burst'},{name:'Dive Roll',dmg:12,emoji:'🌀',icon:'swirl'}]},
  { id:'snake',  name:'Garter Snake',      maxHp:30, atk:9,  cr:58, xp:22, rw:6,
    moves:[{name:'Constrict',dmg:8,emoji:'🔄',icon:'loop'},{name:'Venom Spit',dmg:12,emoji:'💧',icon:'drop'}]},
]

export const HUNTER_ANIMAL = { id:'cdeer', name:'Corrupted Deer', maxHp:62, atk:16, cr:0, xp:0,
  moves:[{name:'Forced Strike',dmg:17,emoji:'⚡',icon:'bolt'},{name:'Serum Burst',dmg:13,emoji:'💉',icon:'syringe'}]}

export const CAGES = [
  { id:'basic',      name:'Basic Cage',  emoji:'📦', icon:'cage',  bonus:0,  desc:'Standard mesh cage', n:10 },
  { id:'reinforced', name:'Reinforced',  emoji:'🔒', icon:'lock',  bonus:18, desc:'+18% catch rate',    n:3 },
  { id:'baited',     name:'Baited Trap', emoji:'🍯', icon:'honey', bonus:30, desc:'+30% catch rate',    n:2 },
]

export const SCIENTISTS = [
  { id:'sara',    name:'Sara',    emoji:'👩‍🔬', icon:'scientist', spec:'Forest ecosystems & animal behavior',  region:'NE Forests', ulv:0 },
  { id:'yaarah',  name:"Ya'arah", emoji:'🧑‍🔬', icon:'scientist', spec:'Expert in arid & desert environments', region:'SW Desert',  ulv:20 },
  { id:'emily',   name:'Emily',   emoji:'👩‍💼', icon:'scientist', spec:'Studies mountain species & evolution',  region:'Rockies',    ulv:35 },
  { id:'mallory', name:'Mallory', emoji:'🧑‍⚕️', icon:'scientist', spec:'Focuses on aquatic life & wetlands',   region:'Wetlands',   ulv:50 },
]

export const REGIONS = [
  { id:'ne', name:'Northeast Forests', emoji:'🌲', icon:'tree',     x:'72%', y:'20%', open:true, curr:true },
  { id:'rm', name:'Rocky Mountains',   emoji:'⛰️', icon:'mountain', x:'26%', y:'32%', open:false },
  { id:'mw', name:'Midwest Plains',    emoji:'🌾', icon:'wheat',    x:'50%', y:'36%', open:false },
  { id:'sw', name:'Southwest Desert',  emoji:'🌵', icon:'cactus',   x:'22%', y:'58%', open:false },
  { id:'sl', name:'Southern Wetlands', emoji:'🐊', icon:'croc',     x:'58%', y:'62%', open:false },
  { id:'wc', name:'West Coast',        emoji:'🌊', icon:'wave',     x:'8%',  y:'42%', open:false },
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
  c1: { sp:'Dr. Sara', em:'👩‍🔬', emIcon:'scientist', lines:[
    "Welcome to the Northeast Forests, {p}. I'm Dr. Sara — your guide.",
    'These woods hold dozens of species. And something darker.',
    'An organization called The Hunters has been operating here. Forced evolution. Illegal trapping.',
    'I need your help. Choose your first companion wisely.' ]},
  mark: { sp:'Mark', em:'🧑', emIcon:'rival', lines:[
    "Hey — you must be Sara's new recruit.",
    "I'm Mark. Already caught three animals. Not that we're competing.",
    "Good luck out there, {p}. You'll need it." ]},
  betrayal: { sp:'Mark', em:'🧑', emIcon:'rival', lines:[
    "You're stronger than I expected. That's... a problem.",
    "Sara's methods are too slow. The Hunters reached out to me.",
    'Stay out of my way, {p}. This is still friendly — for now.' ]},
  hunter: { sp:'Hunter Grunt', em:'💀', emIcon:'skull', lines:[
    'Hand over your animals and walk away.',
    'The Director wants specimens. Your fox would fetch a nice price.',
    'Last warning. Then my Corrupted Deer settles this.' ]},
  evo: { sp:'Dr. Sara', em:'👩‍🔬', emIcon:'scientist', lines:[
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
    uid: Math.random().toString(36).substring(2, 11),
    hp: base.baseHp||base.maxHp||40, maxHp: base.baseHp||base.maxHp||40,
    level: base.level||5, bond:10, atk:base.atk||8, def:base.def||6, evolved:false }
}

export const QUESTS = [
  { id:'q1', title:"Meet the Wild", desc:"Walk into a tall grass patch and encounter your first animal.", hint:"Follow the gold arrow or look for rustling grass.", targetZone:'any', check:(s)=>s.flags.encounters > 0 },
  { id:'q2', title:"First Capture", desc:"Catch any wild animal with a cage.", hint:"Lower their HP first to improve catch rates, then use a cage from the battle menu.", targetZone:'any', check:(s)=>s.party.length > 1 },
  { id:'q3', title:"Growing Stronger", desc:"Win 3 battles.", hint:"Use type advantages or level up your starter.", targetZone:'any', check:(s)=>s.flags.wins && s.flags.wins >= 3 },
  { id:'q4', title:"Something's Wrong", desc:"Keep exploring and battling to trigger the betrayal.", hint:"Reach 8 total encounters.", targetZone:'any', check:(s)=>s.flags.betrayal },
  { id:'q5', title:"Hunter Threat", desc:"Defeat a Hunter's Corrupted Deer.", hint:"Keep exploring until you encounter a Hunter.", targetZone:'any', check:(s)=>s.flags.hunterDefeated },
  { id:'q6', title:"True Bond", desc:"Raise your starter's bond to 60% or more.", hint:"Win battles without letting them faint.", targetZone:null, check:(s)=>s.party[0] && s.party[0].bond >= 60 },
  { id:'q7', title:"Evolution", desc:"Evolve your starter.", hint:"Check the Team menu when their level and bond are high enough.", targetZone:null, check:(s)=>s.party[0] && s.party[0].evolved }
]
