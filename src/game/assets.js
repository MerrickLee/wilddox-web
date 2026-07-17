/* ── WILDDOX ASSET PIPELINE (Phase 3 scaffolding) ──
   Drop AI-generated GLB models into public/models/ (see MANIFEST below) and
   set USE_PROCEDURAL = false. Until then the game uses the procedural builders
   in models.js — everything keeps working with zero assets present.

   Expected clips per animal GLB: idle, walk, attack, hit, faint (any subset ok;
   missing clips fall back to idle). Compress with:
   npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress ktx2
*/
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { buildAnimal, explorer } from './models.js'

export const USE_PROCEDURAL = true

export const MANIFEST = {
  fox:     '/models/fox.glb',
  wolf:    '/models/wolf.glb',
  raccoon: '/models/raccoon.glb',
  deer:    '/models/deer.glb',
  bear:    '/models/bear.glb',
  rabbit:  '/models/rabbit.glb',
  otter:   '/models/otter.glb',
  beaver:  '/models/beaver.glb',
  owl:     '/models/owl.glb',
  hawk:    '/models/hawk.glb',
  snake:   '/models/snake.glb',
  explorer:'/models/explorer.glb',
}

const cache = new Map()      // id -> { scene, animations }
let loader = null

export async function loadAll(onProgress){
  if(USE_PROCEDURAL) { onProgress && onProgress(1); return }
  loader = loader || new GLTFLoader()
  const ids = Object.keys(MANIFEST)
  let done = 0
  await Promise.all(ids.map(async id=>{
    try {
      const gltf = await loader.loadAsync(MANIFEST[id])
      gltf.scene.traverse(o=>{ if(o.isMesh){ o.castShadow = true } })
      cache.set(id, { scene: gltf.scene, animations: gltf.animations })
    } catch(e){
      console.warn(`[assets] ${id} failed to load, using procedural fallback`, e)
    }
    done++; onProgress && onProgress(done/ids.length)
  }))
}

/* Returns { object3d, mixer|null, clips:{} } — procedural or GLB instance. */
export function spawn(id, evolved=false){
  const entry = cache.get(id)
  if(USE_PROCEDURAL || !entry){
    const obj = id === 'explorer' ? explorer() : buildAnimal(id, evolved)
    return { object3d: obj, mixer: null, clips: {} }
  }
  const obj = SkeletonUtils.clone(entry.scene)
  const mixer = new THREE.AnimationMixer(obj)
  const clips = {}
  for(const c of entry.animations){
    const key = c.name.toLowerCase()
    ;['idle','walk','attack','hit','faint'].forEach(k=>{ if(key.includes(k)) clips[k] = mixer.clipAction(c) })
  }
  clips.idle && clips.idle.play()
  return { object3d: obj, mixer, clips }
}
