<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import SceneCanvas from '../components/SceneCanvas.vue'
import Toolbar from '../components/Toolbar.vue'
import PiecePalette from '../components/PiecePalette.vue'
import TutorialPanel from '../components/TutorialPanel.vue'
import HelpPanel from '../components/HelpPanel.vue'
const scene = ref<InstanceType<typeof SceneCanvas>>()
const store = useGameStore()
onMounted(() => {
  store.mode = 'magnets'
})
</script>
<template>
  <main class="craft">
    <SceneCanvas ref="scene" /><Toolbar
      @demo="scene?.demo()"
      @clear="scene?.clear()"
    /><TutorialPanel /><HelpPanel /><PiecePalette
      @spawn="(type) => scene?.spawn(type)"
    />
  </main>
</template>
