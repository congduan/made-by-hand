<script setup lang="ts">
import { models } from '../data/models'
import { useGameStore } from '../stores/game'
const store = useGameStore()
defineEmits<{ demo: []; clear: [] }>()
function select(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const recipe = models.find(m=>m.id===id)
  if (recipe) store.selectRecipe(recipe)
}
</script>
<template>
  <header id="topbar" class="panel">
    <div><h1>💎 CraftPlay · 做手工</h1><small>水钻磁力片 · 真实物理拼搭</small></div>
    <nav><RouterLink to="/">磁力片</RouterLink><RouterLink to="/origami">折纸</RouterLink><RouterLink to="/papercraft">剪纸</RouterLink></nav>
    <div class="actions">
      <select id="model-select" aria-label="玩法库" :value="store.currentRecipe?.id || ''" @change="select">
        <option value="">玩法库 · 选择造型</option>
        <option v-for="model in models" :key="model.id" :value="model.id">{{ model.nameZh }} · {{ '★'.repeat(model.difficulty) }} {{ model.verified ? '已验证' : '配方未验证' }}</option>
      </select>
      <button id="drop-demo" @click="$emit('demo')">🏠 一键演示·小房子</button>
      <button id="clear" @click="$emit('clear')">清空</button>
    </div>
  </header>
</template>
