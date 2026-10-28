<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/game'
import SceneCanvas from '../components/SceneCanvas.vue'
import Toolbar from '../components/Toolbar.vue'
import PiecePalette from '../components/PiecePalette.vue'
import TutorialPanel from '../components/TutorialPanel.vue'
import HelpPanel from '../components/HelpPanel.vue'
const scene = ref<InstanceType<typeof SceneCanvas>>()
const store = useGameStore()
onMounted(() => {
  store.craftMode = 'magnets'
})
let timer: ReturnType<typeof setInterval> | undefined
let started = 0
watch(() => [store.currentRecipe?.id,store.stepIndex], () => {
  if (store.currentRecipe) { scene.value?.loadModel(store.currentRecipe,store.stepIndex);started=performance.now() }
}, { flush:'post' })
onMounted(() => { timer=setInterval(() => {
  const recipe=store.currentRecipe
  if (!recipe || !store.playing || store.mode!=='auto') return
  if (performance.now()-started < 350) return
  if (scene.value?.getStability()! < 5 || performance.now()-started >= 3000) {
    if (store.stepIndex < recipe.steps.length-1) store.stepIndex++
    else store.playing=false
  }
},100) })
onUnmounted(()=>{if(timer) clearInterval(timer)})
function clearAll() {store.resetDemo();scene.value?.clear()}
</script>
<template>
  <main class="craft">
    <SceneCanvas ref="scene" /><Toolbar
      @demo="scene?.demo()"
      @clear="clearAll()"
    /><TutorialPanel /><HelpPanel /><PiecePalette
      @spawn="(type) => scene?.spawn(type)"
    />
  </main>
</template>
