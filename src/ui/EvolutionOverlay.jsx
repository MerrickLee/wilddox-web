/* ── EvolutionOverlay ── */
import React from 'react'
import { Icon, animalIcon } from './icons.jsx'
import { Btn } from './kit.jsx'

export function EvolutionOverlay({ evo, party, onDismiss }) {
  return (
    <div className="full fade-in" style={{ zIndex:35, background:'linear-gradient(180deg,#040810,#0A1018,#040810)',
      justifyContent:'center', alignItems:'center', gap:16, padding:24 }}>
      <div style={{ fontFamily:'var(--ft)', fontSize:12, color:'rgba(245,196,48,.55)',
        letterSpacing:'.2em', textTransform:'uppercase' }}>— Evolution —</div>
      <div style={{ animation:'evoGlow 1.4s ease-in-out 3' }}>
        <Icon name={animalIcon(party[0]?.id)} size={Math.min(window.innerWidth * 0.11, 96)} />
      </div>
      <div style={{ fontFamily:'var(--ft)', fontSize:'clamp(22px,3.6vw,30px)', fontWeight:700,
        color:'var(--gold)', textAlign:'center', lineHeight:1.25 }}>
        {evo.old.name} evolved<br/>into {evo.evo.name}!
      </div>
      <div style={{ fontSize:13, color:'var(--tx2)', textAlign:'center', fontStyle:'italic', maxWidth:300, lineHeight:1.6 }}>
        {evo.evo.desc}
      </div>
      <Btn variant="gold" style={{ width:'auto', padding:'13px 44px' }} onClick={onDismiss}>AMAZING! →</Btn>
    </div>
  )
}
