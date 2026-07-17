/* ── WILDDOX 3D ENGINE ──
   One renderer, two scenes (world + battle).
   World: free WASD/joystick movement, third-person camera, grass encounter zones.
   Battle: arena with dynamic swinging camera, attack/heal/cage animation timelines. */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { terrainH, buildTerrain, pine, mountain, rock, flowers, cloud, explorer, buildAnimal, mat, fruit, grassField, waterMaterial } from './models.js'

const WORLD_RADIUS = 52

/* Final color grade + vignette — teal shadows, warm highlights, gentle vignette */
const GradeShader = {
  uniforms: { tDiffuse:{ value:null }, uVignette:{ value:.2 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = dot(c.rgb, vec3(.299,.587,.114));
      /* teal lift in shadows, warm gold push in highlights */
      c.rgb += (1.-smoothstep(0.,.45,lum)) * vec3(-.012,.014,.022);
      c.rgb += smoothstep(.55,1.,lum) * vec3(.035,.018,-.012);
      /* +5% saturation */
      c.rgb = mix(vec3(lum), c.rgb, 1.05);
      /* vignette */
      float d = distance(vUv, vec2(.5));
      c.rgb *= 1. - uVignette*smoothstep(.42,.85,d);
      gl_FragColor = c;
    }`
}

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
    /* cinematic color pipeline */
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25

    /* perf tier — phones with very dense screens skip the heavy FX */
    this.lowFX = (window.devicePixelRatio||1) > 2 || /Mobi|Android/i.test(navigator.userAgent)

    this.camera = new THREE.PerspectiveCamera(55, 1, .1, 300)
    this.clock = new THREE.Clock()
    this.animMats = []                 // materials with a uTime uniform (water, grass wind)

    this._buildWorld()
    this._buildBattle()

    /* post-processing: MSAA+HDR target → render → bloom → grade/vignette */
    const rt = new THREE.WebGLRenderTarget(1, 1, { samples: this.lowFX ? 0 : 4, type: THREE.HalfFloatType })
    this.composer = new EffectComposer(this.renderer, rt)
    this.renderPass = new RenderPass(this.worldScene, this.camera)
    this.composer.addPass(this.renderPass)
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1,1), .35, .6, .85)
    this.bloomPass.enabled = !this.lowFX
    this.composer.addPass(this.bloomPass)
    /* OutputPass applies ACES tone mapping + sRGB conversion; grade runs after, in display space */
    this.composer.addPass(new OutputPass())
    this.gradePass = new ShaderPass(GradeShader)
    this.composer.addPass(this.gradePass)

    /* perf probe for verification: window.__perf = { fps, calls } */
    this._frames = 0; this._perfT = 0
    window.__perf = { fps: 0, calls: 0 }

    this._resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      this.renderer.setSize(w, h, false)
      this.composer.setPixelRatio(this.renderer.getPixelRatio())
      this.composer.setSize(w, h)
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
    const sunDir = new THREE.Vector3(38, 20, 14).normalize()
    this._skyDome(s, {
      zenith:0x3572CE, horizon:0xF8D9A8, ground:0xB8C8D8, sunDir,
      sunColor:0xFFF2CC, sunSize:.9985, haloSize:.93
    })
    s.fog = new THREE.FogExp2(0xBCC9D8, .0068)

    /* golden-hour light rig: warm low key + cool sky fill */
    const hemi = new THREE.HemisphereLight(0xBFD8FF, 0x3E5E30, .55); s.add(hemi)
    this.worldSun = new THREE.DirectionalLight(0xFFD9A0, 1.9)
    this.worldSun.position.set(38, 22, 14)
    this.worldSun.castShadow = true
    this.worldSun.shadow.mapSize.set(this.lowFX ? 2048 : 4096, this.lowFX ? 2048 : 4096)
    this.worldSun.shadow.bias = -0.0004
    this.worldSun.shadow.normalBias = .02
    const sc = this.worldSun.shadow.camera
    sc.left=-60; sc.right=60; sc.top=60; sc.bottom=-60
    s.add(this.worldSun)
    /* faint warm bounce from the west so shadow sides aren't dead */
    const bounce = new THREE.DirectionalLight(0xFFB070, .18)
    bounce.position.set(-30, 10, -20); s.add(bounce)

    s.add(buildTerrain())

    /* dirt path winding north */
    const pathPts = []
    for(let z=46; z>=-46; z-=2){
      const x = Math.sin(z*.09)*6
      pathPts.push(new THREE.Vector3(x, terrainH(x,z)+.06, z))
    }
    const pathCurve = new THREE.CatmullRomCurve3(pathPts)
    const pathGeo = new THREE.TubeGeometry(pathCurve, 50, 1.4, 5, false)
    const path = new THREE.Mesh(pathGeo, new THREE.MeshStandardMaterial({ color:0x8A6430, roughness:1, metalness:0 }))
    path.scale.y = .06
    path.receiveShadow = true
    s.add(path)

    /* river to the west — animated shader water */
    const wMat = waterMaterial()
    this.animMats.push(wMat)
    const river = new THREE.Mesh(new THREE.PlaneGeometry(6, 110, 6, 110), wMat)
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
      if(Math.hypot(x, z-40) < 10) continue                     // spawn clearing
      if(z > 20 && Math.abs(x) < 7) continue                    // title-camera sightline
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

    /* encounter grass zones — dense tall grass (instanced, wind-swayed) */
    this.grassZones = []
    const zoneDefs = [
      {x: 12, z: -8,  r: 6}, {x: -8, z: -22, r: 5.5}, {x: 18, z: 16, r: 6},
      {x: -12, z: 24, r: 5}, {x: 2, z: -38, r: 6.5}, {x: 30, z: -20, r: 5},
    ]
    const tallPts = []
    zoneDefs.forEach((zd, i)=>{
      this.grassZones.push({ ...zd, id:i })
      const count = Math.floor(zd.r*zd.r*4)
      for(let j=0;j<count;j++){
        const a=Math.random()*Math.PI*2, d=Math.sqrt(Math.random())*zd.r
        const gx=zd.x+Math.cos(a)*d, gz=zd.z+Math.sin(a)*d
        tallPts.push([gx, terrainH(gx,gz), gz])
      }
    })
    const tallGrass = grassField(tallPts, { color:0x4E8C2E, height:1.15, width:.85 })
    this.animMats.push(tallGrass.material)
    s.add(tallGrass)

    /* ambient meadow grass scattered across the whole map */
    const meadowPts = []
    const meadowN = this.lowFX ? 1600 : 3200
    for(let i=0;i<meadowN;i++){
      const x=(Math.random()-.5)*100, z=(Math.random()-.5)*100
      if(Math.abs(x - Math.sin(z*.09)*6) < 2.4) continue      // off path
      if(x > -23.5 && x < -16.5) continue                     // off river
      meadowPts.push([x, terrainH(x,z), z])
    }
    const meadow = grassField(meadowPts, { color:0x60A040, height:.55, width:.6 })
    this.animMats.push(meadow.material)
    s.add(meadow)

    /* mountains — two rings, far ring hazier for depth */
    for(let i=0;i<10;i++){
      const ang = (i/10)*Math.PI*2
      const d = 75+Math.random()*15
      const m = mountain(14+Math.random()*9, 18+Math.random()*12)
      m.position.set(Math.cos(ang)*d, -2, Math.sin(ang)*d)
      s.add(m)
    }
    for(let i=0;i<8;i++){
      const ang = (i/8)*Math.PI*2 + .35
      const d = 115+Math.random()*20
      const m = mountain(24+Math.random()*12, 30+Math.random()*14, 0x5A7298)
      m.position.set(Math.cos(ang)*d, -4, Math.sin(ang)*d)
      s.add(m)
    }

    /* healing fruits */
    this.fruits = []
    for(let i=0;i<12;i++){
      const fr = fruit()
      const x=(Math.random()-.5)*80, z=(Math.random()-.5)*80
      fr.position.set(x, terrainH(x,z)+.1, z)
      s.add(fr)
      this.fruits.push(fr)
    }

    /* clouds */
    this.clouds = []
    for(let i=0;i<8;i++){
      const c = cloud()
      c.position.set((Math.random()-.5)*120, 22+Math.random()*10, (Math.random()-.5)*120)
      c.scale.setScalar(2+Math.random()*1.6)
      s.add(c); this.clouds.push(c)
    }

    /* drifting pollen motes in the sunlight */
    {
      const n = this.lowFX ? 60 : 140
      const pGeo = new THREE.BufferGeometry()
      const pPos = new Float32Array(n*3)
      for(let i=0;i<n;i++){
        pPos[i*3]   = (Math.random()-.5)*70
        pPos[i*3+1] = .5 + Math.random()*6
        pPos[i*3+2] = (Math.random()-.5)*70
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      this.pollen = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color:0xFFEEC0, size:.09, transparent:true, opacity:.55,
        blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true
      }))
      s.add(this.pollen)
    }

    /* circling hawks overhead */
    this.skyBirds = []
    for(let i=0;i<2;i++){
      const hk = buildAnimal('hawk')
      hk.scale.setScalar(.7)
      hk.userData.orbit = { r: 18+i*9, h: 16+i*4, ph: i*Math.PI, sp: .14+i*.04 }
      s.add(hk); this.skyBirds.push(hk)
    }

    /* butterflies near the flower patches */
    this.butterflies = []
    const bfCols = [0xF0D040, 0xE06080, 0x80A8F0]
    for(let i=0;i<6;i++){
      const bf = new THREE.Mesh(new THREE.PlaneGeometry(.22,.18),
        new THREE.MeshBasicMaterial({ color:bfCols[i%3], side:THREE.DoubleSide, transparent:true, opacity:.95 }))
      const bx=(Math.random()-.5)*50, bz=(Math.random()-.5)*50
      bf.userData.home = { x:bx, z:bz, ph: Math.random()*Math.PI*2 }
      s.add(bf); this.butterflies.push(bf)
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

  /* data for the HUD minimap canvas: positions in world units, radius = world bounds */
  getMinimapInfo(){
    return {
      radius: WORLD_RADIUS,
      player: { x: this.player.position.x, z: this.player.position.z, yaw: this.player.rotation.y },
      zones: this.grassZones.map(z=>({ x:z.x, z:z.z, r:z.r })),
      waypoint: this.waypointGroup.visible
        ? { x: this.waypointGroup.position.x, z: this.waypointGroup.position.z } : null,
      river: { x:-20, w:6 },
      deer: { x: this.ambDeer.position.x, z: this.ambDeer.position.z },
    }
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
    this._skyDome(s, {
      zenith:0x2A5CB0, horizon:0xF2D8A0, ground:0xD8CCA0,
      sunDir:new THREE.Vector3(-16, 14, 8).normalize(),
      sunColor:0xFFEECC, sunSize:.998, haloSize:.9
    })
    s.fog = new THREE.FogExp2(0xD8CCA0, .012)
    const hemi = new THREE.HemisphereLight(0xBFD8FF, 0x3E5E30, .7); s.add(hemi)
    const sun = new THREE.DirectionalLight(0xFFD898, 1.9)
    sun.position.set(-16, 14, 8); sun.castShadow = true
    sun.shadow.mapSize.set(2048,2048)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = .02
    const sc2 = sun.shadow.camera
    sc2.left=-25; sc2.right=25; sc2.top=25; sc2.bottom=-25
    s.add(sun)
    const bounce2 = new THREE.DirectionalLight(0xFFB070, .2)
    bounce2.position.set(14, 8, -10); s.add(bounce2)

    /* arena ground */
    const geo = new THREE.PlaneGeometry(80, 80, 24, 24)
    const pos = geo.attributes.position
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), y=pos.getY(i)
      const d=Math.sqrt(x*x+y*y)
      pos.setZ(i, d>10 ? (Math.sin(x*.25)*Math.cos(y*.3)*.8) : 0)
    }
    geo.computeVertexNormals()
    /* vertex-color variation so the arena floor isn't one flat green */
    {
      const colors = new Float32Array(pos.count*3)
      const base = new THREE.Color(0x4A7E2C), dry = new THREE.Color(0x6E8A38), dark = new THREE.Color(0x37641F)
      const tmp = new THREE.Color()
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i), y=pos.getY(i)
        const nv = (Math.sin(x*.35+y*.21)+Math.sin(x*.11-y*.4+2.))*.5
        tmp.copy(base)
        if(nv>.2) tmp.lerp(dry, (nv-.2)*.9)
        if(nv<-.2) tmp.lerp(dark, (-nv-.2)*.9)
        colors[i*3]=tmp.r; colors[i*3+1]=tmp.g; colors[i*3+2]=tmp.b
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.95, metalness:0 }))
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true
    s.add(ground)

    /* tufts of instanced grass around the arena edge */
    const arenaPts = []
    for(let i=0;i<260;i++){
      const ang=Math.random()*Math.PI*2, dist=7+Math.random()*18
      arenaPts.push([Math.cos(ang)*dist, 0, Math.sin(ang)*dist-2])
    }
    const arenaGrass = grassField(arenaPts, { color:0x4E8A30, height:.7, width:.65 })
    this.animMats.push(arenaGrass.material)
    s.add(arenaGrass)

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

  updateBattler(playerAnimalId, playerEvolved){
    if(this.battleP){ this.battleScene.remove(this.battleP) }
    this.battleP = buildAnimal(playerAnimalId, playerEvolved)
    this.battleP.position.set(-3.6, 0, 0)
    this.battleScene.add(this.battleP)
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
        /* gold sparkle burst on successful capture */
        for(let i=0;i<16 && this.battleParticles.length<40;i++){
          const p = new THREE.Mesh(new THREE.SphereGeometry(.05,4,4),
            new THREE.MeshBasicMaterial({ color:0xFFD860, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }))
          p.position.set(E.position.x+(Math.random()-.5)*1.2, .6+Math.random()*1.4, (Math.random()-.5)*1.2)
          p.userData = { life: .9, type:'gold', dy: .8+Math.random()*1.2 }
          this.battleScene.add(p); this.battleParticles.push(p)
        }
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

  /* shader sky dome: zenith→horizon gradient + visible sun disc with bloom halo */
  _skyDome(scene, { zenith, horizon, ground, sunDir, sunColor, sunSize=.9985, haloSize=.93 }){
    const matSky = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uZenith:  { value: new THREE.Color(zenith) },
        uHorizon: { value: new THREE.Color(horizon) },
        uGround:  { value: new THREE.Color(ground) },
        uSunDir:  { value: sunDir.clone() },
        uSunCol:  { value: new THREE.Color(sunColor) },
        uSunSize: { value: sunSize },
        uHalo:    { value: haloSize },
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){
          vDir = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunCol;
        uniform float uSunSize, uHalo;
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -1., 1.);
          /* below horizon fades to ground haze; above blends horizon→zenith */
          vec3 col = h < 0.
            ? mix(uHorizon, uGround, clamp(-h*4., 0., 1.))
            : mix(uHorizon, uZenith, pow(clamp(h*1.6, 0., 1.), .5));
          float sd = dot(d, uSunDir);
          /* wide warm halo + hot disc (HDR values feed the bloom pass) */
          col += uSunCol * pow(clamp((sd-uHalo)/(1.-uHalo), 0., 1.), 3.) * .55;
          col += uSunCol * smoothstep(uSunSize, uSunSize + .0008, sd) * 2.4;
          gl_FragColor = vec4(col, 1.);
        }`
    })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 18), matSky)
    dome.renderOrder = -1
    scene.add(dome)
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

    /* animated materials (water ripple, grass wind) */
    for(const m of this.animMats){ if(m.userData.shader) m.userData.shader.uniforms.uTime.value = t; if(m.uniforms) m.uniforms.uTime.value = t }

    /* render through the post-FX chain */
    this.renderPass.scene = this.mode==='world' ? this.worldScene : this.battleScene
    this.renderer.info.autoReset = false
    this.renderer.info.reset()
    this.composer.render()

    /* perf probe */
    this._frames++; this._perfT += dt
    if(this._perfT >= 1){
      window.__perf = { fps: Math.round(this._frames/this._perfT), calls: this.renderer.info.render.calls }
      this._frames = 0; this._perfT = 0
    }
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

      /* fruit collision */
      for(let i=this.fruits.length-1; i>=0; i--){
        const fr = this.fruits[i]
        if(Math.hypot(fx-fr.position.x, fz-fr.position.z) < 1.5){
          this.worldScene.remove(fr)
          this.fruits.splice(i, 1)
          if(this.cb.onHealItem) this.cb.onHealItem()
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
        upperBody.position.y += (0 - upperBody.position.y) * .15
        upperBody.rotation.x *= .85
      }
    }
    
    /* fruit respawn */
    if(this.fruits.length < 15 && Math.random() < dt * 0.05) {
      const fr = fruit()
      const x=(Math.random()-.5)*80, z=(Math.random()-.5)*80
      fr.position.set(x, terrainH(x,z)+.1, z)
      this.worldScene.add(fr)
      this.fruits.push(fr)
    }

    /* smooth facing */
    let dy = this.playerYaw - this.player.rotation.y
    while(dy > Math.PI) dy -= Math.PI*2
    while(dy < -Math.PI) dy += Math.PI*2
    this.player.rotation.y += dy*Math.min(1, dt*10)

    /* idle breathe */
    this.player.position.y = terrainH(this.player.position.x, this.player.position.z) + Math.abs(Math.sin(t*1.3))*.012

    /* third-person follow camera with subtle breathing sway */
    const px = this.player.position.x, pz = this.player.position.z
    const camTarget = new THREE.Vector3(
      px + Math.sin(t*.32)*.12,
      this.player.position.y+2.6 + Math.sin(t*.47)*.06,
      pz+7.2)
    this.camera.position.lerp(camTarget, Math.min(1, dt*4))
    this.camera.lookAt(px, this.player.position.y+1.4, pz-3)

    /* clouds drift */
    this.clouds.forEach((c,i)=>{ c.position.x += dt*(0.4+i*.05); if(c.position.x>70) c.position.x=-70 })

    /* pollen drift */
    if(this.pollen){
      const pp = this.pollen.geometry.attributes.position
      for(let i=0;i<pp.count;i++){
        let py = pp.getY(i) + dt*.18
        pp.setX(i, pp.getX(i) + Math.sin(t*.5+i)*dt*.3)
        if(py > 7) py = .4
        pp.setY(i, py)
      }
      pp.needsUpdate = true
    }

    /* hawks circle */
    for(const hk of this.skyBirds){
      const o = hk.userData.orbit
      const a = t*o.sp + o.ph
      hk.position.set(Math.cos(a)*o.r, o.h + Math.sin(t*.6+o.ph)*1.2, Math.sin(a)*o.r)
      hk.rotation.y = -a
      if(hk.userData.wings) hk.userData.wings.forEach((w,i)=>{ w.rotation.z = .4+Math.sin(t*7+i)*.35 })
    }

    /* butterflies flutter */
    for(const bf of this.butterflies){
      const hm = bf.userData.home
      bf.position.set(
        hm.x + Math.sin(t*.7+hm.ph)*1.6,
        terrainH(hm.x, hm.z) + .6 + Math.sin(t*2.1+hm.ph)*.25,
        hm.z + Math.cos(t*.55+hm.ph)*1.6)
      bf.rotation.y = t*.7+hm.ph
      bf.scale.x = .6 + Math.abs(Math.sin(t*10+hm.ph))*.5   // wing flap
    }

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
  }
}
