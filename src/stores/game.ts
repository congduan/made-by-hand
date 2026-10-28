import { defineStore } from 'pinia'
import type { CraftMode, PieceType, Tutorial } from '../types/game'
export const useGameStore = defineStore('game', {
  state: () => ({
    counts: {
      square: 0,
      triangle_eq: 0,
      triangle_right: 0,
      pentagon: 0,
    } as Record<PieceType, number>,
    tutorial: null as Tutorial,
    mode: 'magnets' as CraftMode,
  }),
  actions: {
    setCounts(types: PieceType[]) {
      for (const k of Object.keys(this.counts) as PieceType[])
        this.counts[k] = types.filter((t) => t === k).length
    },
    clear() {
      for (const k of Object.keys(this.counts) as PieceType[])
        this.counts[k] = 0
    },
  },
})
