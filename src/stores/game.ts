import { defineStore } from 'pinia'
import type { CraftMode, PieceType, Tutorial } from '../types/game'
import type { ModelRecipe } from '../data/models'
export const useGameStore = defineStore('game', {
  state: () => ({
    counts: { square: 0, triangle_eq: 0, triangle_right: 0, pentagon: 0 } as Record<PieceType,number>,
    tutorial: null as Tutorial,
    craftMode: 'magnets' as CraftMode,
    mode: 'free' as 'free'|'step'|'auto',
    stepIndex: 0,
    currentRecipe: null as ModelRecipe|null,
    playing: false,
  }),
  actions: {
    setCounts(types: PieceType[]) { for (const k of Object.keys(this.counts) as PieceType[]) this.counts[k] = types.filter(t=>t===k).length },
    clear() { for (const k of Object.keys(this.counts) as PieceType[]) this.counts[k]=0 },
    selectRecipe(recipe: ModelRecipe, mode: 'step'|'auto' = 'step') {
      this.currentRecipe=recipe; this.mode=recipe.unstable?'step':mode; this.stepIndex=0; this.playing=this.mode==='auto'
    },
    resetDemo() { this.currentRecipe=null; this.mode='free'; this.stepIndex=0; this.playing=false },
  },
})
