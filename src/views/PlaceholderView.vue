<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { watchEffect } from 'vue'
const props = defineProps<{ name: string }>()
const store = useGameStore()
watchEffect(() => {
  store.craftMode = props.name === '折纸' ? 'origami' : 'papercraft'
})
</script>
<template>
  <main class="placeholder">
    <h1>{{ name }}</h1>
    <p>即将开放</p>
    <RouterLink to="/">返回磁力片</RouterLink>
  </main>
</template>
