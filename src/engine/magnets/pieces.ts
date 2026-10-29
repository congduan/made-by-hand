import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import type { PieceType } from '../../types/game'
import { PIECE_COLORS } from '../../types/game'
export const SIZE = 7.5
export const THICK = 0.55
export interface Piece {
  type: PieceType
  mesh: THREE.Mesh
  body: CANNON.Body
  demo: boolean
}
export function outline(type: PieceType): [number, number][] {
  const s = SIZE / 2
  if (type === 'square')
    return [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s],
    ]
  if (type === 'triangle_eq')
    return [
      [0, (s * 2) / Math.sqrt(3)],
      [-s, -s / Math.sqrt(3)],
      [s, -s / Math.sqrt(3)],
    ]
  if (type === 'triangle_right')
    return [
      [-s, -s],
      [s, -s],
      [-s, s],
    ]
  const radius = SIZE / (2 * Math.sin(Math.PI / 5))
  return Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return [radius * Math.cos(a), radius * Math.sin(a)]
  })
}
const shapeCache = new Map<PieceType, CANNON.ConvexPolyhedron>()
const geoCache = new Map<PieceType, THREE.ExtrudeGeometry>()
function geometry(type: PieceType) {
  let geo = geoCache.get(type)
  if (!geo) {
    geo = new THREE.ExtrudeGeometry(
      new THREE.Shape(outline(type).map((p) => new THREE.Vector2(...p))),
      { depth: THICK, bevelEnabled: false },
    )
    geo.translate(0, 0, -THICK / 2)
    geoCache.set(type, geo)
  }
  return geo
}
function physicsShape(type: PieceType) {
  let shape = shapeCache.get(type)
  if (!shape) {
    const points = outline(type),
      n = points.length
    const vertices = [
      ...points.map((p) => new CANNON.Vec3(p[0], p[1], THICK / 2)),
      ...points.map((p) => new CANNON.Vec3(p[0], p[1], -THICK / 2)),
    ]
    const faces = [
      ...points.map((_, i) => [i, i + n, ((i + 1) % n) + n, (i + 1) % n]),
      Array.from({ length: n }, (_, i) => i),
      Array.from({ length: n }, (_, i) => 2 * n - 1 - i),
    ]
    shape = new CANNON.ConvexPolyhedron({ vertices, faces })
    shapeCache.set(type, shape)
  }
  return shape
}
const gemGeo = new THREE.OctahedronGeometry(0.38)
const gemMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.9,
  roughness: 0.12,
  emissive: 0x8888aa,
  emissiveIntensity: 0.25,
})
export function createPiece(
  type: PieceType,
  position: CANNON.Vec3,
  quaternion: CANNON.Quaternion,
  material: CANNON.Material,
  demo = false,
  fixed = false,
): Piece {
  const mesh = new THREE.Mesh(
    geometry(type),
    new THREE.MeshStandardMaterial({
      color: PIECE_COLORS[type],
      transparent: true,
      opacity: 0.68,
      roughness: 0.28,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  )
  mesh.castShadow = mesh.receiveShadow = true
  const edges = outline(type),
    gems = new THREE.InstancedMesh(gemGeo, gemMat, edges.length * 2),
    dummy = new THREE.Object3D()
  let k = 0
  for (let i = 0; i < edges.length; i++)
    for (const t of [0.3, 0.7]) {
      const a = edges[i],
        b = edges[(i + 1) % edges.length]
      dummy.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0)
      dummy.rotation.set(i, i * 0.7, 0)
      dummy.updateMatrix()
      gems.setMatrixAt(k++, dummy.matrix)
    }
  gems.position.z = THICK / 2 + 0.05
  mesh.add(gems)
  const body = new CANNON.Body({
    mass: fixed ? 0 : 0.12,
    shape: physicsShape(type),
    material,
    allowSleep: true,
    sleepSpeedLimit: 1.2,
    sleepTimeLimit: 0.4,
  })
  body.position.copy(position)
  body.quaternion.copy(quaternion)
  body.linearDamping = 0.4
  body.angularDamping = 0.6
  mesh.position.copy(position)
  mesh.quaternion.copy(quaternion)
  return { type, mesh, body, demo }
}
export function disposePiece(piece: Piece) {
  ;(piece.mesh.material as THREE.Material).dispose()
  piece.mesh.removeFromParent()
}
