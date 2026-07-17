/* ── MapScreen ── */
import React from 'react'
import { REGIONS } from '../game/data.js'
import { Icon } from './icons.jsx'
import { Badge } from './kit.jsx'

export function MapScreen({ onBack }) {
  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <button className="back-btn" onClick={onBack}>←</button>
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
          {REGIONS.map(r => (
            <div key={r.id} className={'mreg' + (r.curr ? ' curr' : '') + (!r.open ? ' lock' : '')} style={{ left:r.x, top:r.y }}>
              <Icon name={r.icon} size={12} /> {r.name}{r.curr ? <> <Icon name="check" size={10} /></> : !r.open ? <> <Icon name="lock" size={10} /></> : ''}
            </div>
          ))}
          <div style={{ position:'absolute', left:'72%', top:'20%', transform:'translate(-50%,-50%)' }}><Icon name="pin" size={15} /></div>
        </div>
        {REGIONS.map(r => (
          <div key={r.id} className="panel" style={{ padding:12, display:'flex', alignItems:'center', gap:12, opacity:r.open ? 1 : .45 }}>
            <Icon name={r.icon} size={26} />
            <div style={{ flex:1, fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}>{r.name}</div>
            {r.curr ? <Badge color="green">Current</Badge> :
             r.open ? <Badge color="blue">Available</Badge> :
                       <Badge color="gray">Locked</Badge>}
          </div>
        ))}
      </div>
    </div>
  )
}
