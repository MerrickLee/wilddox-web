/* ── WILDDOX: SHADOWS OF THE HUNT — Main App ── */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Engine } from './game/engine.js'
import { AUDIO } from './game/audio.js'
import { ANIMALS, WILD, HUNTER_ANIMAL, CAGES, SCIENTISTS, REGIONS, TIPS, STORY, QUESTS,
         dc, ri, clamp, pct, calcCatch, mkAnimal } from './game/data.js'

/* ── UI components ── */
import { TitleScreen } from './ui/TitleScreen.jsx'
import { StarterScreen } from './ui/StarterScreen.jsx'
import { WorldHUD } from './ui/WorldHUD.jsx'
import { BattleScreen } from './ui/BattleScreen.jsx'
import { TeamScreen } from './ui/TeamScreen.jsx'
import { BagScreen } from './ui/BagScreen.jsx'
import { MapScreen } from './ui/MapScreen.jsx'
import { ScientistsScreen } from './ui/ScientistsScreen.jsx'
import { SettingsScreen } from './ui/SettingsScreen.jsx'
import { Cutscene } from './ui/Cutscene.jsx'
import { EvolutionOverlay } from './ui/EvolutionOverlay.jsx'

const SAVE_KEY = 'wilddox_save_v1'

export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams)
  } else if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...eventParams })
  }
}

