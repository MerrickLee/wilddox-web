/* ── BagScreen ── */
import React from 'react'
import { Icon } from './icons.jsx'
import { Panel, Btn, BtnSm } from './kit.jsx'

export function BagScreen({ coins, xp, level, party, cages, onHeal, onBack }) {
  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <div className="menu-title">INVENTORY</div>
        <button className="back-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div className="menu-body">
        <Panel style={{ padding:18, textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'space-around' }}>
            <div><Icon name="coin" size={22} />
              <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700, color:'var(--gold)' }}>{coins}</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>Coins</div></div>
            <div><Icon name="star" size={22} />
              <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700, color:'var(--blue3)' }}>{xp}</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>XP · Lv.{level}</div></div>
            <div><Icon name="paw" size={22} />
              <div style={{ fontFamily:'var(--ft)', fontSize:26, fontWeight:700 }}>{party.length}/6</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>Team</div></div>
          </div>
        </Panel>
        <div style={{ fontFamily:'var(--ft)', fontSize:12, fontWeight:700, letterSpacing:'.14em', color:'var(--tx2)' }}>
          CAGE COLLECTION — stronger cages raise capture rate
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {cages.map(c => (
            <div key={c.id} className={'cage-card' + (c.n > 0 ? ' owned' : '')}>
              <Icon name={c.icon} size={30} />
              <div style={{ fontFamily:'var(--ft)', fontSize:13, fontWeight:700 }}>{c.name}</div>
              <div style={{ fontSize:10, color:'var(--tx2)' }}>{c.desc}</div>
              <div className="cage-n">{c.n > 0 ? `×${c.n}` : 'Out of stock'}</div>
            </div>
          ))}
        </div>
        <Panel style={{ padding:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'var(--ft)', fontSize:14, fontWeight:700 }}><Icon name="pill" size={14} /> Heal Team</div>
            <div style={{ fontSize:11, color:'var(--tx2)' }}>15<Icon name="coin" size={10} /> per injured animal</div>
          </div>
          <BtnSm variant="blue" onClick={onHeal}>Heal ({party.filter(a => a.hp < a.maxHp).length * 15}<Icon name="coin" size={10} />)</BtnSm>
        </Panel>
      </div>
    </div>
  )
}
