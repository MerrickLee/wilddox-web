/* ── BattleScreen ── */
import React from 'react'
import { pct, calcCatch } from '../game/data.js'
import { Icon, animalIcon } from './icons.jsx'
import { Bar, Badge, Btn, Hearts, hpc } from './kit.jsx'

export function BattleScreen({ bat, lead, party, cages, doMove, doBait, doThrow, fleeBattle, endBattle, doSwitch, setBat }) {
  return (<>
    {/* ── ENEMY BAR ── */}
    <div className="bat-top">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>
          {bat.enemy.name} <Badge color="gray">Lv.{bat.enemy.level||6}</Badge>
          {bat.isHunter && <Badge color="red" style={{ marginLeft:5 }}>HUNTER</Badge>}
        </div>
        <div style={{ fontSize:12, color:'var(--tx2)' }}>{bat.eHp}/{bat.enemy.maxHp}</div>
      </div>
      <Bar value={bat.eHp} max={bat.enemy.maxHp} height={9} />
    </div>

    {/* ── LOG ── */}
    {bat.blog.length > 0 && bat.eph !== 'result' && (
      <div className="bat-log hud" style={{ padding:'6px 10px' }}>
        {bat.blog.slice(-2).map((l, i) => <div key={i} style={{ fontSize:11, color:'var(--tx2)' }}>{l}</div>)}
      </div>
    )}

    {/* ── INTRO CHOICES ── */}
    {bat.eph === 'intro' && (
      <div className="bat-moves">
        <button className="mv" onClick={() => setBat(b => ({ ...b, eph:'battle' }))}>
          <div className="mv-name"><Icon name="sword" size={13} /> Battle</div></button>
        {!bat.isHunter && <button className="mv" onClick={() => setBat(b => ({ ...b, eph:'capture' }))}>
          <div className="mv-name"><Icon name="trap" size={13} /> Cage</div></button>}
        {party.length > 1 && <button className="mv" onClick={() => setBat(b => ({ ...b, eph:'switch' }))}>
          <div className="mv-name"><Icon name="loop" size={13} /> Switch</div></button>}
        {!bat.isHunter && <button className="mv" onClick={doBait}>
          <div className="mv-name"><Icon name="honey" size={13} /> Set Bait</div></button>}
        <button className="mv" onClick={fleeBattle}><div className="mv-name"><Icon name="flee" size={13} /> Flee</div></button>
      </div>
    )}

    {/* ── SWITCH MENU ── */}
    {bat.eph === 'switch' && (
      <div className="bat-moves" style={{ width:'min(300px,80vw)' }}>
        {party.slice(1).map((a, i) => (
          <button key={i+1} className="mv" disabled={bat.busy || a.hp <= 0} onClick={() => doSwitch(i+1)} style={{ opacity: a.hp <= 0 ? 0.5 : 1 }}>
            <div className="mv-name"><Icon name={animalIcon(a.id)} size={13} /> {a.name} <span style={{fontSize:11, color:'var(--tx2)'}}>Lv.{a.level}</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Bar value={a.hp} max={a.maxHp} height={3} style={{ flex:1 }} />
              <span className="mv-pp">{a.hp}/{a.maxHp} HP</span>
            </div>
          </button>
        ))}
        <button className="mv" disabled={bat.busy} onClick={() => setBat(b => ({ ...b, eph:'intro' }))}>
          <div className="mv-name">← Back</div></button>
      </div>
    )}

    {/* ── MOVES ── */}
    {bat.eph === 'battle' && (
      <div className="bat-moves">
        {lead.moves.map((m, i) => (
          <button key={m.name} className="mv" disabled={bat.busy || m.pp <= 0} onClick={() => doMove(m, i)}>
            <div className="mv-name"><Icon name={m.icon} size={13} /> {m.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div className="bw" style={{ flex:1, height:3 }}>
                <div className="bf bpp" style={{ width: Math.round(m.pp / m.mpP * 100) + '%' }} />
              </div>
              <span className="mv-pp">{m.pp}/{m.mpP}</span>
            </div>
          </button>
        ))}
        {!bat.isHunter && <button className="mv" disabled={bat.busy} onClick={() => setBat(b => ({ ...b, eph:'capture' }))}>
          <div className="mv-name" style={{ color:'var(--blue3)' }}><Icon name="trap" size={13} /> Cage</div></button>}
        <button className="mv" disabled={bat.busy} onClick={fleeBattle}><div className="mv-name"><Icon name="flee" size={13} /> Flee</div></button>
      </div>
    )}

    {/* ── CAPTURE ── */}
    {bat.eph === 'capture' && (
      <div className="bat-moves" style={{ width:'min(230px,60vw)' }}>
        {cages.map(cage => {
          const cr = calcCatch(bat.eHp, bat.enemy.maxHp, bat.enemy.cr || 50, cage.bonus)
          return (
            <button key={cage.id} className="mv" disabled={bat.busy || cage.n <= 0}
              style={{ borderColor: bat.selCage === cage.id ? 'var(--blue)' : undefined }}
              onClick={() => setBat(b => ({ ...b, selCage: cage.id }))}>
              <div className="mv-name"><Icon name={cage.icon} size={13} /> {cage.name} <span style={{ marginLeft:'auto', color: cr >= 60 ? 'var(--green3)' : cr >= 35 ? 'var(--gold3)' : '#FF9090' }}>{cr}%</span></div>
              <div className="mv-pp">{cage.desc} · ×{cage.n}</div>
            </button>
          )
        })}
        <Btn variant="blue" disabled={bat.busy} style={{ padding:'11px' }} onClick={doThrow}>
          <Icon name="trap" size={14} /> THROW!
        </Btn>
        <button className="mv" disabled={bat.busy} onClick={() => setBat(b => ({ ...b, eph:'battle' }))}>
          <div className="mv-name">← Back</div></button>
      </div>
    )}

    {/* ── RESULT ── */}
    {bat.eph === 'result' && bat.res && (
      <div className="full fade-in" style={{ justifyContent:'center', alignItems:'center', background:'rgba(12,21,37,.7)', zIndex:25 }}>
        <div className="panel slide-up" style={{ padding:'26px 30px', textAlign:'center', maxWidth:340, width:'90%' }}>
          <div style={{ marginBottom:10 }}><Icon name={bat.res.ok ? 'celebrate' : 'sad'} size={54} /></div>
          <div style={{ fontFamily:'var(--ft)', fontSize:22, fontWeight:700,
            color: bat.res.ok ? 'var(--green)' : 'var(--red)', marginBottom:8 }}>
            {bat.res.ok ? (bat.res.captured ? 'Caught!' : 'Victory!') : 'Defeated...'}
          </div>
          <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.6, marginBottom:18 }}>{bat.res.msg}</div>
          <Btn variant="gold" onClick={endBattle}>CONTINUE →</Btn>
        </div>
      </div>
    )}

    {/* ── PLAYER BAR ── */}
    <div className="bat-bottom">
      <div style={{ width:42, height:42, borderRadius:10, border:'2px solid var(--border2)', flexShrink:0,
        background:'linear-gradient(135deg,#1A3028,#0A2018)', display:'flex', alignItems:'center',
        justifyContent:'center' }}>
        <Icon name={animalIcon(lead.id)} size={24} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>
            {lead.name} <span style={{ color:'var(--tx2)', fontSize:11 }}>Lv.{lead.level}</span></span>
          <span style={{ fontSize:11, color:'var(--tx2)' }}>{bat.pHp}/{lead.maxHp}</span>
        </div>
        <Bar value={bat.pHp} max={lead.maxHp} height={8} />
      </div>
      <Hearts bond={lead.bond}/>
    </div>
  </>)
}