export default function App(){
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  /* ── persistent game state ── */
  const [phase, setPhase] = useState('title')      // title | starter | world | battle | team | bag | map | scientists
  const [player, setPlayer] = useState({ name:'', emoji:'' })
  const [party, setParty] = useState([])
  const [coins, setCoins] = useState(120)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [cages, setCages] = useState(dc(CAGES))
  const [flags, setFlags] = useState({ betrayal:false, firstHunter:false, encounters:0 })
  const [chosen, setChosen] = useState(null)
  const [tip, setTip] = useState(0)
  const [notif, setNotif] = useState('')
  const [muted, setMuted] = useState(false)
  const [hasSave, setHasSave] = useState(false)
  
  const [questIdx, setQuestIdx] = useState(0)
  const [questExpanded, setQuestExpanded] = useState(false)
  const [questBanner, setQuestBanner] = useState(null)
  const [wpScreen, setWpScreen] = useState({ visible: false })
  const [startOverlay, setStartOverlay] = useState(true)

  /* ── cutscene ── */
  const [cs, setCs] = useState(null)     // { key, line, cb }
  /* ── battle state ── */
  const [bat, setBat] = useState(null)   // { enemy, isHunter, eHp, pHp, eph, blog, selCage, busy, res, pAtk, eDef }
  /* ── evolution ── */
  const [evo, setEvo] = useState(null)
  
  const prevPState = useRef('NEUTRAL')
  
  /* ── screen tracking ── */
  useEffect(() => {
    trackEvent('screen_view', { screen_name: phase })
  }, [phase])

  /* ── battle hp states ── */
  useEffect(() => {
    if(phase === 'battle' && bat && engineRef.current) {
      const pPct = Math.round(bat.pHp / party[0].maxHp * 100)
      const ePct = Math.round(bat.eHp / bat.enemy.maxHp * 100)
      engineRef.current.setBattleHpState(pPct, ePct)
      
      const np = pPct < 25 ? 'CRITICAL' : pPct <= 50 ? 'HURT' : (pPct > 60 && ePct < 40) ? 'WINNING' : 'NEUTRAL'
      if(np === 'WINNING' && prevPState.current !== 'WINNING') AUDIO.bark('confident')
      if(np === 'CRITICAL' && prevPState.current !== 'CRITICAL') AUDIO.bark('critical')
      prevPState.current = np
    }
  }, [phase, bat?.pHp, bat?.eHp, party])

  const notify = useCallback((msg, ms=2600)=>{
    setNotif(msg); setTimeout(()=>setNotif(''), ms)
  },[])

  /* ── engine boot ── */
  useEffect(()=>{
    const eng = new Engine(canvasRef.current, {
      onEncounter: () => startEncounterRef.current && startEncounterRef.current(),
      onHealItem: () => healItemRef.current && healItemRef.current()
    })
    engineRef.current = eng
    /* load save */
    try{
      const raw = localStorage.getItem(SAVE_KEY)
      if(raw) setHasSave(true)
    }catch(e){}
    return ()=>eng.dispose()
  },[])

  /* ── auto-save ── */
  useEffect(()=>{
    if(phase==='title' || phase==='starter') return
    try{
      localStorage.setItem(SAVE_KEY, JSON.stringify({ player, party, coins, xp, level, cages, flags, questIdx }))
    }catch(e){}
  },[player, party, coins, xp, level, cages, flags, phase, questIdx])

  const loadSave = ()=>{
    try{
      const raw = localStorage.getItem(SAVE_KEY)
      if(!raw) return false
      const s = JSON.parse(raw)
      setPlayer(s.player); setParty(s.party); setCoins(s.coins); setXp(s.xp)
      setLevel(s.level); setCages(s.cages); setFlags(s.flags)
      if(s.questIdx !== undefined) setQuestIdx(s.questIdx)
      return s
    }catch(e){ return false }
  }

  /* ── quest tracking ── */
  useEffect(() => {
    if(phase === 'title' || phase === 'starter' || !QUESTS) return
    const q = QUESTS[questIdx]
    if(!q) return
    if(engineRef.current) engineRef.current.setWaypoint(q.targetZone)
    
    if(!questBanner && q.check({ player, party, coins, xp, level, cages, flags })){
      AUDIO.levelup()
      trackEvent('quest_complete', { quest_title: q.title })
      setQuestBanner({ type: 'COMPLETE', title: q.title })
      setTimeout(() => {
        const nextIdx = questIdx + 1
        setQuestIdx(nextIdx)
        const nextQ = QUESTS[nextIdx]
        if(nextQ){
          setQuestBanner({ type: 'NEW', title: nextQ.title })
          setTimeout(() => setQuestBanner(null), 2500)
        } else {
          setQuestBanner(null)
        }
      }, 2500)
    }
  }, [questIdx, player, party, coins, xp, level, cages, flags, phase, questBanner])

  /* ── screen info polling ── */
  useEffect(() => {
    if(phase !== 'world') return
    const t = setInterval(() => {
      if(engineRef.current){
        const info = engineRef.current.getWaypointScreenInfo()
        setWpScreen(info)
      }
    }, 100)
    return () => clearInterval(t)
  }, [phase])

  /* engine pause while menus open */
  useEffect(()=>{
    const eng = engineRef.current
    if(eng) eng.paused = (phase !== 'world') || !!cs || !!evo
  },[phase, cs, evo])

  /* music per phase */
  useEffect(()=>{
    if(phase==='title') AUDIO.playTitle()
    if(!AUDIO.ready) return
    if(phase==='battle') AUDIO.playBattle(bat?.isHunter)
    else if(phase==='world') AUDIO.playWorld()
  },[phase])

  /* ── cutscene helpers ── */
  const startCS = useCallback((key, cb)=>{
    setCs({ key, line:0, cb, typing:true })
  },[])
  const advanceCS = ()=>{
    AUDIO.click()
    setCs(c=>{
      if(!c) return null
      if(c.typing) return { ...c, typing:false }
      const lines = STORY[c.key].lines
      if(c.line < lines.length-1) return { ...c, line:c.line+1, typing:true }
      const cb = c.cb
      setTimeout(()=>cb && cb(), 0)
      return null
    })
  }
  const handleSetCsTyping = useCallback((val)=>{
    setCs(c=>c?{...c,typing:val}:null)
  }, [])

  /* ── title actions ── */
  const newGame = async (name, emoji, jacket)=>{
    trackEvent('game_start', { name, emoji, jacket, starter: jacket===0x9A3A20?'fox':'wolf' })
    await AUDIO.init(); AUDIO.click()
    setPlayer({ name, emoji })
    engineRef.current.setCharacter({ jacket, name })
    setPhase('starter')
    startCS('c1')
  }
  const continueGame = async ()=>{
    await AUDIO.init(); AUDIO.click()
    const s = loadSave()
    if(!s) return
    trackEvent('game_load', { level: s.level || 1, coins: s.coins })
    const jacket = s.player.name === 'Maisey' ? 0x2A6A80 : 0x9A3A20
    engineRef.current.setCharacter({ jacket, name: s.player.name })
    setPhase('world')
    AUDIO.playWorld()
  }

  /* ── starter pick ── */
  const confirmStarter = ()=>{
    if(!chosen) return
    AUDIO.click()
    const base = ANIMALS[chosen]
    setParty([{ ...mkAnimal(base), moves:dc(base.moves) }])
    setPhase('world')
    AUDIO.playWorld()
    startCS('mark')
  }

  /* ── encounters and healing ── */
  const healItemRef = useRef(null)
  healItemRef.current = () => {
    if(phase !== 'world') return
    const isFullHp = party.every(a => a.hp === a.maxHp)
    if(isFullHp) {
      notify('Found a berry, but team is already at full HP! 🍒')
    } else {
      setParty(p => {
        const np = dc(p)
        np.forEach(a => a.hp = a.maxHp)
        return np
      })
      trackEvent('heal_item_pickup')
      AUDIO.heal()
      notify('Found a berry! Team fully healed! 🍒')
    }
  }

  const startEncounterRef = useRef(null)
  startEncounterRef.current = ()=>{
    if(phase!=='world' || cs || evo || !party.length) return
    const nEnc = flags.encounters + 1
    setFlags(f=>({ ...f, encounters:nEnc }))
    if(nEnc % 4 === 0) setTip(t=>(t+1)%TIPS.length)

    /* Mark betrayal at 8 encounters */
    if(nEnc === 8 && !flags.betrayal){
      setFlags(f=>({ ...f, betrayal:true, encounters:nEnc }))
      startCS('betrayal')
      engineRef.current.encounterCooldown = 4
      return
    }
    AUDIO.encounter()
    const isHunter = Math.random() < .15
    const beginBattle = ()=>{
      const enemy = isHunter ? dc(HUNTER_ANIMAL) :
        dc((party.length>=6 ? WILD.filter(a=>a.maxHp<=55) : WILD)[ri(0, (party.length>=6 ? WILD.filter(a=>a.maxHp<=55) : WILD).length-1)])
      enemy.hp = enemy.maxHp
      const lead = party[0]
      engineRef.current.startBattle(lead.id, lead.evolved, enemy.id)
      trackEvent('battle_start', { enemy_name: enemy.name, enemy_level: enemy.level })
      setBat({ enemy, isHunter, eHp:enemy.maxHp, pHp:lead.hp, eph:'intro',
        blog:[], selCage:'basic', busy:false, res:null, pAtk:1, eDef:1 })
      setPhase('battle')
      AUDIO.playBattle(isHunter)
    }
    if(isHunter && !flags.firstHunter){
      setFlags(f=>({ ...f, firstHunter:true, encounters:nEnc }))
      startCS('hunter', beginBattle)
    } else beginBattle()
  }

  /* ── battle actions ── */
  const addLog = msg => setBat(b=>({ ...b, blog:[...b.blog.slice(-3), msg] }))

  const doMove = (mv, mi)=>{
    setBat(b=>{
      if(b.busy || mv.pp<=0) return b
      return { ...b, busy:true }
    })
    const b = bat
    if(b.busy || mv.pp<=0) return
    const lead = party[0]
    const eng = engineRef.current
    trackEvent('battle_move', { move_name: mv.name })
    /* decrement PP */
    setParty(p=>{
      const np = dc(p); np[0].moves[mi].pp = Math.max(0, np[0].moves[mi].pp-1); return np
    })

    const enemyTurn = ()=>{
      setBat(cur=>{
        if(!cur || cur.eph==='result') return cur
        return cur
      })
      const curB = batRef.current
      if(!curB || curB.eph==='result' || curB.eHp <= 0 || curB.pHp <= 0){ setBat(x=>x?{...x,busy:false}:x); return }
      const em = curB.enemy.moves[ri(0, curB.enemy.moves.length-1)]
      eng.playEnemyAttack(()=>{
        AUDIO.hit()
        const ed = Math.max(1, em.dmg + ri(-2,4))
        setBat(x=>{
          const nHp = Math.max(0, x.pHp - ed)
          const nb = { ...x, pHp:nHp, blog:[...x.blog.slice(-3), `${curB.enemy.name}: ${em.name} — ${ed} dmg`] }
          if(nHp<=0){ 
            nb.eph='animating_defeat'
            nb.res={ ok:false, msg:`${party[0].name} fainted! Retreating...` } 
            trackEvent('battle_loss', { enemy_name: curB.enemy.name })
            eng.onDefeat('player', () => {
              setBat(curr => curr ? { ...curr, eph: 'result' } : null)
            })
          } else {
            eng.onLandedHit('enemy')
            eng.onTookBigHit('player', ed / party[0].maxHp * 100)
            AUDIO.bark('hurt')
          }
          return nb
        })
      }, ()=>{
        setBat(x=>x?{ ...x, busy:false }:x)
      })
    }

    if(mv.cat==='heal'){
      eng.playHeal(()=>{
        AUDIO.heal()
        const h = mv.heal + ri(0,4)
        setBat(x=>({ ...x, pHp:Math.min(lead.maxHp, x.pHp+h),
          blog:[...x.blog.slice(-3), `${lead.name}: ${mv.name} +${h} HP`] }))
        setTimeout(enemyTurn, 350)
      })
    } else if(mv.cat==='buff'){
      eng.playBuff(()=>{
        AUDIO.buff()
        setBat(x=>({ ...x, pAtk:1.4, blog:[...x.blog.slice(-3), `${lead.name}: ${mv.name} — ATK ⬆`] }))
        setTimeout(enemyTurn, 350)
      })
    } else if(mv.cat==='stat'){
      eng.playBuff(()=>{
        AUDIO.buff()
        setBat(x=>({ ...x, eDef:.7, blog:[...x.blog.slice(-3), `${lead.name}: ${mv.name} — enemy DEF ⬇`] }))
        setTimeout(enemyTurn, 350)
      })
    } else {
      /* physical attack with dynamic camera lunge */
      const hit = Math.random()*100 < (mv.acc||90)
      eng.playPlayerAttack(()=>{
        if(hit){
          AUDIO.hit()
          const d = Math.max(1, Math.round((mv.dmg + ri(-2,3)) * b.pAtk / b.eDef))
          setBat(x=>{
            const nE = Math.max(0, x.eHp - d)
            const nb = { ...x, eHp:nE, blog:[...x.blog.slice(-3), `${lead.name}: ${mv.name} — ${d} dmg`] }
            if(nE<=0){
              nb.eph='animating_victory'
              nb.res={ ok:true, msg: x.isHunter ? 'Hunter defeated! They fled.' : `${x.enemy.name} is exhausted!` }
              trackEvent('battle_win', { enemy_name: x.enemy.name })
              eng.onDefeat('enemy')
              AUDIO.bark('victory')
              eng.onVictory('player', () => {
                setBat(curr => curr ? { ...curr, eph: 'result' } : null)
              })
            } else {
              eng.onLandedHit('player')
              eng.onTookBigHit('enemy', d / x.enemy.maxHp * 100)
            }
            return nb
          })
        } else {
          setBat(x=>({ ...x, blog:[...x.blog.slice(-3), `${lead.name}: ${mv.name} missed!`] }))
        }
      }, ()=>{
        const curB = batRef.current
        if(curB && curB.eHp > 0 && curB.pHp > 0 && curB.eph!=='result') setTimeout(enemyTurn, 250)
        else setBat(x=>x?{ ...x, busy:false }:x)
      })
    }
  }

  /* keep a ref of bat for async callbacks */
  const batRef = useRef(null)
  useEffect(()=>{ batRef.current = bat },[bat])

  const doBait = ()=>{
    if(bat.busy) return
    AUDIO.click()
    setBat(b=>({ ...b, eHp:Math.max(1, Math.floor(b.eHp*.58)),
      blog:[...b.blog.slice(-3), 'Bait set — the animal crept closer...'], eph:'battle' }))
  }

  const doThrow = ()=>{
    const b = bat
    if(b.busy) return
    const cage = cages.find(c=>c.id===b.selCage)
    if(!cage || cage.n<=0){ notify('No cages of that type left!'); return }
    setCages(cs=>cs.map(c=>c.id===cage.id?{ ...c, n:c.n-1 }:c))
    trackEvent('catch_attempt', { cage_type: cage.name, enemy_name: b.enemy.name })
    const cp = calcCatch(b.eHp, b.enemy.maxHp, b.enemy.cr||50, cage.bonus)
    const roll = ri(1,100)
    const caught = roll <= cp
    setBat(x=>({ ...x, busy:true }))
    AUDIO.cage()
    engineRef.current.playCageThrow(caught, ()=>{ AUDIO.hit() }, ()=>{
      if(caught){
        trackEvent('catch_success', { enemy_name: b.enemy.name })
        AUDIO.capture()
        if(party.length < 6){
          const ca = { ...mkAnimal({ ...dc(b.enemy), baseHp:b.enemy.maxHp }),
            moves:dc(b.enemy.moves), hp:Math.max(1, Math.floor(b.eHp*.5)), evolved:false }
          setParty(p=>[...p, ca])
        }
      } else AUDIO.fail()
      setBat(x=>({ ...x, busy:false, eph:'result',
        res:{ ok:caught, captured:caught,
          msg: caught ? `${b.enemy.name} caught! (${roll} ≤ ${cp}%)` : `${b.enemy.name} broke free! (${roll} > ${cp}%)` } }))
    })
  }

  const fleeBattle = ()=>{
    trackEvent('run_away', { enemy_name: bat.enemy.name })
    AUDIO.click()
    engineRef.current.endBattle()
    setBat(null)
    setPhase('world')
    AUDIO.playWorld()
    notify('Got away safely!')
  }

  const endBattle = ()=>{
    AUDIO.click()
    const b = bat
    if(b.res?.ok){
      const xg = b.isHunter ? 58 : (b.enemy.xp||20)
      const cg = ri(8, b.isHunter ? 30 : 18)
      const nXp = xp + xg
      const nl = Math.floor(nXp/120)+1
      setXp(nXp); setCoins(c=>c+cg)
      if(nl > level){ 
        setLevel(nl); AUDIO.levelup(); notify(`Level up! Now Lv.${nl} 🌟`, 3000)
        trackEvent('player_levelup', { new_level: nl })
      }
      else notify(`+${xg} XP · +${cg}🪙`)
      /* lead gains */
      setParty(p=>{
        const np = dc(p)
        np[0].hp = Math.min(np[0].maxHp, b.pHp + 10)
        np[0].bond = Math.min(100, np[0].bond + 8)
        if(np[0].bond >= 60) np[0].level += 1
        /* evolution check */
        const ba = ANIMALS[np[0].id]
        if(ba && np[0].level >= ba.evo.level && !np[0].evolved){
          const old = { name:np[0].name }
          np[0].evolved = true
          np[0].name = ba.evo.name
          np[0].maxHp = Math.round(np[0].maxHp*1.25)
          np[0].hp = np[0].maxHp
          np[0].atk = Math.round(np[0].atk*1.2)
          setTimeout(()=>{
            AUDIO.evolve()
            trackEvent('animal_evolve', { old_name: old.name, new_name: ba.evo.name })
            setEvo({ old, evo:ba.evo })
          }, 300)
        }
        return np
      })
    } else {
      setParty(p=>{ const np=dc(p); np[0].hp = Math.max(8, Math.floor(np[0].maxHp*.35)); return np })
    }
    engineRef.current.endBattle()
    setBat(null)
    setPhase('world')
    AUDIO.playWorld()
  }

  const doSwitch = (idx) => {
    const b = bat
    if (b.busy || idx === 0) return
    const target = party[idx]
    if (target.hp <= 0) { notify(`${target.name} has no energy left!`); return }

    setBat(x => ({ ...x, busy: true }))
    AUDIO.click()

    const newParty = dc(party)
    newParty[0].hp = b.pHp // save current battler's HP
    const temp = newParty[0]
    newParty[0] = newParty[idx]
    newParty[idx] = temp
    setParty(newParty)

    const newLead = newParty[0]
    trackEvent('battle_switch', { from_animal: party[0].name, to_animal: newLead.name })
    engineRef.current.updateBattler(newLead.id, newLead.evolved)
    
    setBat(x => ({ ...x, pHp: newLead.hp, eph: 'intro', blog:[...x.blog.slice(-2), `Switched to ${newLead.name}!`] }))
    
    setTimeout(() => {
       const curB = batRef.current
       if(!curB || curB.eph==='result' || curB.eHp <= 0 || curB.pHp <= 0){ setBat(x=>x?{...x,busy:false}:x); return }
       const em = curB.enemy.moves[ri(0, curB.enemy.moves.length-1)]
       engineRef.current.playEnemyAttack(()=>{
         AUDIO.hit()
         const ed = Math.max(1, em.dmg + ri(-2,4))
         setBat(x=>{
           const nHp = Math.max(0, x.pHp - ed)
           const nb = { ...x, pHp:nHp, blog:[...x.blog.slice(-3), `${curB.enemy.name}: ${em.name} — ${ed} dmg`] }
           if(nHp<=0){ 
             nb.eph='animating_defeat'
             nb.res={ ok:false, msg:`${newLead.name} fainted! Retreating...` } 
             trackEvent('battle_loss', { enemy_name: curB.enemy.name })
             engineRef.current.onDefeat('player', () => {
               setBat(curr => curr ? { ...curr, eph: 'result' } : null)
             })
           } else {
             engineRef.current.onLandedHit('enemy')
             engineRef.current.onTookBigHit('player', ed / newLead.maxHp * 100)
             AUDIO.bark('hurt')
           }
           return nb
         })
       }, ()=>{
         setBat(x=>x?{ ...x, busy:false }:x)
       })
    }, 600)
  }

  const healTeam = ()=>{
    const inj = party.filter(a=>a.hp<a.maxHp).length
    const cost = inj*15
    const canAfford = coins >= cost
    if(inj===0){ notify('Team at full HP!'); return }
    if(!canAfford){ notify(`Need ${cost}🪙`); return }
    trackEvent('heal_team', { cost, injured_count: inj })
    AUDIO.heal()
    setCoins(c=>c-cost)
    setParty(p=>{
      const np = dc(p)
      np.forEach(a=>a.hp=a.maxHp)
      return np
    })
    notify(`Team healed! −${cost}🪙`)
  }

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setParty(p => {
      const np = Array.from(p);
      const [reorderedItem] = np.splice(result.source.index, 1);
      np.splice(result.destination.index, 0, reorderedItem);
      AUDIO.click();
      return np;
    });
  }


  /* ── fixed joystick ── */
  const [joy, setJoy] = useState({ active:false, ox:0, oy:0, dx:0, dy:0 })
  const joyStart = e=>{
    const t = e.touches ? e.touches[0] : e
    setJoy({ active:true, ox:t.clientX, oy:t.clientY, dx:0, dy:0 })
  }
  const joyMove = e=>{
    if(!joy.active) return
    const t = e.touches ? e.touches[0] : e
    const dx = t.clientX - joy.ox, dy = t.clientY - joy.oy
    const len = Math.hypot(dx,dy), max = 45
    const cl = Math.min(len, max)
    const nx = len ? dx/len*cl : 0, ny = len ? dy/len*cl : 0
    setJoy(j=>({ ...j, dx:nx, dy:ny }))
    if(engineRef.current) engineRef.current.input = { x:nx/max, z:ny/max }
  }
  const joyEnd = ()=>{
    setJoy({ active:false, ox:0, oy:0, dx:0, dy:0 })
    if(engineRef.current) engineRef.current.input = { x:0, z:0 }
  }

  /* ── back-to-world helper ── */
  const goWorld = () => { AUDIO.click(); setPhase('world') }

  /* ─────────── RENDER ─────────── */
  const lead = party[0]
  const csData = cs ? STORY[cs.key] : null

  return (
  <div className="app">
    <canvas ref={canvasRef} className="gl" />

    {startOverlay && (
      <div 
        className="fade-in" 
        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', cursor:'pointer', fontSize:24, fontFamily:'var(--ft)' }}
        onClick={() => {
           AUDIO.init().then(() => {
             setStartOverlay(false)
             if(phase === 'title') AUDIO.playTitle()
           })
        }}
      >
        TAP TO ENTER
      </div>
    )}

    {phase==='title' && (
      <TitleScreen hasSave={hasSave} onNewGame={newGame} onContinue={continueGame} />
    )}

    {phase==='starter' && !cs && (
      <StarterScreen chosen={chosen} onChoose={(id) => { AUDIO.click(); setChosen(id) }} onConfirm={confirmStarter} />
    )}

    {phase==='world' && !cs && !evo && (
      <WorldHUD
        player={player} party={party} coins={coins} xp={xp} level={level} tip={tip} muted={muted}
        questIdx={questIdx} questExpanded={questExpanded}
        onToggleQuestExpanded={() => setQuestExpanded(!questExpanded)}
        wpScreen={wpScreen}
        joy={joy} joyStart={joyStart} joyMove={joyMove} joyEnd={joyEnd}
        onPhase={(id) => { AUDIO.click(); setPhase(id) }}
        onMuteToggle={() => { const m = AUDIO.toggleMute(); setMuted(m) }}
        onTrackChange={() => {
          AUDIO.click()
          const tracks = ['/Two_Voices_at_the_Edge.mp3', '/Beyond_the_Pine_Canopy.mp3', '/Maddy_Daddy_Go.mp3', '/The_Clearings_Call.mp3']
          let cur = AUDIO.bgm.src;
          let curPath = '';
          try { curPath = new URL(cur).pathname } catch(e) { curPath = cur }
          let i = tracks.indexOf(curPath)
          let next = tracks[(i+1)%tracks.length] || tracks[0]
          AUDIO.bgm.src = next
          if(phase === 'world') AUDIO.bgm.play().catch(()=>{})
        }}
      />
    )}

    {phase==='battle' && bat && !evo && (
      <BattleScreen
        bat={bat} lead={lead} party={party} cages={cages}
        doMove={doMove} doBait={doBait} doThrow={doThrow}
        fleeBattle={fleeBattle} endBattle={endBattle} doSwitch={doSwitch}
        setBat={setBat}
      />
    )}

    {phase==='team' && (
      <TeamScreen party={party} coins={coins} onHeal={healTeam} onBack={goWorld} onDragEnd={onDragEnd} />
    )}

    {phase==='bag' && (
      <BagScreen coins={coins} xp={xp} level={level} party={party} cages={cages} onHeal={healTeam} onBack={goWorld} />
    )}

    {phase==='map' && (
      <MapScreen onBack={goWorld} />
    )}

    {phase==='scientists' && (
      <ScientistsScreen level={level} flags={flags} onBack={goWorld} />
    )}

    {phase==='settings' && (
      <SettingsScreen phase={phase} player={player} party={party} coins={coins} xp={xp} level={level} cages={cages} flags={flags} onBack={goWorld} notify={notify} />
    )}

    {cs && csData && (
      <Cutscene cs={cs} csData={csData} player={player} onAdvance={advanceCS} onSetCsTyping={handleSetCsTyping} />
    )}

    {evo && (
      <EvolutionOverlay evo={evo} party={party} onDismiss={() => { AUDIO.click(); setEvo(null); startCS('evo') }} />
    )}

    {/* ═══ NOTIF ═══ */}
    {notif && <div className="notif slide-up">{notif}</div>}
  </div>
  )
}
