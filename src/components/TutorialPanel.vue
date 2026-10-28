<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
const store = useGameStore()
const recipe = computed(()=>store.currentRecipe)
const max = computed(()=>Math.max(0,(recipe.value?.steps.length||1)-1))
function step(n:number) {store.stepIndex=Math.min(max.value,Math.max(0,n));store.playing=false;store.mode='step'}
function play() { if (!recipe.value || recipe.value.unstable) return;store.mode='auto';store.playing=!store.playing }
function replay() {if (!recipe.value) return;store.stepIndex=0;store.mode=recipe.value.unstable?'step':'auto';store.playing=!recipe.value.unstable}
</script>
<template>
  <div v-if="recipe" id="tutbox" class="panel">
    <strong>{{ recipe.nameZh }}</strong> <span class="badge">{{ '★'.repeat(recipe.difficulty) }} · {{ recipe.age }}</span>
    <span v-if="!recipe.verified" class="badge warn">配方未验证</span>
    <div class="step-number">第 {{ store.stepIndex+1 }} / {{ recipe.steps.length }} 步</div>
    <div id="tut-info">{{ recipe.steps[store.stepIndex]?.hint }}</div>
    <div v-if="recipe.unstable" class="warn">该造型演示模式受物理限制，仅提供静态分步查看</div>
    <div class="tutorial-actions">
      <button id="step-prev" :disabled="store.stepIndex===0" @click="step(store.stepIndex-1)">上一步</button>
      <button id="step-next" :disabled="store.stepIndex===max" @click="step(store.stepIndex+1)">下一步</button>
      <button v-if="!recipe.unstable" id="auto-toggle" @click="play">{{ store.playing ? '暂停' : store.mode==='auto' ? '继续' : '连续演示' }}</button>
      <button id="replay" @click="replay">重播</button>
    </div>
    <input id="demo-progress" type="range" min="0" :max="max" :value="store.stepIndex" aria-label="跳转步骤" @input="step(Number(($event.target as HTMLInputElement).value))" />
    <div class="source">来源：{{ recipe.source }}</div>
  </div>
</template>
