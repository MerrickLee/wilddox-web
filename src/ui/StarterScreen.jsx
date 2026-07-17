/* ── StarterScreen ── */
import React from 'react'
import { ANIMALS } from '../game/data.js'
import { Icon, animalIcon } from './icons.jsx'
import { Btn, Badge } from './kit.jsx'

export function StarterScreen({ chosen, onChoose, onConfirm }) {
  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <div className="menu-title">CHOOSE YOUR COMPANION</div>
      </div>
      <div className="menu-body">
        <div className="panel" style={{ padding:'11px 14px', display:'flex', gap:9 }}>
          <Icon name="scientist" size={20} />
          <div style={{ fontSize:12, color:'var(--tx2)', fontStyle:'italic', lineHeight:1.5 }}>
            "Each starter has unique strengths. Their personality will shape your journey."
          </div>
        </div>
        {Object.values(ANIMALS).map(a => (
          <div key={a.id} className={'starter-card' + (chosen === a.id ? ' sel' : '')} onClick={() => onChoose(a.id)}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:14 }}>
              <div style={{ width:64, height:64, borderRadius:12, background:'linear-gradient(135deg,#1A3028,#0A2018)',
                border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={animalIcon(a.id)} size={36} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontFamily:'var(--ft)', fontSize:16, fontWeight:700 }}>{a.name}</span>
                  <Badge color={a.type === 'Speed' ? 'blue' : a.type === 'Utility' ? 'gold' : 'red'}>{a.type}</Badge>
                  {chosen === a.id && <span style={{ color:'var(--green)', marginLeft:'auto' }}><Icon name="check" size={14} /></span>}
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
              {a.moves.map(m => (
                <div key={m.name} style={{ background:'rgba(0,0,0,.3)', padding:'7px 11px' }}>
                  <div style={{ fontFamily:'var(--ft)', fontSize:12, fontWeight:700 }}>
                    <Icon name={m.icon} size={12} /> {m.name}
                  </div>
                  <div style={{ fontSize:10, color:'var(--tx2)' }}>
                    {m.dmg ? <><Icon name="sword" size={10} /> {m.dmg} dmg</> :
                     m.heal ? <><Icon name="heal" size={10} /> +{m.heal} HP</> :
                     m.cat === 'buff' ? <><Icon name="arrow-up" size={10} /> ATK</> :
                     <><Icon name="arrow-down" size={10} /> DEF</>} · {m.pp} PP
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Btn variant="gold" disabled={!chosen} style={{ opacity: chosen ? 1 : .35 }} onClick={onConfirm}>
          {chosen ? `CHOOSE ${ANIMALS[chosen].name.toUpperCase()} →` : 'SELECT A COMPANION'}
        </Btn>
      </div>
    </div>
  )
}
