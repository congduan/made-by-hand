<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { usePhysics } from '../composables/usePhysics'
import { CraftScene } from '../engine/craftScene'
import type { PieceType } from '../types/game'
import type { ModelRecipe } from '../data/models'

const root = ref<HTMLDivElement>()
const store = useGameStore()
const physicsLifecycle = usePhysics()
let craft: CraftScene | undefined
const sync = () => {
  if (craft) store.setCounts(craft.physics.pieces.map((p) => p.type))
}
function loadModel(recipe: ModelRecipe, step: number) { craft?.loadModel(recipe,step); sync() }
function getStability() { return craft?.getStability() ?? Infinity }
function spawn(type: PieceType) {
  craft?.physics.spawn(type)
  sync()
}
function clear() {
  craft?.physics.clear()
  sync()
}
function demo() {
  craft?.physics.buildHouse()
  sync()
}
defineExpose({ spawn, clear, demo, loadModel, getStability })
onMounted(() => {
  craft = new CraftScene(root.value!, physicsLifecycle.mount, sync)
  sync()
})
onUnmounted(() => craft?.dispose())
</script>
<template>
  <div ref="root" class="scene-canvas" aria-label="磁力片三维拼搭场景" />
</template>
