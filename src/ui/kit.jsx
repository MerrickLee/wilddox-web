/* ── WILDDOX SHARED UI KIT ── */
/* Reusable primitives used across all screens */
import React, { useState, useEffect } from 'react'

/* ── HP color helper (shared) ── */
export const hpc = p => p>55?'bhi':p>25?'bmd':'blo'

/* ── Panel ── */
export function Panel({ children, className = '', style, ...rest }) {
  return <div className={'panel ' + className} style={style} {...rest}>{children}</div>
}

/* ── Btn ── */
/* variant: 'gold' | 'blue' | 'dark' | 'outline' | 'red' */
export function Btn({ children, variant = 'gold', className = '', ...rest }) {
  return <button className={`btn btn-${variant} ${className}`} {...rest}>{children}</button>
}

/* ── BtnSm ── */
/* variant: 'blue' | 'dark' | 'gold' */
export function BtnSm({ children, variant = 'blue', className = '', ...rest }) {
  return <button className={`bsm bsm-${variant} ${className}`} {...rest}>{children}</button>
}

/* ── Bar ── */
/* HP / XP bar with auto-color from hp percentage */
export function Bar({ value, max, height = 7, colorClass, style }) {
  const p = Math.round(value / max * 100)
  const cc = colorClass || hpc(p)
  return (
    <div className="bw" style={{ height, ...style }}>
      <div className={'bf ' + cc} style={{ width: p + '%' }} />
    </div>
  )
}

/* ── Badge ── */
/* color: 'blue' | 'gold' | 'green' | 'red' | 'gray' */
export function Badge({ children, color = 'gray', style }) {
  return <span className={'badge b-' + color} style={style}>{children}</span>
}

/* ── Hearts ── */
export function Hearts({ bond }) {
  const full = Math.round(bond / 20)
  return (
    <div className="hearts">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={'heart ' + (i < full ? 'full' : 'empty')}>
          {i < full ? '♥' : '♡'}
        </span>
      ))}
    </div>
  )
}

/* ── Typewriter ── */
export function Typewriter({ text, typing, setTyping }) {
  const [disp, setDisp] = useState('')
  useEffect(() => {
    if (!typing) {
      setDisp(text)
      return
    }
    setDisp('')
    let i = 0
    const t = setInterval(() => {
      setDisp(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(t)
        setTyping(false)
      }
    }, 25)
    return () => clearInterval(t)
  }, [text, typing, setTyping])
  return <span>{disp}</span>
}
