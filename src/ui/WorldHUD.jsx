/* ── WorldHUD ── */
import React, { useRef, useEffect } from 'react'
import { QUESTS, TIPS, pct } from '../game/data.js'
import { Icon, animalIcon } from './icons.jsx'
import { Bar, hpc } from './kit.jsx'

/* circular canvas minimap fed by engine.getMinimapInfo() */
function Minimap({ engine }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!engine || !ref.current) return
    const cv = ref.current, ctx = cv.getContext('2d')
    const S = 104, R = S/2
    cv.width = S*2; cv.height = S*2
    ctx.scale(2, 2)
    let raf
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const info = engine.getMinimapInfo ? engine.getMinimapInfo() : null
      if (!info) return
      const k = (R-6) / info.radius                     // world→px
      const cx = R, cy = R
      ctx.clearRect(0, 0, S, S)
      /* terrain disc */
      ctx.fillStyle = '#1D3A22'
      ctx.beginPath(); ctx.arc(cx, cy, R-2, 0, Math.PI*2); ctx.fill()
      /* river band */
      ctx.fillStyle = 'rgba(90,160,210,.75)'
      ctx.fillRect(cx + info.river.x*k - info.river.w*k/2, 4, info.river.w*k, S-8)
      /* grass encounter zones */
      for (const z of info.zones) {
        ctx.fillStyle = 'rgba(120,200,90,.4)'
        ctx.beginPath(); ctx.arc(cx + z.x*k, cy + z.z*k, Math.max(3, z.r*k), 0, Math.PI*2); ctx.fill()
      }
      /* wandering deer */
      ctx.fillStyle = 'rgba(230,200,150,.9)'
      ctx.beginPath(); ctx.arc(cx + info.deer.x*k, cy + info.deer.z*k, 2, 0, Math.PI*2); ctx.fill()
      /* waypoint */
      if (info.waypoint) {
        ctx.fillStyle = '#F5C430'
        ctx.beginPath(); ctx.arc(cx + info.waypoint.x*k, cy + info.waypoint.z*k, 3.4, 0, Math.PI*2); ctx.fill()
      }
      /* player arrow */
      const px = cx + info.player.x*k, py = cy + info.player.z*k
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(-info.player.yaw + Math.PI)
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3.6, 4); ctx.lineTo(-3.6, 4); ctx.closePath(); ctx.fill()
      ctx.restore()
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [engine])
  return (
    <div className="minimap">
      <canvas ref={ref} />
      <div className="region">NORTHEAST FORESTS</div>
    </div>
  )
}

