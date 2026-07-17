/* ── Cutscene ── */
import React from 'react'
import { STORY } from '../game/data.js'
import { Icon } from './icons.jsx'
import { Typewriter } from './kit.jsx'

export function Cutscene({ cs, csData, player, onAdvance, onSetCsTyping }) {
  return (
    <div className="cs fade-in" onClick={onAdvance} style={{ background:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
      {/* Progress dots */}
      <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5, zIndex:35 }}>
        {csData.lines.map((_, i) => (
          <div key={i} style={{ width: cs.line === i ? 20 : 6, height:5, borderRadius:999,
            background: cs.line === i ? 'var(--gold)' : 'rgba(255,255,255,.18)', transition:'all .3s' }}/>
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
               text={csData.lines[cs.line].replace('{p}', player.name || 'Explorer')}
               typing={cs.typing}
               setTyping={onSetCsTyping}
            />"
          </div>

          {/* Huge Next Button */}
          <button className="pulse-glow" onClick={(e) => { e.stopPropagation(); onAdvance(); }} style={{
            display:'block', width:'100%', marginTop:24,
            background:'linear-gradient(to right, #F5C430, #D4A017)', color:'#000', border:'none',
            borderRadius:16, padding:'20px', fontSize:22, fontWeight:900,
            fontFamily:'var(--ft)', textTransform:'uppercase',
            cursor:'pointer'
          }}>
            {cs.typing ? 'Skip ⏭' : (cs.line < csData.lines.length - 1 ? 'Tap to Continue ➔' : "Let's Go ➔")}
          </button>
        </div>
      </div>
    </div>
  )
}
