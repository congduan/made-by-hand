import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import type { PieceType } from '../../types/game'
import { createPiece, disposePiece, SIZE, type Piece } from './pieces'
import { Magnetics } from './magnetics'
import type { ModelRecipe } from '../../data/models'
export const GRAVITY = -981
const FIXED = 1 / 120
export class MagnetWorld {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, GRAVITY, 0) })
  readonly material = new CANNON.Material('piece')
  readonly magnetics = new Magnetics(this.world)
  readonly pieces: Piece[] = []
  private accumulator = 0
  constructor(private scene: THREE.Scene) {
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true
    ;(this.world.solver as CANNON.GSSolver).iterations = 20
    ;(this.world.solver as CANNON.GSSolver).tolerance = 1e-4
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.material, this.material, {
        friction: 0.55,
        restitution: 0.12,
      }),
    )
    const ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.material,
    })
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(ground)
  }
  add(
    type: PieceType,
    position: CANNON.Vec3,
    quat = new CANNON.Quaternion(),
    demo = false,
    fixed = false,
  ) {
    const piece = createPiece(type, position, quat, this.material, demo, fixed)
    this.pieces.push(piece)
    this.world.addBody(piece.body)
    this.scene.add(piece.mesh)
    return piece
  }
  spawn(type: PieceType) {
    const a = Math.random() * Math.PI * 2,
      q = new CANNON.Quaternion()
    q.setFromEuler(-Math.PI / 2, 0, a)
    return this.add(
      type,
      new CANNON.Vec3(Math.cos(a) * 9, 14, Math.sin(a) * 9),
      q,
    )
  }
  clear() {
    this.magnetics.clear()
    for (const p of this.pieces) {
      this.world.removeBody(p.body)
      disposePiece(p)
    }
    this.pieces.length = 0
  }
  buildHouse() {
    if (this.pieces.some((p) => p.demo)) return
    this.magnetics.clear()
    this.pieces.forEach((p, i) => {
      const a = (i * Math.PI) / 2
      p.body.position.set(Math.sin(a) * 24, 14, Math.cos(a) * 24)
      p.body.velocity.setZero()
      p.body.angularVelocity.setZero()
      p.body.aabbNeedsUpdate = true
      p.body.wakeUp()
    })
    const walls: Piece[] = [],
      roofs: Piece[] = []
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        q = new CANNON.Quaternion()
      q.setFromEuler(0, a, 0)
      walls.push(
        this.add(
          'square',
          new CANNON.Vec3(
            (Math.sin(a) * SIZE) / 2,
            SIZE / 2,
            (Math.cos(a) * SIZE) / 2,
          ),
          q,
          true,
        ),
      )
    }
    for (let i = 0; i < 4; i++)
      this.magnetics.lock(walls[i], walls[(i + 1) % 4])
    const tilt = -Math.atan(1 / Math.SQRT2)
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2,
        qy = new CANNON.Quaternion(),
        qx = new CANNON.Quaternion()
      qy.setFromEuler(0, a, 0)
      qx.setFromEuler(tilt, 0, 0)
      const q = qy.mult(qx)
      const p = this.add(
        'triangle_eq',
        new CANNON.Vec3(
          (Math.sin(a) * SIZE) / 3,
          SIZE * 1.236,
          (Math.cos(a) * SIZE) / 3,
        ),
        q,
        true,
      )
      roofs.push(p)
      this.magnetics.lock(p, walls[i])
      this.magnetics.lock(p, walls[(i + 1) % 4])
    }
    for (let i = 0; i < 4; i++)
      this.magnetics.lock(roofs[i], roofs[(i + 1) % 4])
  }
  private modelId = ''
  private loadedStep = -1
  private highlighted: Piece[] = []
  clearModel() {
    this.clear()
    this.modelId = ''
    this.loadedStep = -1
    this.highlighted = []
  }
  loadModel(recipe: ModelRecipe, uptoStep: number) {
    const target = Math.max(0, Math.min(uptoStep, recipe.steps.length - 1))
    if (this.modelId !== recipe.id || target < this.loadedStep) {
      this.clearModel()
      this.modelId = recipe.id
    }
    if (target === this.loadedStep) return
    for (let i = this.loadedStep + 1; i <= target; i++) {
      const added: Piece[] = []
      for (const data of recipe.steps[i].pieces) {
        const q = new CANNON.Quaternion()
        q.setFromEuler(...data.rot, 'XYZ')
        const [x,y,z] = data.pos
        added.push(this.add(data.type, new CANNON.Vec3(x,y,z), q, true, !!recipe.unstable))
      }
      this.highlighted = added
    }
    this.loadedStep = target
  }
  getStability() {
    return Math.max(0, ...this.pieces.filter(p => p.demo).map(p => p.body.velocity.length()))
  }
  pulseHighlight(time: number) {
    const intensity = 0.15 + 0.25 * (1 + Math.sin(time / 280))
    for (const p of this.pieces) {
      const m = p.mesh.material as THREE.MeshStandardMaterial
      m.emissive.setHex(this.highlighted.includes(p) ? 0xffcc55 : 0x000000)
      m.emissiveIntensity = this.highlighted.includes(p) ? intensity : 0
    }
  }
  setupAlignment() {
    this.clear()
    const flat = new CANNON.Quaternion()
    flat.setFromEuler(-Math.PI / 2, 0, 0)
    const base = this.add(
      'square',
      new CANNON.Vec3(0, 0.275, 0),
      flat,
      false,
      true,
    )
    const yaw = new CANNON.Quaternion()
    yaw.setFromEuler(Math.PI / 4, 0, 0)
    const moving = this.add(
      'square',
      new CANNON.Vec3(7.4, 3, 0.8),
      yaw.mult(flat),
    )
    const alignmentMaterial = new CANNON.Material('alignment')
    moving.body.material = alignmentMaterial
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(alignmentMaterial, this.material, {
        friction: 0.01,
        restitution: 0,
      }),
    )
    return { base, moving }
  }
  step(dt: number) {
    this.accumulator += Math.min(dt, 0.05)
    let count = 0
    while (this.accumulator >= FIXED && count++ < 6) {
      this.magnetics.apply(this.pieces)
      for (const p of this.pieces) {
        const v = p.body.velocity.length()
        if (v > 200) p.body.velocity.scale(200 / v, p.body.velocity)
      }
      this.world.step(FIXED)
      this.accumulator -= FIXED
    }
    for (const p of this.pieces) {
      p.mesh.position.copy(p.body.position)
      p.mesh.quaternion.copy(p.body.quaternion)
    }
  }
  dispose() {
    this.clear()
  }
}
