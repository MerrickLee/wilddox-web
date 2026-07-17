/* ── TitleScreen ── */
import React from 'react'
import { Btn } from './kit.jsx'

export function TitleScreen({ hasSave, onNewGame, onContinue }) {
  return (
    <div className="title-wrap fade-in">
      <div style={{ marginBottom:'clamp(18px,3vh,30px)' }}>
        <div className="title-logo">WILDDOX</div>
        <div className="title-sub">Shadows of the Hunt</div>
        <div style={{ width:90, height:2, background:'linear-gradient(90deg,var(--gold),transparent)', marginTop:9 }}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:330, width:'100%' }}>
        {hasSave && <Btn variant="gold" onClick={onContinue}>CONTINUE</Btn>}
        <Btn variant={hasSave ? 'outline' : 'gold'} onClick={() => onNewGame('John','👦🏽',0x9A3A20)}>NEW GAME — JOHN</Btn>
        <Btn variant="outline" onClick={() => onNewGame('Maisey','👧🏽',0x3A6E8A)}>NEW GAME — MAISEY</Btn>
      </div>
      <div style={{ marginTop:18, fontSize:12, color:'rgba(255,255,255,.4)', letterSpacing:'.06em' }}>
        Capture. Bond. Evolve. Explore.
      </div>
    </div>
  )
}
