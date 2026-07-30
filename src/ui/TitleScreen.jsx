import React, { useState, useEffect } from 'react'
import { Btn } from './kit.jsx'
import { AUDIO } from '../game/audio.js'
import { Icon } from './icons.jsx'
import { trackEvent } from '../analytics.js'

export function TitleScreen({ hasSave, onNewGame, onContinue, muted, onMuteToggle }) {
  useEffect(() => {
    trackEvent('entry_screen_view');
  }, []);

  return (
    <div className="title-wrap fade-in">
      {/* drops in automatically once art exists at public/art/title_bg.jpg */}
      <div className="title-bg" style={{ backgroundImage:"url('/art/title_bg.jpg')" }} />
      <div style={{ marginBottom:'clamp(18px,3vh,30px)' }}>
        <img src="/logo-wilddox.png" alt="WILDDOX" className="title-logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '180px', objectFit: 'contain' }} />
        <div className="title-sub">— Shadows of the Hunt —</div>
        <div className="title-tag" style={{ marginTop: 8 }}>Find, battle, and bond with your first Wilddox in minutes.</div>
        <div style={{ width:110, height:2, background:'linear-gradient(90deg,var(--gold),transparent)', marginTop:14 }}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:330, width:'100%' }}>
        {hasSave ? (
          <Btn variant="gold" onClick={onContinue}>CONTINUE</Btn>
        ) : (
          <Btn variant="gold" onClick={onNewGame}>PLAY WILDDOX</Btn>
        )}
      </div>
      
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--tx2)', fontSize: 14 }} onClick={onMuteToggle}>
        <Icon name={muted ? 'volume-x' : 'volume-2'} size={18} /> 
        <span>{muted ? 'Sound: Off' : 'Sound: On'}</span>
      </div>

      <div style={{ marginTop:24, fontSize:11, color:'rgba(255,255,255,.45)', letterSpacing:'.1em', fontFamily:'var(--ft)' }}>
        A father &amp; son creation — Merrick &amp; Maddox Lee
      </div>
    </div>
  )
}
