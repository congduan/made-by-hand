<script setup lang="ts">
defineEmits<{ demo: []; clear: [] }>()
</script>
<template>
  <header id="topbar" class="panel">
    <div>
      <h1>💎 CraftPlay · 做手工</h1>
      <small>水钻磁力片 · 真实物理拼搭</small>
    </div>
    <nav>
      <RouterLink to="/">磁力片</RouterLink
      ><RouterLink to="/origami">折纸</RouterLink
      ><RouterLink to="/papercraft">剪纸</RouterLink>
    </nav>
    <div class="actions">
      <button id="drop-demo" @click="$emit('demo')">🏠 一键演示·小房子</button
      ><button id="clear" @click="$emit('clear')">清空</button>
    </div>
  </header>
</template>
