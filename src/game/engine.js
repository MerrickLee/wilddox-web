/* ── WILDDOX 3D ENGINE ──
   One renderer, two scenes (world + battle).
   World: free WASD/joystick movement, third-person camera, grass encounter zones.
   Battle: arena with dynamic swinging camera, attack/heal/cage animation timelines. */
import * as THREE from 'three'
import { terrainH, buildTerrain, pine, mountain, rock, flowers, grassTuft, cloud, explorer, buildAnimal, mat } from './models.js'

const WORLD_RADIUS = 52

export class Engine {
  constructor(canvas, cb={}){
    this.cb = cb                       // { onEncounter(zoneId) }
    this.mode = 'world'
    this.input = { x:0, z:0 }          // -1..1 movement vector (joystick/keys)
    this.keys = {}
    this.tweens = []
    this.encounterCooldown = 3
    this.paused = false

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.camera = new THREE.PerspectiveCamera(55, 1, .1, 300)
    this.clock = new THREE.Clock()

    this._buildWorld()
    this._buildBattle()

    this._resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      this.renderer.setSize(w, h, false)
      this.camera.aspect = w/h
      this.camera.updateProjectionMatrix()
    }
    this._resize()
    window.addEventListener('resize', this._resize)

    window.addEventListener('keydown', e=>{ this.keys[e.key.toLowerCase()] = true })
    window.addEventListener('keyup',   e=>{ this.keys[e.key.toLowerCase()] = false })