export function WorldHUD({
  engine,
  player, party, coins, xp, level, tip, muted,
  questIdx, questExpanded, onToggleQuestExpanded,
  wpScreen,
  joy, joyStart, joyMove, joyEnd,
  onPhase, onMuteToggle, onTrackChange,
}) {
  const lead = party[0]

  return (<>
    {/* ── VIGNETTE + MINIMAP ── */}
    <div className="world-vignette" />
    <Minimap engine={engine} />

    {/* ── QUEST HUD ── */}
    {QUESTS && QUESTS[questIdx] && (
      <div style={{ position:'absolute', top: 50, left:'50%', transform:'translateX(-50%)', zIndex: 10, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <button className="panel" onClick={onToggleQuestExpanded} style={{
          padding:'6px 16px', borderRadius:20, background:'rgba(16,28,48,0.85)',
          border:'1px solid var(--gold)', boxShadow:'0 0 12px rgba(245,196,48,0.2)',
          display:'flex', alignItems:'center', gap:8, cursor:'pointer'
        }}>
          <Icon name="quest" size={14} style={{ color:'var(--gold)' }} />
          <span style={{ fontFamily:'var(--ft)', fontWeight:700, fontSize:13 }}>{QUESTS[questIdx].title}</span>
        </button>
        {questExpanded && (
          <div className="panel fade-in" style={{ marginTop: 8, padding: 12, width: 280, background:'rgba(16,28,48,0.95)', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize:12, marginBottom:6 }}>{QUESTS[questIdx].desc}</div>
            <div style={{ fontSize:11, color:'var(--gold3)' }}><Icon name="bulb" size={11} /> {QUESTS[questIdx].hint}</div>
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

    {/* ── TOP BAR ── */}
    <div className="whud-top">
      <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid var(--gold)',
        background:'linear-gradient(135deg,#3A5878,#1A2C44)', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:18, flexShrink:0 }}>{player.emoji}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--ft)', fontWeight:700, fontSize:14 }}>{player.name}</div>
        <div style={{ fontSize:10, color:'var(--tx2)' }}>Lv.{level} · {xp}/{level*120} XP</div>
      </div>
      <div className="hud" style={{ padding:'5px 11px', fontSize:13, fontWeight:700, color:'var(--gold)' }}>
        <Icon name="coin" size={14} /> {coins}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button className="hud" style={{ padding:'5px 10px', fontSize:14, cursor:'pointer' }} title="Change Track"
          onClick={onTrackChange}><Icon name="music" size={16} /></button>
        <button className="hud" style={{ padding:'5px 10px', fontSize:14, cursor:'pointer' }} title="Mute/Unmute"
          onClick={onMuteToggle}><Icon name={muted ? 'mute' : 'sound'} size={16} /></button>
      </div>
    </div>

    {/* ── LEAD ANIMAL ── */}
    {lead && (
      <div className="hud ov" style={{ top:62, left:14, display:'flex', alignItems:'center', gap:8, padding:'6px 10px' }}>
        <Icon name={animalIcon(lead.id)} size={20} />
        <div style={{ minWidth:90 }}>
          <div style={{ fontSize:11, fontWeight:700, fontFamily:'var(--ft)' }}>{lead.name} <span style={{ color:'var(--tx2)', fontWeight:400 }}>Lv.{lead.level}</span></div>
          <Bar value={lead.hp} max={lead.maxHp} height={5} />
        </div>
      </div>
    )}

    {/* ── TIP (below minimap) ── */}
    <div className="hud ov" style={{ top:196, right:14, fontSize:11, color:'var(--tx2)', maxWidth:150, fontStyle:'italic' }}>
      <Icon name="bulb" size={11} /> {TIPS[tip]}
    </div>

    {/* ── NAV RAIL — framed squares with labels ── */}
    <div className="whud-nav">
      {[['team','team','Team'],['bag','bag','Bag'],['map','map','Map'],['scientists','lab','Allies'],['settings','gear','Menu']].map(([id,ic,label]) => (
        <button key={id} className="nav-fab" onClick={() => onPhase(id)}>
          <Icon name={ic} size={19} />
          <span className="fab-label">{label}</span>
          {id==='team'&&party.some(a=>a.hp<a.maxHp)&&<span className="dot"/>}
        </button>
      ))}
    </div>

    {/* ── JOYSTICK ── */}
    <div className="fixed-joy" onTouchStart={joyStart} onTouchMove={joyMove} onTouchEnd={joyEnd}
         onMouseDown={joyStart} onMouseMove={e=>{if(joy.active) joyMove(e)}} onMouseUp={joyEnd} onMouseLeave={joyEnd}>
      <div className="joy-base" />
      <div className="joy-knob" style={{ transform:`translate(calc(-50% + ${joy.dx}px), calc(-50% + ${joy.dy}px))` }}/>
    </div>

    {/* ── MOVE HINT ── */}
    <div className="ov" style={{ bottom:170, left:'50%', transform:'translateX(-50%)', fontSize:11,
      color:'rgba(255,255,255,.45)', textAlign:'center', pointerEvents:'none', whiteSpace:'nowrap' }}>
      WASD / drag joystick to move · walk into tall grass to find animals
    </div>
  </>)
}
