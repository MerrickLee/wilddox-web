/* ── WILDDOX: SHADOWS OF THE HUNT — Main App ── */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Engine } from './game/engine.js'
import { AUDIO } from './game/audio.js'
import { ANIMALS, WILD, HUNTER_ANIMAL, CAGES, SCIENTISTS, REGIONS, TIPS, STORY, QUESTS,
         dc, ri, clamp, pct, calcCatch, mkAnimal } from './game/data.js'

const SAVE_KEY = 'wilddox_save_v1'
const hpc = p => p>55?'bhi':p>25?'bmd':'blo'
const Hearts = ({ bond }) => {
  const full = Math.round(bond/20)
  return <div className="hearts">{[...Array(5)].map((_,i)=>
    <span key={i} className={'heart '+(i<full?'full':'empty')}>{i<full?'♥':'♡'}</span>)}</div>
}

const Typewriter = ({ text, typing, setTyping }) => {
  const [disp, setDisp] = useState('')
  useEffect(() => {
    if(!typing) {
      setDisp(text)
      return
    }
    setDisp('')
    let i = 0
    const t = setInterval(() => {
      setDisp(text.slice(0, i+1))
      i++
      if(i >= text.length) {
        clearInterval(t)
        setTyping(false)
      }
    }, 25)
    return () => clearInterval(t)
  }, [text, typing, setTyping])
  return <span>{disp}</span>
}

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
      onEncounter: () => startEncounterRef.current && startEncounterRef.current()
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

  /* ── encounters ── */
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
      if(nl > level){ setLevel(nl); AUDIO.levelup(); notify(`Level up! Now Lv.${nl} 🌟`, 3000) }
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

  const healTeam = ()=>{
    const inj = party.filter(a=>a.hp<a.maxHp).length
    const cost = inj*15
    if(inj===0){ notify('Team at full HP!'); return }
    if(coins < cost){ notify(`Need ${cost}🪙`); return }
    trackEvent('heal_team', { cost, injured_count: inj })
    AUDIO.heal()
    setCoins(c=>c-cost)
    setParty(p=>{
      const np = dc(p)
      np.forEach(a => a.hp = a.maxHp)
      return np
    })
    notify(`Team healed! −${cost}🪙`)
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

    {/* ═══ TITLE ═══ */}
    {phase==='title' && (
      <div className="title-wrap fade-in">
        <div style={{ marginBottom:'clamp(18px,3vh,30px)' }}>
          <div className="title-logo">WILDDOX</div>
          <div className="title-sub">Shadows of the Hunt</div>
          <div style={{ width:90, height:2, background:'linear-gradient(90deg,var(--gold),transparent)', marginTop:9 }}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:330, width:'100%' }}>
          {hasSave && <button className="btn btn-gold" onClick={continueGame}>CONTINUE</button>}
          <button className={'btn '+(hasSave?'btn-outline':'btn-gold')} onClick={()=>newGame('John','👦🏽',0x9A3A20)}>NEW GAME — JOHN</button>
          <button className="btn btn-outline" onClick={()=>newGame('Maisey','👧🏽',0x3A6E8A)}>NEW GAME — MAISEY</button>
        </div>
        <div style={{ marginTop:18, fontSize:12, color:'rgba(255,255,255,.4)', letterSpacing:'.06em' }}>
          Capture. Bond. Evolve. Explore.
        </div>
      </div>
    )}

    {/* ═══ STARTER SELECT ═══ */}
    {phase==='starter' && !cs && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <div className="menu-title">CHOOSE YOUR COMPANION</div>
        </div>
        <div className="menu-body">
          <div className="panel" style={{ padding:'11px 14px', display:'flex', gap:9 }}>
            <span style={{ fontSize:20 }}>👩‍🔬</span>
            <div style={{ fontSize:12, color:'var(--tx2)', fontStyle:'italic', lineHeight:1.5 }}>
              "Each starter has unique strengths. Their personality will shape your journey."
            </div>
          </div>
          {Object.values(ANIMALS).map(a=>(
            <div key={a.id} className={'starter-card'+(chosen===a.id?' sel':'')} onClick={()=>{ AUDIO.click(); setChosen(a.id) }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:14 }}>
                <div style={{ width:64, height:64, borderRadius:12, background:'linear-gradient(135deg,#1A3028,#0A2018)',
                  border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0 }}>
                  {a.id==='fox'?'🦊':a.id==='wolf'?'🐺':'🦝'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:'var(--ft)', fontSize:16, fontWeight:700 }}>{a.name}</span>
                    <span className={'badge '+(a.type==='Speed'?'b-blue':a.type==='Utility'?'b-gold':'b-red')}>{a.type}</span>
                    {chosen===a.id && <span style={{ color:'var(--green)', marginLeft:'auto' }}>✓</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--tx2)', fontStyle:'italic', marginBottom:6 }}>{a.desc}</div>
                  <div style={{ display:'flex', gap:14, fontSize:11, color:'var(--tx2)' }}>
                    <span>HP <b style={{ color:'var(--green3)' }}>{a.baseHp}</b></span>
                    <span>ATK <b style={{ color:'var(--gold3)' }}>{a.atk}</b></span>
                    <span style={{ color:'var(--blue3)' }}>→ {a.evo.name} Lv.{a.evo.level}</span>
                  </div>
                </div>
              </div>
              <div style={{ borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)' }}>
                {a.moves.map(m=>(
                  <div key={m.name} style={{ background:'rgba(0,0,0,.3)', padding:'7px 11px' }}>
                    <div style={{ fontFamily:'var(--ft)', fontSize:12, fontWeight:700 }}>{m.icon} {m.name}</div>
                    <div style={{ fontSize:10, color:'var(--tx2)' }}>
                      {m.dmg?`⚔ ${m.dmg} dmg`:m.heal?`💚 +${m.heal} HP`:m.cat==='buff'?'⬆ ATK':'⬇ DEF'} · {m.pp} PP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-gold" disabled={!chosen} style={{ opacity:chosen?1:.35 }} onClick={confirmStarter}>
            {chosen ? `CHOOSE ${ANIMALS[chosen].name.toUpperCase()} →` : 'SELECT A COMPANION'}
          </button>
        </div>
      </div>
    )}

    {/* ═══ WORLD HUD ═══ */}
    {phase==='world' && !cs && !evo && (<>
      {/* ── QUEST HUD ── */}
      {QUESTS && QUESTS[questIdx] && (
        <div style={{ position:'absolute', top: 50, left:'50%', transform:'translateX(-50%)', zIndex: 10, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <button className="panel" onClick={() => setQuestExpanded(!questExpanded)} style={{ 
            padding:'6px 16px', borderRadius:20, background:'rgba(16,28,48,0.85)', 
            border:'1px solid var(--gold)', boxShadow:'0 0 12px rgba(245,196,48,0.2)',
            display:'flex', alignItems:'center', gap:8, cursor:'pointer'
          }}>
            <span style={{ color:'var(--gold)' }}>◈</span>
            <span style={{ fontFamily:'var(--ft)', fontWeight:700, fontSize:13 }}>{QUESTS[questIdx].title}</span>
          </button>
          {questExpanded && (
            <div className="panel fade-in" style={{ marginTop: 8, padding: 12, width: 280, background:'rgba(16,28,48,0.95)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:12, marginBottom:6 }}>{QUESTS[questIdx].desc}</div>
              <div style={{ fontSize:11, color:'var(--gold3)' }}>💡 {QUESTS[questIdx].hint}</div>
            </div>
          )}
        </div>
      )}

      {/* ── OFF-SCREEN CHEVRON ── */}
      {wpScreen.visible && (
        <div style={{
          position: 'absolute', zIndex: 9, pointerEvents: 'none',
          left: wpScreen.x || (window.innerWidth/2 + Math.cos(wpScreen.angle) * (window.innerWidth/2 - 40)),
          top: wpScreen.y || (window.innerHeight/2 + Math.sin(wpScreen.angle) * (window.innerHeight/2 - 40)),
          transform: `translate(-50%, -50%) rotate(${wpScreen.angle}rad)`
        }}>
          <div style={{ color:'var(--gold)', fontSize: 24, textShadow:'0 0 8px rgba(0,0,0,0.8)' }}>▸</div>
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:`translate(-50%, 0) rotate(-${wpScreen.angle}rad)`, fontSize:10, fontWeight:700, color:'var(--gold)', marginTop:4, textShadow:'0 1px 2px #000' }}>
            {wpScreen.dist}m
          </div>
        </div>
      )}

      <div className="whud-top">
        <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid var(--gold)',
          background:'linear-gradient(135deg,#3A5878,#1A2C44)', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:18, flexShrink:0 }}>{player.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--ft)', fontWeight:700, fontSize:14 }}>{player.name}</div>
          <div style={{ fontSize:10, color:'var(--tx2)' }}>Lv.{level} · {xp}/{level*120} XP</div>
        </div>
        <div className="hud" style={{ padding:'5px 11px', fontSize:13, fontWeight:700, color:'var(--gold)' }}>🪙 {coins}</div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="hud" style={{ padding:'5px 10px', fontSize:14, cursor:'pointer' }} title="Change Track"
            onClick={()=>{ 
              AUDIO.click()
              const tracks = ['/Two_Voices_at_the_Edge.mp3', '/Beyond_the_Pine_Canopy.mp3', '/Maddy_Daddy_Go.mp3', '/The_Clearings_Call.mp3']
              let cur = AUDIO.bgm.src;
              let curPath = '';
              try { curPath = new URL(cur).pathname } catch(e) { curPath = cur }
              let i = tracks.indexOf(curPath)
              let next = tracks[(i+1)%tracks.length] || tracks[0]
              AUDIO.bgm.src = next
              if(phase === 'world') AUDIO.bgm.play().catch(()=>{})
            }}>🎵</button>
          <button className="hud" style={{ padding:'5px 10px', fontSize:14, cursor:'pointer' }} title="Mute/Unmute"
            onClick={()=>{ const m = AUDIO.toggleMute(); setMuted(m) }}>{muted?'🔇':'🔊'}</button>
        </div>
      </div>
      {lead && (
        <div className="hud ov" style={{ top:62, left:14, display:'flex', alignItems:'center', gap:8, padding:'6px 10px' }}>
          <span style={{ fontSize:20 }}>{lead.id==='fox'?'🦊':lead.id==='wolf'?'🐺':lead.id==='raccoon'?'🦝':'🐾'}</span>
          <div style={{ minWidth:90 }}>
            <div style={{ fontSize:11, fontWeight:700, fontFamily:'var(--ft)' }}>{lead.name} <span style={{ color:'var(--tx2)', fontWeight:400 }}>Lv.{lead.level}</span></div>
            <div className="bw" style={{ height:5, marginTop:2 }}>
              <div className={'bf '+hpc(pct(lead.hp,lead.maxHp))} style={{ width:pct(lead.hp,lead.maxHp)+'%' }}/>
            </div>
          </div>
        </div>
      )}
      <div className="hud ov" style={{ top:62, right:14, fontSize:11, color:'var(--tx2)', maxWidth:200, fontStyle:'italic' }}>
        💡 {TIPS[tip]}
      </div>
      {/* nav fabs */}
      <div className="whud-nav">
        {[['team','🐾'],['bag','🎒'],['map','🌎'],['scientists','🔬'],['settings','⚙️']].map(([id,ic])=>(
          <button key={id} className="nav-fab" onClick={()=>{ AUDIO.click(); setPhase(id) }}>
            {ic}{id==='team'&&party.some(a=>a.hp<a.maxHp)&&<span className="dot"/>}
          </button>
        ))}
      </div>
      {/* fixed joystick */}
      <div className="fixed-joy" onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
           onMouseDown={joyStart} onMouseMove={e=>{if(joy.active) joyMove(e)}} onMouseUp={joyEnd} onMouseLeave={joyEnd}>
        <div className="joy-base" />
        <div className="joy-knob" style={{ transform:`translate(calc(-50% + ${joy.dx}px), calc(-50% + ${joy.dy}px))` }}/>
      </div>
      <div className="ov" style={{ bottom:170, left:'50%', transform:'translateX(-50%)', fontSize:11,
        color:'rgba(255,255,255,.45)', textAlign:'center', pointerEvents:'none', whiteSpace:'nowrap' }}>
        WASD / drag joystick to move · walk into tall grass to find animals
      </div>
    </>)}

    {/* ═══ BATTLE UI ═══ */}
    {phase==='battle' && bat && !evo && (<>
      <div className="bat-top">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>
            {bat.enemy.name} <span className="badge b-gray">Lv.{bat.enemy.level||6}</span>
            {bat.isHunter && <span className="badge b-red" style={{ marginLeft:5 }}>HUNTER</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--tx2)' }}>{bat.eHp}/{bat.enemy.maxHp}</div>
        </div>
        <div className="bw" style={{ height:9 }}>
          <div className={'bf '+hpc(pct(bat.eHp,bat.enemy.maxHp))} style={{ width:pct(bat.eHp,bat.enemy.maxHp)+'%' }}/>
        </div>
      </div>

      {/* log */}
      {bat.blog.length>0 && bat.eph!=='result' && (
        <div className="bat-log hud" style={{ padding:'6px 10px' }}>
          {bat.blog.slice(-2).map((l,i)=><div key={i} style={{ fontSize:11, color:'var(--tx2)' }}>{l}</div>)}
        </div>
      )}

      {/* intro choices */}
      {bat.eph==='intro' && (
        <div className="bat-moves">
          <button className="mv" onClick={()=>{ AUDIO.click(); setBat(b=>({ ...b, eph:'battle' })) }}>
            <div className="mv-name">⚔️ Battle</div></button>
          {!bat.isHunter && <button className="mv" onClick={()=>{ AUDIO.click(); setBat(b=>({ ...b, eph:'capture' })) }}>
            <div className="mv-name">🪤 Cage</div></button>}
          {!bat.isHunter && <button className="mv" onClick={doBait}>
            <div className="mv-name">🍯 Set Bait</div></button>}
          <button className="mv" onClick={fleeBattle}><div className="mv-name">🏃 Flee</div></button>
        </div>
      )}

      {/* moves */}
      {bat.eph==='battle' && (
        <div className="bat-moves">
          {lead.moves.map((m,i)=>(
            <button key={m.name} className="mv" disabled={bat.busy||m.pp<=0} onClick={()=>doMove(m,i)}>
              <div className="mv-name">{m.icon} {m.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div className="bw" style={{ flex:1, height:3 }}>
                  <div className="bf bpp" style={{ width:Math.round(m.pp/m.mpP*100)+'%' }}/>
                </div>
                <span className="mv-pp">{m.pp}/{m.mpP}</span>
              </div>
            </button>
          ))}
          {!bat.isHunter && <button className="mv" disabled={bat.busy} onClick={()=>{ AUDIO.click(); setBat(b=>({ ...b, eph:'capture' })) }}>
            <div className="mv-name" style={{ color:'var(--blue3)' }}>🪤 Cage</div></button>}
          <button className="mv" disabled={bat.busy} onClick={fleeBattle}><div className="mv-name">🏃 Flee</div></button>
        </div>
      )}

      {/* capture */}
      {bat.eph==='capture' && (
        <div className="bat-moves" style={{ width:'min(230px,60vw)' }}>
          {cages.map(cage=>{
            const cr = calcCatch(bat.eHp, bat.enemy.maxHp, bat.enemy.cr||50, cage.bonus)
            return (
              <button key={cage.id} className={'mv'} disabled={bat.busy||cage.n<=0}
                style={{ borderColor: bat.selCage===cage.id?'var(--blue)':undefined }}
                onClick={()=>{ AUDIO.click(); setBat(b=>({ ...b, selCage:cage.id })) }}>
                <div className="mv-name">{cage.icon} {cage.name} <span style={{ marginLeft:'auto', color:cr>=60?'var(--green3)':cr>=35?'var(--gold3)':'#FF9090' }}>{cr}%</span></div>
                <div className="mv-pp">{cage.desc} · ×{cage.n}</div>
              </button>
            )
          })}
          <button className="btn btn-blue" disabled={bat.busy} style={{ padding:'11px' }} onClick={doThrow}>🪤 THROW!</button>
          <button className="mv" disabled={bat.busy} onClick={()=>{ AUDIO.click(); setBat(b=>({ ...b, eph:'battle' })) }}>
            <div className="mv-name">← Back</div></button>
        </div>
      )}

      {/* result */}
      {bat.eph==='result' && bat.res && (
        <div className="full fade-in" style={{ justifyContent:'center', alignItems:'center', background:'rgba(12,21,37,.7)', zIndex:25 }}>
          <div className="panel slide-up" style={{ padding:'26px 30px', textAlign:'center', maxWidth:340, width:'90%' }}>
            <div style={{ fontSize:54, marginBottom:10 }}>{bat.res.ok?'🎉':'😔'}</div>
            <div style={{ fontFamily:'var(--ft)', fontSize:22, fontWeight:700,
              color:bat.res.ok?'var(--green)':'var(--red)', marginBottom:8 }}>
              {bat.res.ok?(bat.res.captured?'Caught!':'Victory!'):'Defeated...'}
            </div>
            <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.6, marginBottom:18 }}>{bat.res.msg}</div>
            <button className="btn btn-gold" onClick={endBattle}>CONTINUE →</button>
          </div>
        </div>
      )}

      {/* player bar */}
      <div className="bat-bottom">
        <div style={{ width:42, height:42, borderRadius:10, border:'2px solid var(--border2)', flexShrink:0,
          background:'linear-gradient(135deg,#1A3028,#0A2018)', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:24 }}>
          {lead.id==='fox'?'🦊':lead.id==='wolf'?'🐺':lead.id==='raccoon'?'🦝':'🐾'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>
              {lead.name} <span style={{ color:'var(--tx2)', fontSize:11 }}>Lv.{lead.level}</span></span>
            <span style={{ fontSize:11, color:'var(--tx2)' }}>{bat.pHp}/{lead.maxHp}</span>
          </div>
          <div className="bw" style={{ height:8 }}>
            <div className={'bf '+hpc(pct(bat.pHp,lead.maxHp))} style={{ width:pct(bat.pHp,lead.maxHp)+'%' }}/>
          </div>
        </div>
        <Hearts bond={lead.bond}/>
      </div>
    </>)}

    {/* ═══ TEAM ═══ */}
    {phase==='team' && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <div className="menu-title">TEAM {party.length}/6</div>
          {party.some(a=>a.hp<a.maxHp) && (() => {
            const inj = party.filter(a=>a.hp<a.maxHp).length
            const cost = inj*15
            const canAfford = coins >= cost
            return (
              <button 
                className={`bsm ${canAfford ? 'bsm-blue' : 'bsm-dark'}`} 
                onClick={healTeam} 
                style={{ marginRight: 8, opacity: canAfford ? 1 : 0.5 }}
              >
                {canAfford ? '💊' : '🔒'} Heal ({cost}🪙)
              </button>
            )
          })()}
          <button className="back-btn" onClick={()=>{ AUDIO.click(); setPhase('world') }} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div className="menu-body">
          {party.map((a,i)=>(
            <div key={i} className={'team-item'+(i===0?' lead':'')}>
              <div className="team-thumb">{
                a.id==='fox'?'🦊':a.id==='wolf'?'🐺':a.id==='raccoon'?'🦝':a.id==='deer'||a.id==='cdeer'?'🦌':
                a.id==='owl'?'🦉':a.id==='bear'?'🐻':a.id==='hawk'?'🦅':a.id==='rabbit'?'🐇':
                a.id==='otter'?'🦦':a.id==='beaver'?'🦫':a.id==='snake'?'🐍':'🐾'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                  <span style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>{a.name}</span>
                  {i===0 && <span className="badge b-gold">Lead</span>}
                  {a.evolved && <span className="badge b-green">✨ Evolved</span>}
                  <span style={{ marginLeft:'auto', fontFamily:'var(--ft)', fontSize:13, fontWeight:700, color:'var(--tx2)' }}>Lv.{a.level}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <div className="bw" style={{ flex:1, height:7 }}>
                    <div className={'bf '+hpc(pct(a.hp,a.maxHp))} style={{ width:pct(a.hp,a.maxHp)+'%' }}/>
                  </div>
                  <span style={{ fontSize:10, color:'var(--tx3)', whiteSpace:'nowrap' }}>{a.hp}/{a.maxHp}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Hearts bond={a.bond}/>
                  {ANIMALS[a.id] && !a.evolved &&
                    <span style={{ fontSize:10, color:'var(--blue3)' }}>→ {ANIMALS[a.id].evo.name} Lv.{ANIMALS[a.id].evo.level}</span>}
                </div>
              </div>
              {i>0 && <button className="bsm bsm-dark" onClick={()=>{
                AUDIO.click()
                setParty(p=>{ const np=dc(p); const [it]=np.splice(i,1); np.unshift(it); return np })
              }}>Lead</button>}
            </div>
          ))}
          {party.length<6 && (
            <div style={{ border:'1.5px dashed var(--border2)', borderRadius:12, padding:16, textAlign:'center', color:'var(--tx3)' }}>
              <div style={{ fontSize:18 }}>+</div>
              <div style={{ fontSize:12 }}>{6-party.length} slot{6-party.length===1?'':'s'} open — find animals in tall grass</div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ═══ BAG ═══ */}
    {phase==='bag' && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <div className="menu-title">INVENTORY</div>
          <button className="back-btn" onClick={()=>{ AUDIO.click(); setPhase('world') }} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div className="menu-body">
          <div className="panel" style={{ padding:18, textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'space-around' }}>
              <div><div style={{ fontSize:22 }}>🪙</div>
                <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700, color:'var(--gold)' }}>{coins}</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>Coins</div></div>
              <div><div style={{ fontSize:22 }}>⭐</div>
                <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700, color:'var(--blue3)' }}>{xp}</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>XP · Lv.{level}</div></div>
              <div><div style={{ fontSize:22 }}>🐾</div>
                <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700 }}>{party.length}/6</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>Team</div></div>
            </div>
          </div>
          {cages.map(c=>(
            <div key={c.id} className="panel" style={{ padding:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:26 }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--tx2)' }}>{c.desc}</div>
                </div>
              </div>
              <div style={{ fontFamily:'var(--ft)', fontSize:24, fontWeight:700,
                color:c.n>3?'var(--green)':c.n>0?'var(--gold)':'var(--red)' }}>×{c.n}</div>
            </div>
          ))}
          <div className="panel" style={{ padding:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>💊 Heal Team</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>15🪙 per injured animal</div>
            </div>
            <button className="bsm bsm-blue" onClick={healTeam}>Heal ({party.filter(a=>a.hp<a.maxHp).length*15}🪙)</button>
          </div>
        </div>
      </div>
    )}

    {/* ═══ MAP ═══ */}
    {phase==='map' && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <button className="back-btn" onClick={()=>{ AUDIO.click(); setPhase('world') }}>←</button>
          <div className="menu-title">MAP — UNITED STATES</div>
        </div>
        <div className="menu-body">
          <div className="panel" style={{ height:'min(46vw,320px)', position:'relative', overflow:'hidden',
            background:'linear-gradient(160deg,#1A3060,#0E2040)' }}>
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.22 }} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">
              <path d="M40,82 L60,62 L100,56 L140,50 L200,48 L260,50 L310,56 L340,66 L360,82 L354,122 L338,142 L310,156 L270,168 L240,172 L200,176 L160,174 L120,170 L88,162 L58,148 L40,130 Z"
                fill="rgba(50,120,60,.65)" stroke="rgba(100,180,80,.5)" strokeWidth="1.5"/>
              <path d="M270,168 L278,178 L280,194 L272,204 L264,198 L263,176" fill="rgba(50,120,60,.5)" stroke="rgba(100,180,80,.35)" strokeWidth="1"/>
            </svg>
            {REGIONS.map(r=>(
              <div key={r.id} className={'mreg'+(r.curr?' curr':'')+(!r.open?' lock':'')} style={{ left:r.x, top:r.y }}>
                {r.emoji} {r.name}{r.curr?' ✓':!r.open?' 🔒':''}
              </div>
            ))}
            <div style={{ position:'absolute', left:'72%', top:'20%', transform:'translate(-50%,-50%)', fontSize:15 }}>📍</div>
          </div>
          {REGIONS.map(r=>(
            <div key={r.id} className="panel" style={{ padding:12, display:'flex', alignItems:'center', gap:12, opacity:r.open?1:.45 }}>
              <span style={{ fontSize:26 }}>{r.emoji}</span>
              <div style={{ flex:1, fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>{r.name}</div>
              {r.curr ? <span className="badge b-green">Current</span> :
               r.open ? <span className="badge b-blue">Available</span> :
                        <span className="badge b-gray">Locked</span>}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ═══ SCIENTISTS ═══ */}
    {phase==='scientists' && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <button className="back-btn" onClick={()=>{ AUDIO.click(); setPhase('world') }}>←</button>
          <div className="menu-title">SCIENTISTS & CHARACTERS</div>
        </div>
        <div className="menu-body">
          {SCIENTISTS.map(s=>{
            const unlocked = level >= s.ulv
            return (
              <div key={s.id} className="panel" style={{ padding:13, display:'flex', alignItems:'center', gap:13, opacity:unlocked?1:.45 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', border:'2px solid var(--border2)',
                  background:'linear-gradient(135deg,#1E2440,#0E1428)', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:28, flexShrink:0 }}>{s.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>
                    {s.name}{s.ulv===0 && <span className="badge b-green" style={{ marginLeft:7 }}>Active</span>}</div>
                  <div style={{ fontSize:12, color:'var(--tx2)' }}>{s.spec}</div>
                  <div style={{ fontSize:11, color:'var(--blue3)' }}>📍 {s.region}{!unlocked && ` · Requires Lv.${s.ulv}`}</div>
                </div>
              </div>
            )
          })}
          <div className="panel" style={{ padding:13, display:'flex', alignItems:'center', gap:13, borderColor:'rgba(224,64,64,.3)' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', border:'2px solid rgba(224,64,64,.4)',
              background:'linear-gradient(135deg,#2A1A1A,#140A0A)', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:28, flexShrink:0 }}>🧑</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>Mark <span className="badge b-red" style={{ marginLeft:6 }}>Rival</span></div>
              <div style={{ fontSize:12, color:'var(--tx2)' }}>Starting to question Sara's methods...</div>
              {flags.betrayal && <div style={{ fontSize:11, color:'var(--red)' }}>⚠ Leaning toward The Hunters</div>}
            </div>
          </div>
          <div className="panel" style={{ padding:14, borderColor:'rgba(224,64,64,.22)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:9 }}>
              <span style={{ fontSize:34 }}>💀</span>
              <div>
                <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700, color:'rgba(224,80,64,.9)' }}>The Hunters</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>Illegal organization. Forces evolution via serums.</div>
              </div>
            </div>
            <div style={{ background:'rgba(224,64,64,.08)', border:'1px solid rgba(224,64,64,.2)', borderRadius:8, padding:'8px 12px',
              fontSize:11, color:'rgba(224,90,80,.85)', fontWeight:700, letterSpacing:'.05em' }}>
              {flags.firstHunter ? '⚡ SIGNAL DETECTED — NORTHEAST FORESTS' : '⬛ NO SIGNAL DETECTED'}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ SETTINGS ═══ */}
    {phase==='settings' && (
      <div className="menu-screen fade-in">
        <div className="menu-head">
          <div className="menu-title">SETTINGS</div>
          <button className="back-btn" onClick={()=>{ AUDIO.click(); setPhase('world') }} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div className="menu-body" style={{ alignItems:'center', paddingTop:40, gap:20 }}>
          <div style={{ fontSize:60, marginBottom:10 }}>⚙️</div>

          {/* Soundtrack Selector */}
          <div className="panel" style={{ padding: 20, width: '100%', maxWidth: 300, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--gold)', fontFamily:'var(--ft)' }}>Soundtrack</h3>
            
            <select 
              className="btn btn-outline" 
              style={{ width: '100%', appearance: 'none', textAlign: 'center', marginBottom: 10, background: 'var(--bg)', color: 'var(--tx)' }}
              onChange={(e) => {
                AUDIO.click()
                if(e.target.value === 'custom') {
                  document.getElementById('customAudioInput').click()
                  return
                }
                AUDIO.bgm.src = e.target.value;
                if(phase === 'world') AUDIO.bgm.play().catch(()=>{});
              }}
            >
              <option value="/Two_Voices_at_the_Edge.mp3">Two Voices at the Edge (Default)</option>
              <option value="/Beyond_the_Pine_Canopy.mp3">Beyond the Pine Canopy</option>
              <option value="/Maddy_Daddy_Go.mp3">Maddy Daddy Go</option>
              <option value="/The_Clearings_Call.mp3">The Clearing's Call</option>
              <option value="custom">Upload Custom MP3...</option>
            </select>
            
            <input 
              type="file" 
              id="customAudioInput" 
              accept="audio/*" 
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if(file) {
                   const url = URL.createObjectURL(file)
                   AUDIO.bgm.src = url
                   if(phase === 'world') AUDIO.bgm.play().catch(()=>{})
                }
              }}
            />
            
            <div style={{ fontSize:12, color:'var(--tx2)' }}>
              Select a built-in track or upload your own MP3 to play in the background.
            </div>
          </div>

          <button className="btn btn-gold" style={{ maxWidth:260, marginTop:10 }} onClick={()=>{
            AUDIO.click()
            try{
              localStorage.setItem(SAVE_KEY, JSON.stringify({ player, party, coins, xp, level, cages, flags }))
              notify('Game Saved Successfully!')
            }catch(e){
              notify('Failed to save game.')
            }
          }}>💾 SAVE GAME</button>
          <button className="btn btn-outline" style={{ maxWidth:260 }} onClick={()=>{
            AUDIO.click()
            if(window.confirm('Are you sure you want to start over? All progress will be lost!')){
              localStorage.removeItem(SAVE_KEY)
              window.location.reload()
            }
          }}>⚠️ START OVER</button>
          <div style={{ fontSize:12, color:'var(--tx2)', textAlign:'center', marginTop:10 }}>
            Your progress is also auto-saved as you play.<br/>Use "Start Over" if you wish to reset your journey.
          </div>

          
          <div className="panel" style={{ padding: 20, marginTop: 20, textAlign: 'center', maxWidth: 300 }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--gold)', fontFamily:'var(--ft)' }}>About the Creators</h3>
            <img src="/creators.png" alt="Merrick and Maddox Lee" style={{ width: '100%', borderRadius: 12, marginBottom: 16, border: '2px solid rgba(245,196,48,0.3)' }} />
            <div style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.5, marginBottom: 8 }}>
              <strong>Merrick & Maddox Lee</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 16 }}>
              A father and son team. Built with love, curiosity, and a shared passion for wildlife and adventure!
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--tx2)', margin: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              Merrick saw how much Maddox loved playing similar games and decided to create one with him, featuring real animals. And yes, "Wilddox" is a mix of the Wild and Maddox!
            </p>
          </div>
        </div>
      </div>
    )}

    {/* ═══ CUTSCENE ═══ */}
    {cs && csData && (
      <div className="cs fade-in" onClick={advanceCS} style={{ background:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5, zIndex:35 }}>
          {csData.lines.map((_,i)=>(
            <div key={i} style={{ width:cs.line===i?20:6, height:5, borderRadius:999,
              background:cs.line===i?'var(--gold)':'rgba(255,255,255,.18)', transition:'all .3s' }}/>
          ))}
        </div>

        <div style={{ width:'100%', maxWidth:700, margin:'0 auto', position:'relative' }}>
          
          {/* Character Emoji Sticking out */}
          <div className={`cs-em ${cs.typing ? 'talking' : ''}`} style={{ 
            position:'absolute', right:24, bottom:'100%', marginBottom:-16,
            fontSize:'clamp(80px,14vw,110px)', filter:'drop-shadow(0 8px 24px rgba(0,0,0,.6))',
            zIndex:31, transformOrigin:'bottom center' 
          }}>{csData.em}</div>

          {/* Persona-style Name Tag */}
          <div style={{
            position:'relative', left:16, top:10, zIndex:32,
            display:'inline-block', background:'var(--gold)', color:'#000',
            padding:'6px 20px', fontFamily:'var(--ft)', fontSize:18, fontWeight:900,
            textTransform:'uppercase', letterSpacing:'.05em',
            transform:'skewX(-10deg)', boxShadow:'2px 4px 12px rgba(0,0,0,.5)'
          }}>
            <div style={{ transform:'skewX(10deg)' }}>{csData.sp}</div>
          </div>

          {/* Main Dialog Box */}
          <div className="slide-up" key={cs.line} style={{
            background:'rgba(16,22,34,.95)', borderTop:'4px solid var(--gold)',
            boxShadow:'0 -4px 30px rgba(0,0,0,.6)', padding:'36px 24px 24px',
            position:'relative', zIndex:30
          }}>
            <div style={{ fontSize:22, lineHeight:1.6, fontStyle:'italic', color:'#fff', minHeight:85 }}>
              "<Typewriter 
                 text={csData.lines[cs.line].replace('{p}', player.name||'Explorer')} 
                 typing={cs.typing} 
                 setTyping={handleSetCsTyping} 
              />"
            </div>

            {/* Huge Next Button */}
            <button className="pulse-glow" onClick={(e)=>{ e.stopPropagation(); advanceCS(); }} style={{
              display:'block', width:'100%', marginTop:24,
              background:'linear-gradient(to right, #F5C430, #D4A017)', color:'#000', border:'none',
              borderRadius:16, padding:'20px', fontSize:22, fontWeight:900,
              fontFamily:'var(--ft)', textTransform:'uppercase',
              cursor:'pointer'
            }}>
              {cs.typing ? 'Skip ⏭' : (cs.line < csData.lines.length-1 ? 'Tap to Continue ➔' : "Let's Go ➔")}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ═══ EVOLUTION ═══ */}
    {evo && (
      <div className="full fade-in" style={{ zIndex:35, background:'linear-gradient(180deg,#040810,#0A1018,#040810)',
        justifyContent:'center', alignItems:'center', gap:16, padding:24 }}>
        <div style={{ fontFamily:'var(--ft)', fontSize:12, color:'rgba(245,196,48,.55)',
          letterSpacing:'.2em', textTransform:'uppercase' }}>— Evolution —</div>
        <div style={{ fontSize:'clamp(70px,11vw,96px)', animation:'evoGlow 1.4s ease-in-out 3' }}>
          {party[0]?.id==='fox'?'🦊':party[0]?.id==='wolf'?'🐺':'🦝'}
        </div>
        <div style={{ fontFamily:'var(--ft)', fontSize:'clamp(22px,3.6vw,30px)', fontWeight:700,
          color:'var(--gold)', textAlign:'center', lineHeight:1.25 }}>
          {evo.old.name} evolved<br/>into {evo.evo.name}!
        </div>
        <div style={{ fontSize:13, color:'var(--tx2)', textAlign:'center', fontStyle:'italic', maxWidth:300, lineHeight:1.6 }}>
          {evo.evo.desc}
        </div>
        <button className="btn btn-gold" style={{ width:'auto', padding:'13px 44px' }}
          onClick={()=>{ AUDIO.click(); setEvo(null); startCS('evo') }}>AMAZING! →</button>
      </div>
    )}

    {/* ═══ NOTIF ═══ */}
    {notif && <div className="notif slide-up">{notif}</div>}
  </div>
  )
}
