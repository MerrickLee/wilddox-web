/* ── WILDDOX ICON SYSTEM ── */
/* Maps a name string to an inline SVG placeholder.
   Will later map to image assets in /art/icons/.
   Usage: <Icon name="bite" size={16} /> */
import React from 'react'

/* ── SVG path data per icon ── */
const PATHS = {
  /* ── Move icons ── */
  bite:      { d:'M4 3L8 8L12 3M4 13L8 8L12 13', stroke:true, color:'#E08060' },
  heal:      { d:'M8 2C8 2 3 6 3 9C3 12 5.5 14 8 14C10.5 14 13 12 13 9C13 6 8 2 8 2Z', color:'#45C058' },
  spark:     { d:'M8 1L9.5 6L14 6L10.5 9L12 14L8 11L4 14L5.5 9L2 6L6.5 6Z', color:'#FBE070' },
  bolt:      { d:'M9 1L4 9H8L7 15L12 7H8L9 1Z', color:'#F5C430' },
  shield:    { d:'M8 1L2 4V8C2 11.5 4.5 14 8 15C11.5 14 14 11.5 14 8V4L8 1Z', color:'#3A90F0' },
  swirl:     { d:'M8 2C11.5 2 14 5 14 8C14 9 13.5 10 12.5 10C11 10 11 8 8 8C5 8 5 10 3.5 10C2.5 10 2 9 2 8C2 5 4.5 2 8 2Z', color:'#7AB8FF' },
  moon:      { d:'M10 2C6.5 2 3.5 5 3.5 8.5C3.5 12 6.5 14.5 10 14.5C7.5 13 6 10.5 6 8.5C6 6.5 7.5 4 10 2Z', color:'#9090CC' },
  'moon-full':{ d:'M8 2C4.7 2 2 4.7 2 8C2 11.3 4.7 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2Z', color:'#FBE070' },
  impact:    { d:'M8 1L10 6L15 5L11 9L14 14L8 11L2 14L5 9L1 5L6 6Z', color:'#E04040' },
  kick:      { d:'M5 2V8L3 12L7 14L9 10H11L13 12L11 14', stroke:true, color:'#F08020' },
  cut:       { d:'M3 3L13 13M13 3L3 13', stroke:true, color:'#C0C0C0' },
  burst:     { d:'M8 1L10 5L14 3L12 7L15 9L11 10L13 14L8 12L3 14L5 10L1 9L4 7L2 3L6 5Z', color:'#F08020' },
  paw:       { d:'M5 10C5 12 6.5 14 8 14C9.5 14 11 12 11 10C11 8 9.5 7 8 7C6.5 7 5 8 5 10ZM3 6A1.5 1.5 0 1 0 3 3M6 4A1.5 1.5 0 1 0 6 1M10 4A1.5 1.5 0 1 0 10 1M13 6A1.5 1.5 0 1 0 13 3', color:'#C89A10' },
  dive:      { d:'M8 2V10M4 7L8 12L12 7', stroke:true, color:'#3A90F0' },
  loop:      { d:'M5 4C2 4 2 8 5 8H11C14 8 14 12 11 12H5', stroke:true, color:'#7AB8FF' },
  drop:      { d:'M8 2C8 2 4 7 4 10C4 12.5 5.8 14 8 14C10.2 14 12 12.5 12 10C12 7 8 2 8 2Z', color:'#60B0E0' },
  syringe:   { d:'M11 1L15 5L13 7L10 4L5 9L7 11L4 14L2 12L5 9L3 7L10 4Z', color:'#E04040' },

  /* ── Item / cage icons ── */
  cage:      { d:'M3 4H13V13H3ZM5 4V13M8 4V13M11 4V13M3 8.5H13', stroke:true, color:'#A0A0A0' },
  lock:      { d:'M5 8V6C5 3.8 6.3 2 8 2C9.7 2 11 3.8 11 6V8M4 8H12V14H4Z', stroke:true, color:'#F5C430' },
  honey:     { d:'M5 2H11L12 6C12 9 10 11 8 12C6 11 4 9 4 6L5 2ZM6 6H10', stroke:true, color:'#F08020' },

  /* ── Battle action icons ── */
  sword:     { d:'M12 2L6 8L4 6L2 8L8 14L10 12L8 10L14 4Z', color:'#C0C0C0' },
  trap:      { d:'M2 6H14M3 6L2 12H14L13 6M6 6V3H10V6', stroke:true, color:'#7AB8FF' },
  flee:      { d:'M10 2C10 2 10 5 8 7L6 9V14M4 11H8M12 5L14 3M12 8L14 8M12 11L14 13', stroke:true, color:'#F08020' },

  /* ── HUD / nav icons ── */
  coin:      { d:'M8 1C4.1 1 1 4.1 1 8C1 11.9 4.1 15 8 15C11.9 15 15 11.9 15 8C15 4.1 11.9 1 8 1ZM7 5V11M9 5V11M5.5 6.5H10M5.5 9.5H10', color:'#F5C430' },
  star:      { d:'M8 1L10 6L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 6Z', color:'#3A90F0' },
  team:      { d:'M5 10C5 12 6.5 14 8 14C9.5 14 11 12 11 10C11 8 9.5 7 8 7C6.5 7 5 8 5 10ZM3 6A1.5 1.5 0 1 0 3 3M6 4A1.5 1.5 0 1 0 6 1M10 4A1.5 1.5 0 1 0 10 1M13 6A1.5 1.5 0 1 0 13 3', color:'#C89A10' },
  bag:       { d:'M4 6H12L13 15H3ZM6 6V4C6 2.5 7 1 8 1C9 1 10 2.5 10 4V6', stroke:true, color:'#F08020' },
  map:       { d:'M1 3L5.5 5L10.5 3L15 5V13L10.5 11L5.5 13L1 11ZM5.5 5V13M10.5 3V11', stroke:true, color:'#45C058' },
  lab:       { d:'M6 2V7L2 13C2 14 3 15 4 15H12C13 15 14 14 14 13L10 7V2M5 2H11', stroke:true, color:'#7AB8FF' },
  gear:      { d:'M8 5.5A2.5 2.5 0 1 0 8 10.5A2.5 2.5 0 1 0 8 5.5ZM8 1V3M8 13V15M1 8H3M13 8H15M2.9 2.9L4.3 4.3M11.7 11.7L13.1 13.1M13.1 2.9L11.7 4.3M4.3 11.7L2.9 13.1', stroke:true, color:'#7090B0' },
  music:     { d:'M6 12V4L14 2V10M6 12C6 13.1 4.7 14 3 14C1.3 14 0 13.1 0 12C0 10.9 1.3 10 3 10C4.7 10 6 10.9 6 12ZM14 10C14 11.1 12.7 12 11 12C9.3 12 8 11.1 8 10C8 8.9 9.3 8 11 8C12.7 8 14 8.9 14 10Z', color:'#9090CC' },
  mute:      { d:'M2 6H5L10 2V14L5 10H2ZM13 6L15 8M15 6L13 8', stroke:true, color:'#7090B0' },
  sound:     { d:'M2 6H5L10 2V14L5 10H2ZM13 5C14 6.5 14 9.5 13 11M15 3C17 5.5 17 10.5 15 13', stroke:true, color:'#7090B0' },
  pill:      { d:'M5 3L13 11C14.5 12.5 14.5 15 13 16.5C11.5 18 9 18 7.5 16.5L-0.5 8.5C-2 7-2 4.5-0.5 3C1 1.5 3.5 1.5 5 3ZM3.5 9.5L10.5 6.5', color:'#3A90F0' },
  save:      { d:'M3 1H12L14 3V14H2V1ZM5 1V5H11V1M5 9H11M5 11H9', stroke:true, color:'#7090B0' },
  warn:      { d:'M8 1L1 14H15ZM8 6V10M8 12V12.5', stroke:true, color:'#F5C430' },
  bulb:      { d:'M8 1C5 1 3 3.5 3 6C3 8 4.5 9.5 5.5 10.5V12.5H10.5V10.5C11.5 9.5 13 8 13 6C13 3.5 11 1 8 1ZM5.5 14H10.5', stroke:true, color:'#FBE070' },
  pin:       { d:'M8 1C5 1 3 3 3 6C3 10 8 15 8 15C8 15 13 10 13 6C13 3 11 1 8 1ZM8 4A2 2 0 1 0 8 8A2 2 0 1 0 8 4Z', color:'#E04040' },
  quest:     { d:'M8 1L10 5.5L15 6L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6L6 5.5Z', color:'#F5C430' },
  skull:     { d:'M4 9V6C4 3 5.5 1 8 1C10.5 1 12 3 12 6V9C12 11 10.5 12 10 12.5V14H6V12.5C5.5 12 4 11 4 9ZM6 7.5A1 1 0 1 0 6 9.5A1 1 0 1 0 6 7.5ZM10 7.5A1 1 0 1 0 10 9.5A1 1 0 1 0 10 7.5Z', color:'#C0C0C0' },
  scientist: { d:'M8 1A3 3 0 1 0 8 7A3 3 0 1 0 8 1ZM3 14C3 11 5.2 9 8 9C10.8 9 13 11 13 14', stroke:true, color:'#7AB8FF' },
  rival:     { d:'M8 1A3 3 0 1 0 8 7A3 3 0 1 0 8 1ZM3 14C3 11 5.2 9 8 9C10.8 9 13 11 13 14', stroke:true, color:'#F08020' },
  check:     { d:'M3 8L6.5 12L13 4', stroke:true, color:'#45C058' },
  'arrow-up': { d:'M8 14V3M4 7L8 2L12 7', stroke:true, color:'#45C058' },
  'arrow-down':{ d:'M8 2V13M4 9L8 14L12 9', stroke:true, color:'#E04040' },
  celebrate: { d:'M8 8L6 2M8 8L12 3M8 8L3 6M8 8L14 7M8 8L5 13M8 8L11 12M7 9A3 3 0 0 0 9 14A3 3 0 0 0 9 9Z', stroke:true, color:'#F5C430' },
  sad:       { d:'M8 1A7 7 0 1 0 8 15A7 7 0 1 0 8 1ZM5 6.5V7.5M11 6.5V7.5M5 11C6 9.5 10 9.5 11 11', stroke:true, color:'#7090B0' },

  /* ── Animal icons ── */
  fox:       { d:'M3 4L5 1L7 5H9L11 1L13 4V10C13 12.5 10.5 14 8 14C5.5 14 3 12.5 3 10ZM6 8.5A1 1 0 1 0 6 10M10 8.5A1 1 0 1 0 10 10M7 11L8 12L9 11', color:'#E07030' },
  wolf:      { d:'M3 5L5 1L7 6H9L11 1L13 5V11C13 13 10.5 15 8 15C5.5 15 3 13 3 11ZM6 9A1 1 0 1 0 6 11M10 9A1 1 0 1 0 10 11M7 12L8 13L9 12', color:'#8090A0' },
  raccoon:   { d:'M4 6C4 3.5 5.5 2 8 2C10.5 2 12 3.5 12 6V10C12 12.5 10.5 14 8 14C5.5 14 4 12.5 4 10ZM5 7H7M9 7H11M7 10L8 11L9 10M2 5H4M12 5H14', color:'#706050' },
  deer:      { d:'M8 6C5.5 6 4 8 4 10C4 12.5 5.5 14 8 14C10.5 14 12 12.5 12 10C12 8 10.5 6 8 6ZM5 6L3 1M6 4L4 2M11 6L13 1M10 4L12 2M6.5 10A.5 .5 0 1 0 7.5 10M8.5 10A.5 .5 0 1 0 9.5 10', color:'#A08050' },
  owl:       { d:'M4 6C4 3 5.5 1 8 1C10.5 1 12 3 12 6V11C12 13.5 10.5 15 8 15C5.5 15 4 13.5 4 11ZM5 7A2 2 0 1 0 5 11M11 7A2 2 0 1 0 11 11M7.5 11L8 12L8.5 11', color:'#8B6914' },
  bear:      { d:'M4 7C4 4 5.5 2 8 2C10.5 2 12 4 12 7V11C12 13.5 10.5 15 8 15C5.5 15 4 13.5 4 11ZM3 4A2 2 0 1 0 5 3M13 4A2 2 0 1 0 11 3M6 9A.5 .5 0 1 0 7 9M9 9A.5 .5 0 1 0 10 9M7 11L8 12L9 11', color:'#3A2A1A' },
  hawk:      { d:'M8 2L4 6L2 5L4 9V13L6 12L8 14L10 12L12 13V9L14 5L12 6Z', color:'#8B4513' },
  rabbit:    { d:'M5 8C5 5 6 3 8 3C10 3 11 5 11 8V12C11 13.5 10 15 8 15C6 15 5 13.5 5 12ZM6 3V0M10 3V0M6.5 9.5A.5 .5 0 1 0 7.5 9.5M8.5 9.5A.5 .5 0 1 0 9.5 9.5', color:'#C0A080' },
  otter:     { d:'M4 6C4 4 5.5 2 8 2C10.5 2 12 4 12 6V11C12 13 10.5 14.5 8 14.5C5.5 14.5 4 13 4 11ZM3 8L1 7M13 8L15 7M6 8.5A.5 .5 0 1 0 7 8.5M9 8.5A.5 .5 0 1 0 10 8.5M7 10L8 11L9 10', color:'#6A5040' },
  beaver:    { d:'M4 5C4 3 5.5 1 8 1C10.5 1 12 3 12 5V10C12 12.5 10.5 14 8 14C5.5 14 4 12.5 4 10ZM6 8.5A.5 .5 0 1 0 7 8.5M9 8.5A.5 .5 0 1 0 10 8.5M7 10H9M7 11H9M6 14L5 16H11L10 14', color:'#6A4020' },
  snake:     { d:'M3 4C3 2 5 1 7 2C9 3 9 5 11 5C13 5 14 3 14 3M3 4C3 6 4 8 6 8C8 8 9 6 11 6C13 6 14 8 14 10C14 12 12 14 10 14C8 14 7 12 5 12C3 12 2 14 2 14', stroke:true, color:'#45C058' },

  /* ── Region icons ── */
  tree:      { d:'M8 14V10M4 10L8 3L12 10Z', color:'#45C058' },
  mountain:  { d:'M1 14L5 5L7 9L8 7L11 3L15 14Z', color:'#8090A0' },
  wheat:     { d:'M8 14V3M5 5L8 7M11 5L8 7M5 8L8 10M11 8L8 10M5 11L8 13M11 11L8 13', stroke:true, color:'#F5C430' },
  cactus:    { d:'M8 14V3M8 6H5V9H8M8 8H11V11H8', stroke:true, color:'#45C058' },
  croc:      { d:'M2 8H14L12 11H4ZM3 8V6L5 5M6 8V5L8 4M9 8V5L11 4M12 8V6', stroke:true, color:'#45C058' },
  wave:      { d:'M1 8C3 5 5 5 7 8C9 11 11 11 13 8C15 5 15 5 15 8M1 12C3 9 5 9 7 12C9 15 11 15 13 12', stroke:true, color:'#3A90F0' },

  /* ── Player character icons ── */
  boy:       { d:'M8 1A3 3 0 1 0 8 7A3 3 0 1 0 8 1ZM3 14C3 11 5.2 9 8 9C10.8 9 13 11 13 14', stroke:true, color:'#F08020' },
  girl:      { d:'M8 1A3 3 0 1 0 8 7A3 3 0 1 0 8 1ZM3 14C3 11 5.2 9 8 9C10.8 9 13 11 13 14M5 3C5 1 8 0 8 0C8 0 11 1 11 3', stroke:true, color:'#3A6E8A' },
}

/* Fallback for unmapped names */
const FALLBACK = { d:'M8 2A6 6 0 1 0 8 14A6 6 0 1 0 8 2ZM8 5V8M8 10V11', stroke:true, color:'#7090B0' }

export function Icon({ name, size = 16, className = '', style = {} }) {
  const cfg = PATHS[name] || FALLBACK
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16"
      fill={cfg.stroke ? 'none' : cfg.color}
      stroke={cfg.stroke ? cfg.color : 'none'}
      strokeWidth={cfg.stroke ? 1.5 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0, ...style }}
      aria-hidden="true"
    >
      <path d={cfg.d} />
    </svg>
  )
}

/* Helper: resolve animal id → icon name */
export function animalIcon(id) {
  const map = { fox:'fox', wolf:'wolf', raccoon:'raccoon', deer:'deer', cdeer:'deer',
    owl:'owl', bear:'bear', hawk:'hawk', rabbit:'rabbit', otter:'otter', beaver:'beaver', snake:'snake' }
  return map[id] || 'paw'
}
