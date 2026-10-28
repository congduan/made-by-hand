import { onUnmounted } from 'vue'
import type * as THREE from 'three'
import { MagnetWorld } from '../engine/magnets/world'

export function usePhysics() {
  let current: MagnetWorld | undefined
  function mount(scene: THREE.Scene) {
    current?.dispose()
    current = new MagnetWorld(scene)
    return current
  }
  onUnmounted(() => current?.dispose())
  return { mount }
}
