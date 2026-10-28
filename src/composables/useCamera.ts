import * as THREE from 'three'
export function useCamera(
  canvas: HTMLElement,
  camera: THREE.PerspectiveCamera,
) {
  const state = {
    theta: Math.PI / 4,
    phi: Math.PI / 3.4,
    r: 42,
    target: new THREE.Vector3(0, 4, 0),
  }
  function update() {
    camera.position.set(
      state.target.x + state.r * Math.sin(state.phi) * Math.sin(state.theta),
      state.target.y + state.r * Math.cos(state.phi),
      state.target.z + state.r * Math.sin(state.phi) * Math.cos(state.theta),
    )
    camera.lookAt(state.target)
  }
  let orbit = false,
    lx = 0,
    ly = 0
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return
    orbit = true
    lx = e.clientX
    ly = e.clientY
  }
  const move = (e: PointerEvent) => {
    if (!orbit) return
    state.theta -= (e.clientX - lx) * 0.006
    state.phi = Math.min(
      Math.PI - 0.15,
      Math.max(0.25, state.phi - (e.clientY - ly) * 0.006),
    )
    lx = e.clientX
    ly = e.clientY
    update()
  }
  const up = () => {
    orbit = false
  }
  const wheel = (e: WheelEvent) => {
    state.r = Math.min(90, Math.max(14, state.r + e.deltaY * 0.03))
    update()
  }
  canvas.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  canvas.addEventListener('wheel', wheel, { passive: true })
  update()
  const dispose = () => {
    canvas.removeEventListener('pointerdown', down)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    canvas.removeEventListener('wheel', wheel)
  }
  return { state, update, dispose }
}