    this._loop = this._loop.bind(this)
    requestAnimationFrame(this._loop)
  }

  dispose(){ window.removeEventListener('resize', this._resize) }

  /* ════════ WORLD SCENE ════════ */
  _buildWorld(){
    const s = this.worldScene = new THREE.Scene()
    this._sky(s, '#3A7AD8', '#D8EEFC')
    s.fog = new THREE.Fog(0xBBDDF2, 30, 110)

    const hemi = new THREE.HemisphereLight(0xBFD8FF, 0x3A5A30, .55); s.add(hemi)
    this.worldSun = new THREE.DirectionalLight(0xFFE0B0, 1.25)
    this.worldSun.position.set(30, 40, 18)
    this.worldSun.castShadow = true
    this.worldSun.shadow.mapSize.set(2048, 2048)
    const sc = this.worldSun.shadow.camera
    sc.left=-60; sc.right=60; sc.top=60; sc.bottom=-60
    s.add(this.worldSun)

    s.add(buildTerrain())

    /* dirt path winding north */
    const pathPts = []
    for(let z=46; z>=-46; z-=2){
      const x = Math.sin(z*.09)*6
      pathPts.push(new THREE.Vector3(x, terrainH(x,z)+.06, z))
    }
    const pathCurve = new THREE.CatmullRomCurve3(pathPts)
    const pathGeo = new THREE.TubeGeometry(pathCurve, 50, 1.4, 5, false)
    const path = new THREE.Mesh(pathGeo, mat(0x9A7030, 1))
    path.scale.y = .06
    path.receiveShadow = true
    s.add(path)

    /* river to the west */
    const river = new THREE.Mesh(new THREE.PlaneGeometry(6, 110),
      new THREE.MeshStandardMaterial({ color:0x4A9AD8, roughness:.22, metalness:.15 }))
    river.rotation.x = -Math.PI/2
    river.position.set(-20, .1, 0)
    s.add(river)
    this.river = river

    /* trees (store positions for collision) */
    this.treeCols = []
    for(let i=0;i<170;i++){
      const ang = Math.random()*Math.PI*2
      const dist = 6 + Math.random()*(WORLD_RADIUS-6)
      const x = Math.cos(ang)*dist, z = Math.sin(ang)*dist
      if(Math.abs(x - Math.sin(z*.09)*6) < 3.2) continue       // off path
      if(x > -23.5 && x < -16.5) continue                       // off river
      const t = pine(1.15)
      t.position.set(x, terrainH(x,z), z)
      s.add(t)
      this.treeCols.push({x, z, r:.9})
    }

    /* rocks + flowers */
    for(let i=0;i<16;i++){
      const r = rock(.4+Math.random()*.6)
      const x=(Math.random()-.5)*80, z=(Math.random()-.5)*80
      r.position.set(x, terrainH(x,z)+.2, z); s.add(r)
      this.treeCols.push({x, z, r:.7})
    }
    for(let i=0;i<14;i++){
      const f = flowers()
      const x=(Math.random()-.5)*70, z=(Math.random()-.5)*70
      f.position.set(x, terrainH(x,z), z); s.add(f)
    }

    /* encounter grass zones — visible tall-grass patches */
    this.grassZones = []
    const zoneDefs = [
      {x: 12, z: -8,  r: 6}, {x: -8, z: -22, r: 5.5}, {x: 18, z: 16, r: 6},
      {x: -12, z: 24, r: 5}, {x: 2, z: -38, r: 6.5}, {x: 30, z: -20, r: 5},
    ]
    zoneDefs.forEach((zd, i)=>{
      const zone = { ...zd, id:i }
      this.grassZones.push(zone)
      const count = Math.floor(zd.r*zd.r*.9)
      for(let j=0;j<count;j++){
        const a=Math.random()*Math.PI*2, d=Math.random()*zd.r
        const gx=zd.x+Math.cos(a)*d, gz=zd.z+Math.sin(a)*d
        const tuft = grassTuft()
        tuft.position.set(gx, terrainH(gx,gz), gz)
        s.add(tuft)
      }
    })

    /* mountains ring */
    for(let i=0;i<10;i++){
      const ang = (i/10)*Math.PI*2
      const d = 75+Math.random()*15
      const m = mountain(14+Math.random()*9, 18+Math.random()*12)
      m.position.set(Math.cos(ang)*d, -2, Math.sin(ang)*d)
      s.add(m)
    }

    /* clouds */
    this.clouds = []
    for(let i=0;i<8;i++){
      const c = cloud()
      c.position.set((Math.random()-.5)*120, 22+Math.random()*10, (Math.random()-.5)*120)
      c.scale.setScalar(2+Math.random()*1.6)
      s.add(c); this.clouds.push(c)
    }

    /* ambient deer that wanders */
    this.ambDeer = buildAnimal('deer')
    this.ambDeer.scale.setScalar(.55)
    this.ambDeer.position.set(14, terrainH(14,-26), -26)
    s.add(this.ambDeer)
    this.deerTarget = new THREE.Vector3(14,0,-26)
    this.deerTimer = 0

    /* player */
    this.player = explorer({ playerName: 'JOHN' })
    this.player.position.set(0, terrainH(0,40), 40)
    s.add(this.player)
    this.playerYaw = Math.PI
    this.walkPhase = 0
    this.grassMeter = 0

    /* ── Waypoint Beacon ── */
    this.waypointGroup = new THREE.Group()
    this.waypointGroup.visible = false
    this.wpMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.6), new THREE.MeshStandardMaterial({ color:0xF5C430, emissive:0xF5C430, emissiveIntensity:0.8, roughness:0.2 }))
    this.waypointGroup.add(this.wpMesh)
    this.wpLight = new THREE.PointLight(0xF5C430, 1.2, 10)
    this.waypointGroup.add(this.wpLight)
    
    const pillarMat = new THREE.MeshBasicMaterial({ color:0xF5C430, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false })
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 10, 8), pillarMat)
    pillar.position.y = -5
    this.waypointGroup.add(pillar)
    s.add(this.waypointGroup)

    this.wpTargetZone = null
    this.wpUpdateTimer = 0
  }

  /* ── Waypoint Methods ── */
  setWaypoint(zoneId) {
    this.wpTargetZone = zoneId
    this.wpUpdateTimer = 0
  }
  clearWaypoint() {
    this.wpTargetZone = null
  }
  getWaypointScreenInfo() {
    if(!this.waypointGroup || !this.waypointGroup.visible || this.mode !== 'world') return { visible:false }
    this.camera.updateMatrixWorld()
    const pos = this.waypointGroup.position.clone()
    pos.project(this.camera)
    
    const inFront = pos.z < 1
    const w = window.innerWidth, h = window.innerHeight
    const x = (pos.x * .5 + .5) * w
    const y = (-(pos.y) * .5 + .5) * h
    
    const pad = 40
    const isOffScreen = !inFront || x < pad || x > w-pad || y < pad || y > h-pad
    
    if(!isOffScreen) return { visible:false }
    
    const cx = w/2, cy = h/2
    let dx = x - cx, dy = y - cy
    if(!inFront){ dx = -dx; dy = -dy }
    const angle = Math.atan2(dy, dx)
    const dist = Math.round(this.player.position.distanceTo(this.waypointGroup.position))
    
    return { visible:true, angle, dist }
  }

  setCharacter({ jacket, name }={}){
    /* swap player colors for John/Maisey */
    if(!jacket) return
    this.worldScene.remove(this.player)
    const pos = this.player.position.clone()
    this.player = explorer({ jacket, playerName: name })
    this.player.position.copy(pos)
    this.worldScene.add(this.player)
  }

  /* ════════ BATTLE SCENE ════════ */
  _buildBattle(){
    const s = this.battleScene = new THREE.Scene()
    this._sky(s, '#2A5CB0', '#E8D8A8')
    s.fog = new THREE.Fog(0xD8CCA0, 18, 70)
    const hemi = new THREE.HemisphereLight(0xBFD8FF, 0x3A5A30, .5); s.add(hemi)
    const sun = new THREE.DirectionalLight(0xFFD898, 1.45)
    sun.position.set(-16, 18, 8); sun.castShadow = true
    sun.shadow.mapSize.set(1024,1024)
    const sc2 = sun.shadow.camera
    sc2.left=-25; sc2.right=25; sc2.top=25; sc2.bottom=-25
    s.add(sun)

    /* arena ground */
    const geo = new THREE.PlaneGeometry(80, 80, 24, 24)
    const pos = geo.attributes.position
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), y=pos.getY(i)
      const d=Math.sqrt(x*x+y*y)
      pos.setZ(i, d>10 ? (Math.sin(x*.25)*Math.cos(y*.3)*.8) : 0)
    }
    geo.computeVertexNormals()
    const ground = new THREE.Mesh(geo, mat(0x4A7E2C, 1))
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true
    s.add(ground)

    for(let i=0;i<46;i++){
      const ang=Math.random()*Math.PI*2, dist=12+Math.random()*20
      const t = pine(1.2)
      t.position.set(Math.cos(ang)*dist, 0, Math.sin(ang)*dist-3)
      s.add(t)
    }
    for(let i=0;i<6;i++){
      const r=rock(.4+Math.random()*.4)
      const ang=Math.random()*Math.PI*2
      r.position.set(Math.cos(ang)*8,.2,Math.sin(ang)*6-1); s.add(r)
    }

    /* dust motes */
    this.motes = []
    const moteM = new THREE.MeshBasicMaterial({ color:0xFFEEC0, transparent:true, opacity:.5 })
    for(let i=0;i<24;i++){
      const m = new THREE.Mesh(new THREE.SphereGeometry(.035,4,3), moteM)
      m.position.set((Math.random()-.5)*14, Math.random()*4+.5, (Math.random()-.5)*9)
      s.add(m); this.motes.push(m)
    }

    this.battleP = null   // player animal model
    this.battleE = null   // enemy model
    this.camOrbit = 0
    this.camOverride = null   // when a tween controls the camera
    this.camCriticalZoom = 0
    this.shake = 0
    
    this.hpStateP = 'NEUTRAL'
    this.hpStateE = 'NEUTRAL'
    this.battleParticles = []

    /* cage prop */
    this.cageMesh = new THREE.Group()
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.8,.7,.8), new THREE.MeshStandardMaterial({ color:0x9AA4B0, metalness:.6, roughness:.4, wireframe:true }))
    this.cageMesh.add(frame)
    const base = new THREE.Mesh(new THREE.BoxGeometry(.85,.1,.85), new THREE.MeshStandardMaterial({ color:0x6A7480, metalness:.7, roughness:.35 }))
    base.position.y = -.35
    this.cageMesh.add(base)
    this.cageMesh.visible = false
    s.add(this.cageMesh)
  }

  startBattle(playerAnimalId, playerEvolved, enemyId){
    if(this.battleP){ this.battleScene.remove(this.battleP) }
    if(this.battleE){ this.battleScene.remove(this.battleE) }
    this.battleP = buildAnimal(playerAnimalId, playerEvolved)
    this.battleP.position.set(-3.6, 0, 0)
    this.battleScene.add(this.battleP)
    this.battleE = buildAnimal(enemyId)
    this.battleE.position.set(3.6, 0, 0)
    this.battleE.rotation.y = Math.PI
    this.battleScene.add(this.battleE)
    this.cageMesh.visible = false
    this.mode = 'battle'
    this.camOrbit = 0
    this.camOverride = null
  }

  endBattle(){
    this.mode = 'world'
    this.encounterCooldown = 4
    this.grassMeter = 0
  }

  /* ── tween helper ── */
  _tween(dur, update, done){
    this.tweens.push({ t:0, dur, update, done })
  }

  /* dynamic camera swing for player attack */
  playPlayerAttack(onImpact, onDone){
    const P = this.battleP, E = this.battleE
    const startCam = this.camera.position.clone()
    this.camOverride = true
    /* phase 1: camera dives behind player shoulder (0-0.35s) */
    this._tween(.35, k=>{
      const target = new THREE.Vector3(-6.5, 2.0, 3.4)
      this.camera.position.lerpVectors(startCam, target, this._ease(k))
      this.camera.lookAt(E.position.x, 1.2, 0)
    })
    /* phase 2: lunge + camera whips alongside (0.35-0.8s) */
    setTimeout(()=>{
      const from = P.position.x
      this._tween(.4, k=>{
        const e = this._ease(k)
        P.position.x = from + e*5.4
        this.camera.position.set(-4+e*5, 1.6+e*.7, 4.4-e*1.2)
        this.camera.lookAt(E.position.x, 1.1, 0)
      }, ()=>{
        this.shake = .5
        onImpact && onImpact()
        /* enemy flinch */
        const eFrom = E.position.x
        this._tween(.3, k=>{ E.position.x = eFrom + Math.sin(k*Math.PI*5)*.3*(1-k) })
        /* phase 3: return (1.1-1.8s) */
        this._tween(.5, k=>{
          const e = this._ease(k)
          P.position.x = from + 5.4 - e*5.4
        })
        this._tween(.7, k=>{
          const e = this._ease(k)
          this.camera.position.lerp(new THREE.Vector3(Math.sin(this.camOrbit)*1.4, 3.0, 10.2), e*.15)
        }, ()=>{ this.camOverride = null; onDone && onDone() })
      })
    }, 360)
  }

  playEnemyAttack(onImpact, onDone){
    const P = this.battleP, E = this.battleE
    this.camOverride = true
    const startCam = this.camera.position.clone()
    this._tween(.3, k=>{
      const target = new THREE.Vector3(6.5, 2.2, 3.6)
      this.camera.position.lerpVectors(startCam, target, this._ease(k))
      this.camera.lookAt(P.position.x, 1.2, 0)
    })
    setTimeout(()=>{
      const from = E.position.x
      this._tween(.4, k=>{
        const e = this._ease(k)
        E.position.x = from - e*5.4
        this.camera.position.set(4-e*5, 1.8+e*.6, 4.6-e*1.0)
        this.camera.lookAt(P.position.x, 1.1, 0)
      }, ()=>{
        this.shake = .5
        onImpact && onImpact()
        const pFrom = P.position.x
        this._tween(.3, k=>{ P.position.x = pFrom + Math.sin(k*Math.PI*5)*.3*(1-k) })
        this._tween(.5, k=>{
          const e = this._ease(k)
          E.position.x = from - 5.4 + e*5.4
        })
        this._tween(.7, k=>{}, ()=>{ this.camOverride = null; onDone && onDone() })
      })
    }, 320)
  }

  playHeal(onDone){
    const P = this.battleP
    this._tween(.6, k=>{
      P.position.y = Math.sin(k*Math.PI)*0.7
      P.rotation.y = k*Math.PI*2
    }, ()=>{ P.position.y = 0; P.rotation.y = 0; onDone && onDone() })
  }

  playBuff(onDone){
    const P = this.battleP
    this._tween(.7, k=>{
      const s = .95 + Math.sin(k*Math.PI)*.18
      P.scale.setScalar(s)
    }, ()=>{ P.scale.setScalar(.95); onDone && onDone() })
  }

  /* cage throw with 3D arc */
  playCageThrow(success, onLand, onDone){
    const E = this.battleE
    const cage = this.cageMesh
    cage.visible = true
    cage.position.set(-3, 1, 2)
    cage.scale.setScalar(.6)
    this.camOverride = true
    /* arc to enemy */
    this._tween(.8, k=>{
      const e = this._ease(k)
      cage.position.x = -3 + e*(E.position.x+3)
      cage.position.z = 2 - e*2
      cage.position.y = 1 + Math.sin(e*Math.PI)*3.2
      cage.rotation.y = k*Math.PI*4
      this.camera.position.set(cage.position.x-3, cage.position.y+1.5, 7)
      this.camera.lookAt(cage.position)
    }, ()=>{
      this.shake = .35
      onLand && onLand()
      cage.position.set(E.position.x, .35, 0)
      cage.scale.setScalar(1)
      if(success){
        /* shrink enemy into cage */
        this._tween(.8, k=>{
          E.scale.setScalar(Math.max(.01,(1-k)))
          E.position.y = k*.3
          cage.rotation.y = Math.sin(k*Math.PI*6)*.15
        }, ()=>{
          E.visible = false
          this._tween(.6, k=>{
            this.camera.position.lerp(new THREE.Vector3(0,2.6,9), .08)
            this.camera.lookAt(cage.position)
          }, ()=>{ this.camOverride = null; onDone && onDone() })
        })
      } else {
        /* enemy bursts free */
        this._tween(.5, k=>{
          cage.rotation.z = Math.sin(k*Math.PI*8)*.3
        }, ()=>{
          cage.visible = false
          const s0 = E.scale.x
          this._tween(.35, k=>{ E.scale.setScalar(s0*(1+Math.sin(k*Math.PI)*.3)) },
            ()=>{ this.camOverride = null; onDone && onDone() })
        })
      }
    })
  }

  onLandedHit(who) {
    const A = who === 'enemy' ? this.battleE : this.battleP
    if(!A) return
    const isWinning = (who === 'enemy' ? this.hpStateE : this.hpStateP) === 'WINNING'
    this._tween(.35, k => {
      const e = Math.sin(k * Math.PI)
      A.position.y = e * 0.5
      if(A.userData.head) A.userData.head.rotation.x = e * 0.4
    }, () => {
      A.position.y = 0
      if(isWinning) {
        this._tween(.5, k => {
          const e = Math.sin(k * Math.PI)
          A.rotation.x = -e * (20 * Math.PI/180) // rear up
        })
      }
    })
  }

  onTookBigHit(who, dmgPct) {
    const A = who === 'enemy' ? this.battleE : this.battleP
    if(!A) return
    const dir = who === 'enemy' ? 1 : -1
    const sx = A.position.x
    if(dmgPct > 25){
      this._tween(.4, k => {
        const e = Math.sin(k * Math.PI)
        A.position.x = sx + dir * e * 0.8
        A.rotation.z = -dir * e * (15 * Math.PI / 180)
      }, () => {
        A.position.x = sx
        A.rotation.z = 0
      })
    }
  }

  onVictory(winner, onDone) {
    const A = winner === 'enemy' ? this.battleE : this.battleP
    if(!A) { onDone && onDone(); return }
    // Celebration
    if(A.userData.type === 'wolf'){
      this._tween(.6, k => {
        if(A.userData.head) A.userData.head.rotation.x = this._ease(k) * (-45 * Math.PI / 180)
      })
    } else if(A.userData.wings){
      this._tween(1.2, k => {
        A.position.y = Math.sin(k * Math.PI * 2) * 0.8
        A.userData.wings.forEach(w => w.rotation.z = 0.8 + Math.sin(k * Math.PI * 6) * 0.4)
        if(A.userData.tail) A.userData.tail.rotation.x = 0.5 * Math.sin(k * Math.PI)
      })
    } else {
      this._tween(1.2, k => {
        A.position.y = Math.max(0, Math.sin(k * Math.PI * 4) * 0.6)
        A.rotation.y = (winner === 'enemy' ? Math.PI : 0) + k * Math.PI * 2
      }, () => {
        A.rotation.y = winner === 'enemy' ? Math.PI : 0
      })
    }
    
    // Camera hero arc over 2s
    this.camOverride = true
    const cx = this.camera.position.x, cy = this.camera.position.y, cz = this.camera.position.z
    const targetX = A.position.x
    this._tween(2.0, k => {
      const a = k * Math.PI
      this.camera.position.x = targetX + Math.sin(a) * (cx - targetX) - Math.cos(a) * 6 * (winner === 'enemy' ? -1 : 1)
      this.camera.position.z = Math.cos(a) * cz + Math.sin(a) * 6
      this.camera.lookAt(A.position)
    }, () => {
      this.camOverride = null
      onDone && onDone()
    })
  }

  onDefeat(who, onDone) {
    const A = who === 'enemy' ? this.battleE : this.battleP
    if(!A) { onDone && onDone(); return }
    this._tween(1.0, k => {
      A.rotation.x = this._ease(k) * 1.2
      A.position.y = -this._ease(k) * 0.2
      if(A.userData.head) A.userData.head.rotation.x = this._ease(k) * 0.5
    }, () => {
      onDone && onDone()
    })
  }

  setBattleHpState(playerPct, enemyPct) {
    const getS = (p) => p < 25 ? 'CRITICAL' : p <= 50 ? 'HURT' : 'NEUTRAL'
    let np = getS(playerPct), ne = getS(enemyPct)
    if(playerPct > 60 && enemyPct < 40) np = 'WINNING'
    if(enemyPct > 60 && playerPct < 40) ne = 'WINNING'
    
    if(np === 'CRITICAL' || ne === 'CRITICAL'){
      this.camCriticalZoom = 1
    } else {
      this.camCriticalZoom = 0
    }
    
    this.hpStateP = np
    this.hpStateE = ne
  }

  _ease(k){ return k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2 }

  _sky(scene, top, bottom){
    const c = document.createElement('canvas'); c.width=2; c.height=256
    const g = c.getContext('2d')
    const gr = g.createLinearGradient(0,0,0,256)
    gr.addColorStop(0, top); gr.addColorStop(1, bottom)
    g.fillStyle = gr; g.fillRect(0,0,2,256)
    scene.background = new THREE.CanvasTexture(c)
  }

  /* ════════ MAIN LOOP ════════ */
  _loop(){
    requestAnimationFrame(this._loop)
    const dt = Math.min(this.clock.getDelta(), .05)
    const t = this.clock.elapsedTime

    /* run tweens */
    for(let i=this.tweens.length-1; i>=0; i--){
      const tw = this.tweens[i]
      tw.t += dt
      const k = Math.min(tw.t/tw.dur, 1)
      tw.update(k)
      if(k>=1){ this.tweens.splice(i,1); tw.done && tw.done() }
    }

    if(this.mode==='world') this._tickWorld(dt, t)
    else this._tickBattle(dt, t)
  }

  _tickWorld(dt, t){
    /* merge keyboard input */
    let ix = this.input.x, iz = this.input.z
    if(this.keys['w']||this.keys['arrowup'])    iz -= 1
    if(this.keys['s']||this.keys['arrowdown'])  iz += 1
    if(this.keys['a']||this.keys['arrowleft'])  ix -= 1
    if(this.keys['d']||this.keys['arrowright']) ix += 1
    const len = Math.hypot(ix, iz)
    if(len>1){ ix/=len; iz/=len }
    const moving = len > .12 && !this.paused

    if(moving){
      const speed = 7
      const nx = this.player.position.x + ix*speed*dt
      const nz = this.player.position.z + iz*speed*dt
      /* world bounds */
      const d = Math.hypot(nx, nz)
      let fx = nx, fz = nz
      if(d > WORLD_RADIUS){ fx = nx/d*WORLD_RADIUS; fz = nz/d*WORLD_RADIUS }
      /* tree collision push-out */
      for(const c of this.treeCols){
        const dx = fx-c.x, dz = fz-c.z
        const dist = Math.hypot(dx,dz)
        if(dist < c.r && dist > .001){
          fx = c.x + dx/dist*c.r
          fz = c.z + dz/dist*c.r
        }
      }
      this.player.position.x = fx
      this.player.position.z = fz
      this.player.position.y = terrainH(fx, fz)
      this.playerYaw = Math.atan2(ix, iz) - Math.PI/2
      /* walk cycle */
      const prevPhase = this.walkPhase
      this.walkPhase += dt*9
      if (Math.floor(this.walkPhase / Math.PI) > Math.floor(prevPhase / Math.PI)) {
         if(window.AUDIO) window.AUDIO.step()
      }
      const { legs, arms, upperBody } = this.player.userData
      legs.forEach((l,i)=>{ 
        const cycle = this.walkPhase + i*Math.PI
        l.upper.rotation.z = Math.sin(cycle)*.8
        l.lower.rotation.z = -Math.max(0, Math.sin(cycle)) * 1.4
      })
      arms.forEach((a,i)=>{ 
        const cycle = this.walkPhase + (1-i)*Math.PI
        a.upper.rotation.z = Math.sin(cycle)*.6
        a.lower.rotation.z = 0.15 + Math.max(0, Math.sin(cycle)) * 0.6
      })
      
      const bounce = Math.abs(Math.sin(this.walkPhase)) * 0.14
      const sideSway = Math.sin(this.walkPhase) * 0.08
      if(upperBody) {
        upperBody.position.y = bounce
        upperBody.rotation.x = sideSway
      }

      /* encounter check inside grass zones */
      if(this.encounterCooldown > 0) this.encounterCooldown -= dt
      else {
        for(const z of this.grassZones){
          if(Math.hypot(fx-z.x, fz-z.z) < z.r){
            this.grassMeter += dt
            if(this.grassMeter > .4 && Math.random() < dt*.6){
              this.grassMeter = 0
              this.cb.onEncounter && this.cb.onEncounter(z.id)
            }
            break
          }
        }
      }
    } else {
      const { legs, arms, upperBody } = this.player.userData
      legs.forEach(l=>{ 
        l.upper.rotation.z *= .85
        l.lower.rotation.z *= .85
      })
      arms.forEach(a=>{ 
        a.upper.rotation.z *= .85
        a.lower.rotation.z += (0.15 - a.lower.rotation.z) * .15
      })
      if(upperBody) {
        upperBody.position.y *= .8
        upperBody.rotation.x *= .8
      }
    }
    /* smooth facing */
    let dy = this.playerYaw - this.player.rotation.y
    while(dy > Math.PI) dy -= Math.PI*2
    while(dy < -Math.PI) dy += Math.PI*2
    this.player.rotation.y += dy*Math.min(1, dt*10)

    /* idle breathe */
    this.player.position.y = terrainH(this.player.position.x, this.player.position.z) + Math.abs(Math.sin(t*1.3))*.012

    /* third-person follow camera */
    const px = this.player.position.x, pz = this.player.position.z
    const camTarget = new THREE.Vector3(px, this.player.position.y+2.6, pz+7.2)
    this.camera.position.lerp(camTarget, Math.min(1, dt*4))
    this.camera.lookAt(px, this.player.position.y+1.4, pz-3)

    /* clouds drift */
    this.clouds.forEach((c,i)=>{ c.position.x += dt*(0.4+i*.05); if(c.position.x>70) c.position.x=-70 })

    /* ambient deer wander */
    this.deerTimer -= dt
    if(this.deerTimer <= 0){
      this.deerTimer = 4+Math.random()*5
      const a = Math.random()*Math.PI*2
      this.deerTarget.set(this.ambDeer.position.x+Math.cos(a)*8, 0, this.ambDeer.position.z+Math.sin(a)*8)
      const dd = Math.hypot(this.deerTarget.x, this.deerTarget.z)
      if(dd > WORLD_RADIUS-5){ this.deerTarget.multiplyScalar((WORLD_RADIUS-5)/dd) }
    }
    const dx = this.deerTarget.x - this.ambDeer.position.x
    const dz = this.deerTarget.z - this.ambDeer.position.z
    const dd = Math.hypot(dx,dz)
    if(dd > .5){
      this.ambDeer.position.x += dx/dd*dt*1.4
      this.ambDeer.position.z += dz/dd*dt*1.4
      this.ambDeer.rotation.y = Math.atan2(dx,dz) + Math.PI/2
    }
    this.ambDeer.position.y = terrainH(this.ambDeer.position.x, this.ambDeer.position.z)
    if(this.ambDeer.userData.head) this.ambDeer.userData.head.rotation.y = Math.sin(t*.7)*.3

    /* waypoint animation & target resolution */
    if(this.wpTargetZone !== null){
      if(!this.waypointGroup.visible) this.waypointGroup.visible = true
      
      let targetZ = null
      if(this.wpTargetZone === 'any' && this.grassZones){
        this.wpUpdateTimer -= dt
        if(this.wpUpdateTimer <= 0 || !this.currentWpZ){
          this.wpUpdateTimer = 2
          let minDist = Infinity
          for(const z of this.grassZones){
            const d = Math.hypot(this.player.position.x - z.x, this.player.position.z - z.z)
            if(d < minDist) { minDist = d; targetZ = z }
          }
          this.currentWpZ = targetZ
        } else {
          targetZ = this.currentWpZ
        }
      } else if (this.grassZones) {
        targetZ = this.grassZones.find(z => z.id === this.wpTargetZone)
      }

      if(targetZ){
        this.waypointGroup.position.set(targetZ.x, terrainH(targetZ.x, targetZ.z) + 4, targetZ.z)
        this.wpMesh.position.y = Math.sin(t*3)*.4
        this.wpMesh.rotation.y += dt * 1.5
      }
    } else {
      if(this.waypointGroup.visible) this.waypointGroup.visible = false
    }

    this.renderer.render(this.worldScene, this.camera)
  }

  _tickBattle(dt, t){
    /* idle animations */
    const applyIdle = (A, state) => {
      if(!A) return
      let headPitch = 0, tilt = 0, tailZ = Math.PI/2.4, amp = 1, speed = 1, droop = 1
      if(state === 'WINNING'){
        tilt = -8 * Math.PI/180; headPitch = 15 * Math.PI/180; speed = 2; amp = 1.5
      } else if(state === 'HURT'){
        headPitch = -20 * Math.PI/180; speed = 1.4; droop = 0.6
      } else if(state === 'CRITICAL'){
        tilt = 12 * Math.PI/180; headPitch = -35 * Math.PI/180; droop = 0; speed = 0.5
        if(Math.random() < 0.05) A.position.y = -0.1 // stumble dip
        A.rotation.z = (Math.random()-.5)*.08 // tremble
      } else {
        A.rotation.z = 0 // reset tremble
      }
      
      // smooth lerp
      A.rotation.x += (tilt - A.rotation.x) * dt * 2
      if(A.userData.head) A.userData.head.rotation.x += (headPitch - A.userData.head.rotation.x) * dt * 2
      if(A.userData.tail) A.userData.tail.rotation.z += (tailZ*droop + Math.sin(t*3*speed)*.14*amp - A.userData.tail.rotation.z) * dt * 2
      
      A.position.y += (0 - A.position.y) * dt * 5 // recover from stumble
      A.scale.y = A.scale.x * (1 + Math.sin(t*2.2*speed)*.012*amp)
      if(A.userData.wings) A.userData.wings.forEach((w,i)=>{ w.rotation.z = .4+Math.sin(t*3+i*speed)*.15*amp })
      
      // particles
      if(Math.random() < dt*1.25 && this.battleParticles.length < 12) {
        if(state === 'CRITICAL'){
          const p = new THREE.Mesh(new THREE.SphereGeometry(.05,4,4), new THREE.MeshBasicMaterial({color:0x999999, transparent:true}))
          p.position.set(A.position.x+(Math.random()-.5)*.5, 1.8, A.position.z+(Math.random()-.5)*.5)
          p.userData = { life: 0.6, type: 'sweat', dy: -1 }
          this.battleScene.add(p); this.battleParticles.push(p)
        } else if(state === 'WINNING' && Math.random() < 0.5){
          const p = new THREE.Mesh(new THREE.SphereGeometry(.04,4,4), new THREE.MeshBasicMaterial({color:0xFFFFFF}))
          p.position.set(A.position.x+(Math.random()-.5)*1.2, 1.5+(Math.random()-.5)*.5, A.position.z+(Math.random()-.5)*1.2)
          p.userData = { life: 0.4, type: 'sparkle', dy: 0.5 }
          this.battleScene.add(p); this.battleParticles.push(p)
        }
      }
    }
    
    applyIdle(this.battleP, this.hpStateP)
    if(this.battleE && this.battleE.visible) applyIdle(this.battleE, this.hpStateE)

    /* battle particles */
    for(let i=this.battleParticles.length-1; i>=0; i--){
      const p = this.battleParticles[i]
      p.userData.life -= dt
      if(p.userData.life <= 0){
        this.battleScene.remove(p); this.battleParticles.splice(i,1)
      } else {
        p.position.y += p.userData.dy * dt
        if(p.material.transparent) p.material.opacity = p.userData.life / 0.6
      }
    }

    /* dust motes */
    this.motes.forEach((m,i)=>{
      m.position.y += dt*.25
      m.position.x += Math.sin(t+i)*.002
      if(m.position.y > 5) m.position.y = .4
    })
    /* default slow orbit camera unless a tween owns it */
    if(!this.camOverride){
      this.camOrbit += dt*.12
      const cx = Math.sin(this.camOrbit)*1.6
      
      const zoom = this.camCriticalZoom
      const targetCam = new THREE.Vector3(cx, 3.0 - zoom*0.4, 10.2 - zoom*1.5)
      this.camera.position.lerp(targetCam, Math.min(1, dt*2))
      this.camera.lookAt(0, 1.1 - zoom*0.2, 0)
    }
    /* impact shake */
    if(this.shake > 0){
      this.shake -= dt*2
      this.camera.position.x += (Math.random()-.5)*this.shake*.5
      this.camera.position.y += (Math.random()-.5)*this.shake*.5
    }
    this.renderer.render(this.battleScene, this.camera)
  }
}
