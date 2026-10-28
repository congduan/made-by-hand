import * as CANNON from 'cannon-es'
import type { Piece } from './pieces'
import { outline } from './pieces'
export const SAMPLE_COUNT = 9
export const BAR_LENGTH_RATIO = 0.7
export const F0 = 10
export const D0 = 0.6
export const SNAP_RANGE = 3.2
export const LOCK_K = 180
const COS_FACE = Math.cos((20 * Math.PI) / 180)
const SIN_PERP = Math.sin((20 * Math.PI) / 180)
const bars = new Map<string, CANNON.Vec3[][]>()
const normals = new Map<string, CANNON.Vec3[]>()
function edgeNormals(type: Piece['type']) {
  let result = normals.get(type)
  if (!result) {
    const vertices = outline(type)
    result = vertices.map((a, i) => {
      const b = vertices[(i + 1) % vertices.length],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        len = Math.hypot(dx, dy)
      return new CANNON.Vec3(dy / len, -dx / len, 0)
    })
    normals.set(type, result)
  }
  return result
}
export function barSamples(type: Piece['type']): CANNON.Vec3[][] {
  let result = bars.get(type)
  if (!result) {
    const vertices = outline(type)
    result = vertices.map((a, i) => {
      const b = vertices[(i + 1) % vertices.length]
      return Array.from({ length: SAMPLE_COUNT }, (_, j) => {
        const t =
          (1 - BAR_LENGTH_RATIO) / 2 +
          (BAR_LENGTH_RATIO * j) / (SAMPLE_COUNT - 1)
        return new CANNON.Vec3(
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          0,
        )
      })
    })
    bars.set(type, result)
  }
  return result
}
export class Magnetics {
  private locks = new Set<string>()
  constructor(private world: CANNON.World) {}
  get lockedCount() {
    return this.locks.size
  }
  private key(a: Piece, b: Piece) {
    return [a.body.id, b.body.id].sort((x, y) => x - y).join('_')
  }
  isLocked(a: Piece, b: Piece) {
    return this.locks.has(this.key(a, b))
  }
  lock(a: Piece, b: Piece) {
    const key = this.key(a, b)
    if (this.locks.has(key)) return
    this.world.addConstraint(new CANNON.LockConstraint(a.body, b.body))
    this.locks.add(key)
  }
  clear() {
    this.world.constraints
      .slice()
      .forEach((c) => this.world.removeConstraint(c))
    this.locks.clear()
  }
  apply(pieces: Piece[]) {
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i],
          b = pieces[j]
        if (
          this.isLocked(a, b) ||
          (a.demo && b.demo) ||
          (a.body.sleepState === CANNON.Body.SLEEPING &&
            b.body.sleepState === CANNON.Body.SLEEPING)
        )
          continue
        if (a.body.position.distanceTo(b.body.position) > 16) continue
        let near = 0
        const aa = barSamples(a.type),
          bb = barSamples(b.type),
          na = edgeNormals(a.type),
          nb = edgeNormals(b.type)
        const pa = new CANNON.Vec3(),
          pb = new CANNON.Vec3()
        for (let ia = 0; ia < aa.length; ia++)
          for (let ib = 0; ib < bb.length; ib++) {
            const edgeA = aa[ia],
              edgeB = bb[ib]
            const normalA = a.body.quaternion.vmult(na[ia]),
              normalB = b.body.quaternion.vmult(nb[ib])
            if (normalA.dot(normalB) > -0.5) continue
            a.body.pointToWorldFrame(edgeA[4], pa)
            b.body.pointToWorldFrame(edgeB[4], pb)
            if (pa.distanceTo(pb) > SNAP_RANGE + 5.5) continue
            for (const localA of edgeA)
              for (const localB of edgeB) {
                a.body.pointToWorldFrame(localA, pa)
                b.body.pointToWorldFrame(localB, pb)
                const dx = pb.x - pa.x,
                  dy = pb.y - pa.y,
                  dz = pb.z - pa.z
                const d2 = dx * dx + dy * dy + dz * dz
                if (d2 > SNAP_RANGE * SNAP_RANGE || d2 < 1e-16) continue // d < 1e-8: no direction
                const d = Math.sqrt(d2),
                  f = F0 * (D0 / d) ** 2
                const force = new CANNON.Vec3(
                  (dx / d) * f,
                  (dy / d) * f,
                  (dz / d) * f,
                )
                // cannon-es applyForce takes a point relative to center of mass.
                // The sampled world point is converted to that relative point, preserving torque.
                a.body.applyForce(force, pa.vsub(a.body.position))
                b.body.applyForce(force.scale(-1), pb.vsub(b.body.position))
                near += f
              }
          }
        if (near > F0 * 10) {
          if (a.body.mass > 0 && a.body.sleepState === CANNON.Body.SLEEPING)
            a.body.wakeUp()
          if (b.body.mass > 0 && b.body.sleepState === CANNON.Body.SLEEPING)
            b.body.wakeUp()
        }
        if (near > F0 * LOCK_K) {
          const nA = a.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1)),
            nB = b.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1))
          const dn = Math.abs(nA.dot(nB))
          const relativeSpeed = a.body.velocity.vsub(b.body.velocity).length()
          if ((dn > COS_FACE || dn < SIN_PERP) && relativeSpeed < 60)
            this.lock(a, b)
        }
      }
  }
}
