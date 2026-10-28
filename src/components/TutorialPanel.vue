<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import type { Tutorial } from '../types/game'
const store = useGameStore()
const steps: Record<Exclude<Tutorial, null>, string> = {
  cube: '正方体：底部围四片，竖起侧面，顶部封口',
  pyramid: '四棱锥：四片三角形斜搭成尖',
  house: '小房子：四面墙加四片三角屋顶',
}
const description = computed(() =>
  store.tutorial ? steps[store.tutorial] : '',
)
function start() {
  store.tutorial = (document.getElementById('tut-sel') as HTMLSelectElement)
    .value as Exclude<Tutorial, null>
}
</script>
<template>
  <div id="tutbox" class="panel">
    <select id="tut-sel" aria-label="选择教程">
      <option value="cube">教程：正方体</option>
      <option value="pyramid">教程：四棱锥</option>
      <option value="house">教程：小房子</option></select
    ><button id="tut-btn" @click="start">开始</button>
    <div id="tut-info">{{ description }}</div>
  </div>
</template>
