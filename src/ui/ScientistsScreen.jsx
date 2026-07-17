/* ── ScientistsScreen ── */
import React from 'react'
import { SCIENTISTS } from '../game/data.js'
import { Icon } from './icons.jsx'
import { Badge } from './kit.jsx'

export function ScientistsScreen({ level, flags, onBack }) {
  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="menu-title">SCIENTISTS & CHARACTERS</div>
      </div>
      <div className="menu-body">
        {SCIENTISTS.map(s => {
          const unlocked = level >= s.ulv
          return (
            <div key={s.id} className="panel" style={{ padding:13, display:'flex', alignItems:'center', gap:13, opacity: unlocked ? 1 : .45 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', border:'2px solid var(--border2)',
                background:'linear-gradient(135deg,#1E2440,#0E1428)', display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0 }}><Icon name={s.icon} size={28} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>
                  {s.name}{s.ulv === 0 && <Badge color="green" style={{ marginLeft:7 }}>Active</Badge>}</div>
                <div style={{ fontSize:12, color:'var(--tx2)' }}>{s.spec}</div>
                <div style={{ fontSize:11, color:'var(--blue3)' }}><Icon name="pin" size={11} /> {s.region}{!unlocked && ` · Requires Lv.${s.ulv}`}</div>
              </div>
            </div>
          )
        })}

        {/* Mark — Rival */}
        <div className="panel" style={{ padding:13, display:'flex', alignItems:'center', gap:13, borderColor:'rgba(224,64,64,.3)' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', border:'2px solid rgba(224,64,64,.4)',
            background:'linear-gradient(135deg,#2A1A1A,#140A0A)', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0 }}><Icon name="rival" size={28} /></div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>Mark <Badge color="red" style={{ marginLeft:6 }}>Rival</Badge></div>
            <div style={{ fontSize:12, color:'var(--tx2)' }}>Starting to question Sara's methods...</div>
            {flags.betrayal && <div style={{ fontSize:11, color:'var(--red)' }}><Icon name="warn" size={11} /> Leaning toward The Hunters</div>}
          </div>
        </div>

        {/* The Hunters */}
        <div className="panel" style={{ padding:14, borderColor:'rgba(224,64,64,.22)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:9 }}>
            <Icon name="skull" size={34} />
            <div>
              <div style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700, color:'rgba(224,80,64,.9)' }}>The Hunters</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>Illegal organization. Forces evolution via serums.</div>
            </div>
          </div>
          <div style={{ background:'rgba(224,64,64,.08)', border:'1px solid rgba(224,64,64,.2)', borderRadius:8, padding:'8px 12px',
            fontSize:11, color:'rgba(224,90,80,.85)', fontWeight:700, letterSpacing:'.05em' }}>
            {flags.firstHunter
              ? <><Icon name="bolt" size={11} /> SIGNAL DETECTED — NORTHEAST FORESTS</>
              : <><Icon name="lock" size={11} /> NO SIGNAL DETECTED</>}
          </div>
        </div>
      </div>
    </div>
  )
}
