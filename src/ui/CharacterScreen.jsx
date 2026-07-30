import React, { useState } from 'react'
import { Btn } from './kit.jsx'
import { Icon } from './icons.jsx'

export function CharacterScreen({ onConfirm, onBack }) {
  const [selected, setSelected] = useState(null);

  const characters = [
    {
      id: 'john',
      name: 'John',
      emoji: '👦🏽',
      jacket: 0x9A3A20, // Rust red
      desc: 'An eager explorer with a knack for speed. Starts with a Young Fox.'
    },
    {
      id: 'maisey',
      name: 'Maisey',
      emoji: '👧🏽',
      jacket: 0x3A6E8A, // Blue
      desc: 'A patient observer who connects deeply with animals. Starts with a Young Wolf.'
    }
  ];

  return (
    <div className="title-wrap fade-in">
      <div className="title-bg" style={{ backgroundImage:"url('/art/title_bg.jpg')" }} />
      <div style={{ marginBottom:'clamp(18px,3vh,30px)' }}>
        <div className="title-logo" style={{ fontSize: 42 }}>CHOOSE CHARACTER</div>
      </div>
      
      <div style={{ display:'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {characters.map(char => (
          <div 
            key={char.id}
            onClick={() => setSelected(char.id)}
            style={{
              background: selected === char.id ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
              border: `2px solid ${selected === char.id ? 'var(--gold)' : 'var(--border2)'}`,
              borderRadius: 12,
              padding: 20,
              width: 260,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 12 }}>{char.emoji}</div>
            <div style={{ fontFamily: 'var(--ft)', fontSize: 24, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>
              {char.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.4 }}>
              {char.desc}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30, display:'flex', gap:10, maxWidth: 300, width:'100%', flexDirection: 'column' }}>
        <Btn 
          variant="gold" 
          disabled={!selected} 
          style={{ opacity: selected ? 1 : 0.4 }} 
          onClick={() => {
            const char = characters.find(c => c.id === selected);
            onConfirm(char.name, char.emoji, char.jacket);
          }}
        >
          CONFIRM
        </Btn>
        <Btn variant="outline" onClick={onBack}>BACK</Btn>
      </div>
    </div>
  )
}
