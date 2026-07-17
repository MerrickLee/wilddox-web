/* ── TeamScreen ── */
import React from 'react'
import { ANIMALS, pct } from '../game/data.js'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Icon, animalIcon } from './icons.jsx'
import { Bar, Badge, Btn, Hearts } from './kit.jsx'

export function TeamScreen({ party, coins, onHeal, onBack, onDragEnd }) {
  const inj = party.filter(a => a.hp < a.maxHp).length
  const cost = inj * 15
  const canAfford = coins >= cost

  return (
    <div className="menu-screen fade-in">
      <div className="menu-head">
        <div className="menu-title">TEAM {party.length}/6</div>
        {inj > 0 && (
          <button
            className={`bsm ${canAfford ? 'bsm-blue' : 'bsm-dark'}`}
            onClick={(e) => { e.stopPropagation(); onHeal(); }}
            style={{ opacity: canAfford ? 1 : 0.5 }}
          >
            {canAfford ? <Icon name="pill" size={12} /> : <Icon name="lock" size={12} />} Heal ({cost}<Icon name="coin" size={10} />)
          </button>
        )}
      </div>
      <div className="menu-body" style={{ paddingBottom: 100 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="team-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {party.map((a, i) => (
                  <Draggable key={a.uid || a.id + i} draggableId={a.uid || a.id + i} index={i}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={'team-item' + (i === 0 ? ' lead' : '')}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.9 : 1,
                          boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                          transform: provided.draggableProps.style?.transform || 'none',
                          zIndex: snapshot.isDragging ? 100 : 1,
                          position: snapshot.isDragging ? 'relative' : 'static',
                        }}
                      >
                        <div className="team-thumb" {...provided.dragHandleProps} style={{ cursor: 'grab' }}>
                          <Icon name={animalIcon(a.id)} size={30} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                            <span style={{ fontFamily:'var(--ft)', fontSize:15, fontWeight:700 }}>{a.name}</span>
                            {i === 0 && <Badge color="gold">Lead</Badge>}
                            {a.evolved && <Badge color="green"><Icon name="spark" size={10} /> Evolved</Badge>}
                            <span style={{ marginLeft:'auto', fontFamily:'var(--ft)', fontSize:13, fontWeight:700, color:'var(--tx2)' }}>Lv.{a.level}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <Bar value={a.hp} max={a.maxHp} height={7} style={{ flex:1 }} />
                            <span style={{ fontSize:10, color:'var(--tx3)', whiteSpace:'nowrap' }}>{a.hp}/{a.maxHp}</span>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <Hearts bond={a.bond}/>
                            {ANIMALS[a.id] && !a.evolved &&
                              <span style={{ fontSize:10, color:'var(--blue3)' }}>→ {ANIMALS[a.id].evo.name} Lv.{ANIMALS[a.id].evo.level}</span>}
                          </div>
                        </div>
                        <div {...provided.dragHandleProps} style={{ padding: 10, cursor: 'grab', color: 'var(--tx3)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {party.length < 6 && (
          <div style={{ border:'1.5px dashed var(--border2)', borderRadius:12, padding:16, textAlign:'center', color:'var(--tx3)', marginTop: 10 }}>
            <div style={{ fontSize:18 }}>+</div>
            <div style={{ fontSize:12 }}>{6 - party.length} slot{6 - party.length === 1 ? '' : 's'} open — find animals in tall grass</div>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: 300, zIndex: 50 }}>
        <Btn variant="gold" onClick={onBack} style={{ width: '100%', fontSize: 18, padding: '16px 0', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
          BACK TO GAME
        </Btn>
      </div>
    </div>
  )
}
