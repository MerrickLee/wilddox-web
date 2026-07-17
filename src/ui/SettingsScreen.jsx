/* ── SettingsScreen ── */
import React from 'react'
import { AUDIO } from '../game/audio.js'
import { Icon } from './icons.jsx'
import { Btn, Panel } from './kit.jsx'

const SAVE_KEY = 'wilddox_save_v1'

export function SettingsScreen({ phase, player, party, coins, xp, level, cages, flags, onBack, notify }) {
  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <div className="menu-title">SETTINGS</div>
        <button className="back-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div className="menu-body" style={{ alignItems:'center', paddingTop:40, gap:20 }}>
        <Icon name="gear" size={60} />

        {/* Soundtrack Selector */}
        <Panel style={{ padding: 20, width: '100%', maxWidth: 300, textAlign: 'center' }}>
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
              if(phase === 'world') AUDIO.bgm.play().catch(() => {});
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
                 if(phase === 'world') AUDIO.bgm.play().catch(() => {})
              }
            }}
          />

          <div style={{ fontSize:12, color:'var(--tx2)' }}>
            Select a built-in track or upload your own MP3 to play in the background.
          </div>
        </Panel>

        <Btn variant="gold" style={{ maxWidth:260, marginTop:10 }} onClick={() => {
          AUDIO.click()
          try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({ player, party, coins, xp, level, cages, flags }))
            notify('Game Saved Successfully!')
          } catch(e) {
            notify('Failed to save game.')
          }
        }}><Icon name="save" size={14} /> SAVE GAME</Btn>

        <Btn variant="outline" style={{ maxWidth:260 }} onClick={() => {
          AUDIO.click()
          if(window.confirm('Are you sure you want to start over? All progress will be lost!')) {
            localStorage.removeItem(SAVE_KEY)
            window.location.reload()
          }
        }}><Icon name="warn" size={14} /> START OVER</Btn>

        <div style={{ fontSize:12, color:'var(--tx2)', textAlign:'center', marginTop:10 }}>
          Your progress is also auto-saved as you play.<br/>Use "Start Over" if you wish to reset your journey.
        </div>

        <Panel style={{ padding: 20, marginTop: 20, textAlign: 'center', maxWidth: 300 }}>
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
        </Panel>
      </div>
    </div>
  )
}
