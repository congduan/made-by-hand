import * as THREE from 'three'
import { useCamera } from '../composables/useCamera'
import type { Piece } from './magnets/pieces'
import type { MagnetWorld } from './magnets/world'

export class CraftScene {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly physics: MagnetWorld
  private frame = 0
  private last = 0
  private cleanupInput = () => {}
  private cleanupCamera = () => {}
  private cleanupDebug = () => {}
  private observer: ResizeObserver
  private ground: THREE.Mesh
  private grid: THREE.GridHelper

  constructor(
    host: HTMLElement,
    mountPhysics: (scene: THREE.Scene) => MagnetWorld,
    onPiecesChanged: () => void,
  ) {
    this.scene.background = new THREE.Color(0x0b1020)
    this.scene.fog = new THREE.Fog(0x0b1020, 60, 160)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 1.1))
    const light = new THREE.DirectionalLight(0xffffff, 1.6)
    light.position.set(12, 24, 10)
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    Object.assign(light.shadow.camera, {
      left: -40,
      right: 40,
      top: 40,
      bottom: -40,
    })
    this.scene.add(light)
    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x131a30, roughness: 0.95 }),
    )
    this.ground.receiveShadow = true
    this.scene.add(this.ground)
    this.grid = new THREE.GridHelper(120, 40, 0x2a3a66, 0x1a2444)
    this.grid.position.y = 0.01
    this.scene.add(this.grid)
    this.camera = new THREE.PerspectiveCamera(
      50,
      host.clientWidth / host.clientHeight,
      0.1,
      500,
    )
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(host.clientWidth, host.clientHeight)
    this.renderer.shadowMap.enabled = false
    host.appendChild(this.renderer.domElement)
    this.cleanupCamera = useCamera(
      this.renderer.domElement,
      this.camera,
    ).dispose
    this.physics = mountPhysics(this.scene)
    this.installDrag()
    const resize = () => {
      this.camera.aspect = host.clientWidth / host.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(host.clientWidth, host.clientHeight)
    }
    window.addEventListener('resize', resize)
    this.observer = new ResizeObserver(resize)
    this.observer.observe(host)
    const tick = (time: number) => {
      this.physics.step(this.last ? (time - this.last) / 1000 : 0)
      this.last = time
      this.renderer.render(this.scene, this.camera)
      this.frame = requestAnimationFrame(tick)
    }
    this.frame = requestAnimationFrame(tick)
    for (let i = 0; i < 4; i++)
      this.physics.spawn(i % 2 ? 'square' : 'triangle_eq')
    this.installDebug(onPiecesChanged)
    const previousCleanup = this.cleanupInput
    this.cleanupInput = () => {
      previousCleanup()
      window.removeEventListener('resize', resize)
    }
  }

  private installDrag() {
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0))
    const hitPoint = new THREE.Vector3()
    const offset = new THREE.Vector3()
    let drag: Piece | undefined
    let dragHeight = 0
    const pick = (e: PointerEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect()
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(pointer, this.camera)
    }
    const down = (e: PointerEvent) => {
      pick(e)
      const hits = ray.intersectObjects(
        this.physics.pieces.filter((p) => !p.demo).map((p) => p.mesh),
        true,
      )
      if (!hits.length) return
      drag = this.physics.pieces.find(
        (p) => p.mesh === hits[0].object || p.mesh === hits[0].object.parent,
      )
      if (!drag) return
      drag.body.wakeUp()
      plane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        drag.mesh.position,
      )
      ray.ray.intersectPlane(plane, offset)
      offset.sub(drag.mesh.position)
      dragHeight = drag.mesh.position.y
      e.stopPropagation()
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      pick(e)
      if (ray.ray.intersectPlane(plane, hitPoint)) {
        hitPoint.sub(offset)
        drag.body.wakeUp()
        drag.body.velocity.set(
          (hitPoint.x - drag.body.position.x) * 12,
          (dragHeight - drag.body.position.y) * 12,
          (hitPoint.z - drag.body.position.z) * 12,
        )
      }
    }
    const up = () => {
      drag = undefined
    }
    this.renderer.domElement.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    this.cleanupInput = () => {
      this.renderer.domElement.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }

  private installDebug(onPiecesChanged: () => void) {
    const w = window as Window & {
      __dbg?: () => unknown
      __dbgRaw?: () => unknown
      __align?: () => unknown
      __alignState?: () => unknown
      __alignProbe?: () => unknown
    }
    w.__dbg = () => ({
      n: this.physics.pieces.length,
      constraints: this.physics.world.constraints.length,
      pieces: this.physics.pieces.map((p) => ({
        t: p.type,
        demo: p.demo,
        x: +p.body.position.x.toFixed(2),
        y: +p.body.position.y.toFixed(2),
        z: +p.body.position.z.toFixed(2),
        asleep: p.body.sleepState === 2,
        v: +p.body.velocity.length().toFixed(2),
      })),
      countsText: this.physics.pieces.map((p) => p.type),
    })
    w.__dbgRaw = () =>
      this.physics.pieces
        .filter((p) => p.demo)
        .map((p) => {
          const e = new THREE.Euler().setFromQuaternion(
            p.mesh.quaternion,
            'YXZ',
          )
          return {
            t: p.type,
            pos: p.mesh.position.toArray().map((v) => +v.toFixed(3)),
            rot: [e.x, e.y, e.z].map((v) => +((v * 180) / Math.PI).toFixed(2)),
          }
        })
    w.__align = () => {
      const pair = this.physics.setupAlignment()
      onPiecesChanged()
      return { base: pair.base.body.id, moving: pair.moving.body.id }
    }
    w.__alignProbe = () => {
      const p = this.physics.pieces[1]
      this.physics.magnetics.apply(this.physics.pieces)
      const result = {
        torque: p.body.torque.length(),
        force: p.body.force.length(),
      }
      p.body.force.setZero()
      p.body.torque.setZero()
      return result
    }
    w.__alignState = () => {
      const a = this.physics.pieces[0],
        b = this.physics.pieces[1]
      if (!a || !b) return null
      const qa = new THREE.Quaternion(
        a.body.quaternion.x,
        a.body.quaternion.y,
        a.body.quaternion.z,
        a.body.quaternion.w,
      )
      const qb = new THREE.Quaternion(
        b.body.quaternion.x,
        b.body.quaternion.y,
        b.body.quaternion.z,
        b.body.quaternion.w,
      )
      const edgeA = new THREE.Vector3(0, 0, 1).applyQuaternion(qa)
      const edgeB = new THREE.Vector3(0, 0, 1).applyQuaternion(qb)
      const angle =
        (Math.acos(Math.min(1, Math.abs(edgeA.dot(edgeB)))) * 180) / Math.PI
      return {
        base: [a.body.position.x, a.body.position.y, a.body.position.z],
        moving: [b.body.position.x, b.body.position.y, b.body.position.z],
        angle,
        locked: this.physics.magnetics.isLocked(a, b),
        speed: b.body.velocity.length(),
        angularSpeed: b.body.angularVelocity.length(),
      }
    }
    this.cleanupDebug = () => {
      delete w.__dbg
      delete w.__dbgRaw
      delete w.__align
      delete w.__alignState
      delete w.__alignProbe
    }
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.observer.disconnect()
    this.cleanupInput()
    this.cleanupCamera()
    this.cleanupDebug()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.ground.geometry.dispose()
    ;(this.ground.material as THREE.Material).dispose()
    this.grid.geometry.dispose()
    ;(this.grid.material as THREE.Material).dispose()
  }
}
