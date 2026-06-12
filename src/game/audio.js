/* ── WILDDOX AUDIO (Tone.js) ── */
import * as Tone from 'tone'

class AudioManager {
  constructor(){
    this.ready = false
    this.muted = false
    this.currentMusic = null
    this.bgm = new Audio('/Two_Voices_at_the_Edge.mp3')
    this.bgm.loop = true
    this.bgm.volume = 0.4
    
    this.battleBgm = new Audio('/battle/Talons_and_Timber.mp3')
    this.battleBgm.loop = true
    this.battleBgm.volume = 0.4
    
    this.hunterBgm = new Audio('/hunters/Overseers_Footsteps.mp3')
    this.hunterBgm.loop = true
    this.hunterBgm.volume = 0.4
    
    this.titleBgm = new Audio('/title/Summit_of_the_Wildwood.mp3')
    this.titleBgm.loop = true
    this.titleBgm.volume = 0.4
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

  /* MP3 background soundtrack */
  playWorld(){
    if(!this.ready || this.muted || this.currentMusic==='world') return
    this._stopLoops(); this.currentMusic='world'
    if(this.battleBgm) this.battleBgm.pause()
    if(this.hunterBgm) this.hunterBgm.pause()
    if(this.titleBgm) this.titleBgm.pause()
    this.bgm.play().catch(e => console.log('Please place soundtrack.mp3 in the public directory!'))
  }

  /* Title screen music */
  playTitle(){
    if(this.muted || this.currentMusic==='title') return
    this._stopLoops(); this.currentMusic='title'
    if(this.battleBgm) this.battleBgm.pause()
    if(this.hunterBgm) this.hunterBgm.pause()
    if(this.bgm) this.bgm.pause()
    this.titleBgm.play().catch(e => console.log('Autoplay blocked or title track missing'))
  }

  /* tense battle theme */
  playBattle(isHunter=false){
    if(!this.ready || this.muted || this.currentMusic===(isHunter?'hunter':'battle')) return
    this._stopLoops(); this.currentMusic=isHunter?'hunter':'battle'
    this.bgm.pause()
    if(this.battleBgm) this.battleBgm.pause()
    if(this.hunterBgm) this.hunterBgm.pause()
    if(this.titleBgm) this.titleBgm.pause()
    
    const track = isHunter ? this.hunterBgm : this.battleBgm
    track.play().catch(e => {
      // Fallback to synth music if mp3 not present
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
    })
  }

  stopMusic(){
    if(!this.ready) return
    this._stopLoops(); this.currentMusic = null
    this.bgm.pause()
    if(this.battleBgm) this.battleBgm.pause()
    if(this.hunterBgm) this.hunterBgm.pause()
    if(this.titleBgm) this.titleBgm.pause()
  }

  toggleMute(){
    this.muted = !this.muted
    if(this.master) this.master.gain.rampTo(this.muted?0:.7,.2)
    this.bgm.muted = this.muted
    if(this.battleBgm) this.battleBgm.muted = this.muted
    if(this.hunterBgm) this.hunterBgm.muted = this.muted
    if(this.titleBgm) this.titleBgm.muted = this.muted
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

  bark(type){
    if(!this.ready || this.muted) return
    if(type === 'confident'){
      this.sfxSynth.triggerAttackRelease('C4','16n'); setTimeout(()=>this.sfxSynth.triggerAttackRelease('G4','8n'), 100)
    } else if(type === 'hurt'){
      this.sfxSynth.triggerAttackRelease('G2','16n')
    } else if(type === 'critical'){
      this.sfxSynth.triggerAttackRelease('E3','4n')
      setTimeout(()=>this.sfxSynth.triggerAttackRelease('C3','4n'), 150)
    } else if(type === 'victory'){
      ['C4','E4','G4','C5'].forEach((n,i)=>setTimeout(()=>this.sfxSynth.triggerAttackRelease(n,'8n'), i*150))
    }
  }
}

export const AUDIO = new AudioManager()
