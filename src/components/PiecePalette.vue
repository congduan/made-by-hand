<script setup lang="ts">
import type { PieceType } from '../types/game'
import { PIECE_NAMES, PIECE_COLORS } from '../types/game'
import { useGameStore } from '../stores/game'
const store = useGameStore()
const types = Object.keys(PIECE_NAMES) as PieceType[]
defineEmits<{ spawn: [type: PieceType] }>()
</script>
<template>
  <div id="palette" class="panel">
    <button
      v-for="type in types"
      :key="type"
      :data-spawn="type"
      @click="$emit('spawn', type)"
    >
      <span
        class="sw"
        :style="{
          background: '#' + PIECE_COLORS[type].toString(16).padStart(6, '0'),
        }"
      /><span :id="'spawn-' + type"
        >{{ PIECE_NAMES[type] }} ×{{ store.counts[type] }}</span
      >
    </button>
  </div>
</template>
