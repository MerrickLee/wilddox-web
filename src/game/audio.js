/* ── WILDDOX AUDIO (Tone.js) ── */
import * as Tone from 'tone'

class AudioManager {
  constructor(){
    this.ready = false
    this.muted = false
    this.currentMusic = null
  }

  /* must be called from a user gesture */
  async init(){
    if(this.ready) return
    try {
      await Tone.start()
      this.master = new Tone.Gain(0.7).toDestination()

      /* ── SFX synths ── */
      this.sfxSynth = new Tone.Synth({ oscillator:{type:'triangle'}, envelope:{attack:.005,decay:.15,sustain:0,release:.1} }).connect(this.master)
      this.hitSynth = new Tone.MembraneSynth({ octaves:4, pitchDecay:.08 }).connect(new Tone.Gain(.5).connect(this.master))
      this.noise = new Tone.NoiseSynth({ noise:{type:'white'}, envelope:{attack:.005,decay:.12,sustain:0} }).connect(new Tone.Gain(.25).connect(this.master))
      this.pluck = new Tone.PluckSynth({ dampening:3000 }).connect(new Tone.Gain(.5).connect(this.master))

      /* ── Music voices ── */
      this.padGain = new Tone.Gain(0.16).connect(this.master)
      this.pad = new Tone.PolySynth(Tone.Synth, { oscillator:{type:'sine'}, envelope:{attack:1.4,decay:.5,sustain:.7,release:2.5} }).connect(
        new Tone.Filter(900,'lowpass').connect(this.padGain))
      this.leadGain = new Tone.Gain(0.12).connect(this.master)
      this.lead = new Tone.Synth({ oscillator:{type:'triangle'}, envelope:{attack:.04,decay:.25,sustain:.3,release:.6} }).connect(
        new Tone.PingPongDelay('8n',.25).connect(this.leadGain))
      this.bassGain = new Tone.Gain(0.18).connect(this.master)
      this.bass = new Tone.Synth({ oscillator:{type:'square'}, envelope:{attack:.02,decay:.2,sustain:.5,release:.3} }).connect(
        new Tone.Filter(400,'lowpass').connect(this.bassGain))
      this.drum = new Tone.MembraneSynth({ octaves:3 }).connect(new Tone.Gain(.3).connect(this.master))

      Tone.Transport.bpm.value = 86
      this.ready = true
    } catch(e){ /* audio unavailable; fail silent */ }
  }

  _stopLoops(){
    if(this.loops){ this.loops.forEach(l=>l.dispose()) }
    this.loops = []
    Tone.Transport.stop()
    Tone.Transport.cancel()
  }

  /* gentle forest ambient: slow pad chords + sparse plucked melody */
  playWorld(){
    if(!this.ready || this.muted || this.currentMusic==='world') return
    this._stopLoops(); this.currentMusic='world'
    Tone.Transport.bpm.value = 76
    const chords = [['C3','E3','G3'],['A2','C3','E3'],['F2','A2','C3'],['G2','B2','D3']]
    let ci = 0
    this.loops.push(new Tone.Loop(t=>{
      this.pad.triggerAttackRelease(chords[ci%4], '2n', t)
      ci++
    }, '1m').start(0))
    const notes = ['G4','E4','C5','D4','A4','E5','C4',null,'G4',null]
    let ni = 0
    this.loops.push(new Tone.Loop(t=>{
      const n = notes[ni%notes.length]; ni++
      if(n && Math.random()>.35) this.pluck.triggerAttack(n, t)
    }, '2n').start('4n'))
    Tone.Transport.start()
  }

  /* tense battle theme: driving bass + drums + lead */
  playBattle(){
    if(!this.ready || this.muted || this.currentMusic==='battle') return
    this._stopLoops(); this.currentMusic='battle'
    Tone.Transport.bpm.value = 132
    const bassline = ['A1','A1','C2','A1','E2','D2','C2','G1']
    let bi = 0
    this.loops.push(new Tone.Loop(t=>{
      this.bass.triggerAttackRelease(bassline[bi%8],'8n',t); bi++
    }, '8n').start(0))
    this.loops.push(new Tone.Loop(t=>{
      this.drum.triggerAttackRelease('A1','8n',t)
    }, '4n').start(0))
    const riff = ['A3','C4','E4','D4',null,'C4','E4','G4']
    let li = 0
    this.loops.push(new Tone.Loop(t=>{
      const n = riff[li%8]; li++
      if(n) this.lead.triggerAttackRelease(n,'16n',t)
    }, '8n').start('2n'))
    Tone.Transport.start()
  }

  stopMusic(){
    if(!this.ready) return
    this._stopLoops(); this.currentMusic = null
  }

  toggleMute(){
    this.muted = !this.muted
    if(this.master) this.master.gain.rampTo(this.muted?0:.7,.2)
    return this.muted
  }

  /* ── SFX ── */
  click(){   if(this.ready&&!this.muted) this.sfxSynth.triggerAttackRelease('C5','32n') }
  hit(){     if(this.ready&&!this.muted){ this.hitSynth.triggerAttackRelease('G2','16n'); this.noise.triggerAttackRelease('16n') } }
  heal(){    if(this.ready&&!this.muted){ this.sfxSynth.triggerAttackRelease('C5','16n'); setTimeout(()=>this.sfxSynth.triggerAttackRelease('E5','16n'),90); setTimeout(()=>this.sfxSynth.triggerAttackRelease('G5','8n'),180) } }
  buff(){    if(this.ready&&!this.muted){ this.sfxSynth.triggerAttackRelease('A4','16n'); setTimeout(()=>this.sfxSynth.triggerAttackRelease('C5','16n'),100) } }
  cage(){    if(this.ready&&!this.muted){ this.noise.triggerAttackRelease('8n'); this.hitSynth.triggerAttackRelease('C3','16n') } }
  capture(){ if(this.ready&&!this.muted){ ['C5','E5','G5','C6'].forEach((n,i)=>setTimeout(()=>this.sfxSynth.triggerAttackRelease(n,'16n'),i*110)) } }
  fail(){    if(this.ready&&!this.muted){ this.sfxSynth.triggerAttackRelease('E3','8n'); setTimeout(()=>this.sfxSynth.triggerAttackRelease('C3','4n'),160) } }
  levelup(){ if(this.ready&&!this.muted){ ['G4','C5','E5','G5'].forEach((n,i)=>setTimeout(()=>this.sfxSynth.triggerAttackRelease(n,'16n'),i*90)) } }
  evolve(){  if(this.ready&&!this.muted){ ['C4','E4','G4','C5','E5','G5','C6'].forEach((n,i)=>setTimeout(()=>this.sfxSynth.triggerAttackRelease(n,'16n'),i*120)) } }
  encounter(){ if(this.ready&&!this.muted){ this.hitSynth.triggerAttackRelease('E2','8n'); setTimeout(()=>this.sfxSynth.triggerAttackRelease('B4','16n'),120) } }
}

export const AUDIO = new AudioManager()
